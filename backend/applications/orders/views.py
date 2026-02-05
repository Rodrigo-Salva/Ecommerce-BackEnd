from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse
from django.db import transaction
from reportlab.pdfgen import canvas
import io
import stripe
from django.conf import settings
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
import logging

from .models import Order, Coupon
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer, CouponSerializer
)
from .permissions import IsOwner
from .utils import get_user_orders


# Config Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Logger para tracking
logger = logging.getLogger(__name__)


@extend_schema(tags=['Orders'])
class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    serializer_class = OrderListSerializer
    lookup_field = 'order_number'

    def get_queryset(self):
        """
        Optimiza las consultas relacionadas
        """
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        
        return Order.objects.filter(user=user).select_related(
            'user', 'coupon'
        ).prefetch_related(
            'items__product'
        ).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderDetailSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        return OrderListSerializer

    def perform_create(self, serializer):
        """
        Asignar usuario automáticamente al crear desde el ViewSet
        """
        serializer.save(
            user=self.request.user,
            status='confirmed', 
            is_paid=True, 
            paid_at=timezone.now()
        )

    @action(detail=True, methods=['put'], url_path='cancel')
    def cancel_order(self, request, order_number=None):
        """
        Cancelar orden y restaurar stock usando transacción atómica
        """
        order = get_object_or_404(
            Order.objects.select_related('user').prefetch_related('items__product'),
            order_number=order_number, 
            user=request.user
        )
        
        if order.status not in ['pending', 'confirmed']:
            return Response(
                {"error": "No se puede cancelar esta orden"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            order.status = 'cancelled'
            order.save(update_fields=['status'])
            
            for item in order.items.select_for_update().all():
                if item.product:
                    item.product.stock += item.quantity
                    item.product.save(update_fields=['stock'])
        
        logger.info(f"Order {order_number} cancelled by user {request.user.id}")
        return Response(
            {"message": "Orden cancelada y stock restaurado"}, 
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'], url_path='invoice')
    def get_invoice(self, request, order_number=None):
        """
        Generar factura en PDF
        """
        order = get_object_or_404(
            Order.objects.prefetch_related('items'),
            order_number=order_number, 
            user=request.user
        )
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        
        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 800, f"Factura: {order.order_number}")
        
        # Info cliente
        p.setFont("Helvetica", 12)
        p.drawString(100, 780, f"Cliente: {order.full_name}")
        p.drawString(100, 760, f"Email: {order.email}")
        p.drawString(100, 740, f"Fecha: {order.created_at.strftime('%d/%m/%Y')}")
        
        # Items
        y = 710
        p.setFont("Helvetica-Bold", 11)
        p.drawString(100, y, "Producto")
        p.drawString(300, y, "Cantidad")
        p.drawString(400, y, "Precio")
        p.drawString(480, y, "Subtotal")
        
        y -= 20
        p.setFont("Helvetica", 10)
        
        for item in order.items.all():
            product_name = item.product_name[:25]
            subtotal = item.quantity * item.product_price
            
            p.drawString(100, y, product_name)
            p.drawString(310, y, str(item.quantity))
            p.drawString(400, y, f"S/ {item.product_price}")
            p.drawString(480, y, f"S/ {subtotal:.2f}")
            y -= 18
        
        # Total
        y -= 20
        p.setFont("Helvetica-Bold", 12)
        p.drawString(400, y, f"Total: S/ {order.total}")
        
        p.showPage()
        p.save()
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="factura_{order.order_number}.pdf"'
        return response


@extend_schema(
    tags=['Orders'],
    parameters=[
        OpenApiParameter(
            name='code',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='Código del cupón a validar'
        )
    ]
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def validate_coupon(request):
    """
    Validar cupón de descuento
    """
    code = request.data.get('code', '').strip().upper()
    
    if not code:
        return Response(
            {"valid": False, "error": "Código de cupón requerido"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        coupon = Coupon.objects.get(
            code=code,
            is_active=True,
            valid_from__lte=timezone.now(),
            valid_to__gte=timezone.now()
        )
        
        # Verificar límite de uso si existe
        if coupon.max_uses and coupon.times_used >= coupon.max_uses:
            return Response({
                "valid": False,
                "error": "Este cupón ha alcanzado su límite de uso"
            })
        
        return Response({
            "valid": True,
            "discount": str(coupon.discount_value),
            "type": coupon.discount_type,
            "code": coupon.code
        })
    except Coupon.DoesNotExist:
        return Response({
            "valid": False,
            "error": "Cupón inválido o expirado"
        })


@extend_schema(tags=['Payments'])
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent(request):
    """
    Crea un PaymentIntent de Stripe
    Body: { "amount": 20000, "order_data": {...} }
    """
    try:
        amount = request.data.get('amount')
        
        # Validaciones
        if not amount or not isinstance(amount, (int, float)):
            return Response(
                {"error": "El monto es requerido y debe ser numérico"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        amount = int(amount)
        
        if amount < 50:  # Mínimo de Stripe: 0.50 PEN
            return Response(
                {"error": "El monto mínimo es S/ 0.50"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Metadata mejorado
        metadata = {
            "user_id": str(request.user.id),
            "username": request.user.username,
            "email": request.user.email,
        }
        
        # Crear PaymentIntent con idempotency key
        idempotency_key = f"{request.user.id}-{timezone.now().timestamp()}"
        
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='pen',
            automatic_payment_methods={"enabled": True},
            metadata=metadata,
            description=f"Pedido de {request.user.username}",
            idempotency_key=idempotency_key
        )
        
        logger.info(f"PaymentIntent created: {intent.id} for user {request.user.id}")
        
        return Response(
            {
                "clientSecret": intent.client_secret,
                "paymentIntentId": intent.id
            },
            status=status.HTTP_200_OK
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        return Response(
            {"error": "Error al procesar el pago. Intente nuevamente."},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Payment intent error: {str(e)}")
        return Response(
            {"error": "Error interno del servidor"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(tags=['Payments'])
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_payment(request):
    """
    Confirma el pago y crea la orden
    Body:
    {
        "payment_intent_id": "pi_...",
        "order": { ...datos para OrderCreateSerializer... }
    }
    """
    try:
        payment_intent_id = request.data.get('payment_intent_id')
        order_data = request.data.get('order', {})
        
        if not payment_intent_id:
            return Response(
                {"error": "payment_intent_id es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar estado en Stripe
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving payment intent: {str(e)}")
            return Response(
                {"error": "PaymentIntent inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if intent.status != 'succeeded':
            return Response(
                {
                    "error": "Pago no completado",
                    "payment_status": intent.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que el monto coincida
        expected_amount = order_data.get('total')
        if expected_amount and int(float(expected_amount) * 100) != intent.amount:
            logger.warning(
                f"Amount mismatch: expected {expected_amount}, got {intent.amount/100}"
            )
            return Response(
                {"error": "El monto del pago no coincide"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear orden con transacción atómica
        with transaction.atomic():
            order_data['is_paid'] = True
            order_data['payment_method'] = 'stripe'
            order_data['payment_intent_id'] = payment_intent_id
            
            serializer = OrderCreateSerializer(
                data=order_data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                order = serializer.save(user=request.user)
                
                logger.info(
                    f"Order {order.order_number} created for user {request.user.id} "
                    f"with payment {payment_intent_id}"
                )
                
                return Response(
                    {
                        "message": "Orden creada exitosamente",
                        "order_number": order.order_number,
                        "order": OrderDetailSerializer(order).data,
                    },
                    status=status.HTTP_201_CREATED
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error confirming payment: {str(e)}")
        return Response(
            {"error": "Error al procesar la orden"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )