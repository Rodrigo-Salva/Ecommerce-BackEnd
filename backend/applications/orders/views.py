from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse
from reportlab.pdfgen import canvas
import io

from .models import Order, Coupon
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer, CouponSerializer
)
from .permissions import IsOwner
from .utils import get_user_orders

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    serializer_class = OrderListSerializer
    lookup_field = 'order_number'

    def get_queryset(self):
        user = self.request.user
        return Order.objects.filter(user=user).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderDetailSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        return OrderListSerializer

    def perform_create(self, serializer):
        serializer.save(status='confirmed', is_paid=True, paid_at=timezone.now())

    @action(detail=True, methods=['put'], url_path='cancel')
    def cancel_order(self, request, order_number=None):
        order = get_object_or_404(Order, order_number=order_number, user=request.user)
        if order.status not in ['pending', 'confirmed']:
            return Response({"error": "No se puede cancelar esta orden"}, status=status.HTTP_400_BAD_REQUEST)
        order.status = 'cancelled'
        order.save()
        for item in order.items.all():
            if item.product:
                item.product.stock += item.quantity
                item.product.save()
        return Response({"message": "Orden cancelada y stock restaurado"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='invoice')
    def get_invoice(self, request, order_number=None):
        order = get_object_or_404(Order, order_number=order_number, user=request.user)
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 800, f"Factura: {order.order_number}")
        p.setFont("Helvetica", 12)
        p.drawString(100, 780, f"Cliente: {order.full_name}")
        p.drawString(100, 760, f"Fecha: {order.created_at.strftime('%d/%m/%Y')}")
        y = 740
        p.setFont("Helvetica-Bold", 11)
        p.drawString(100, y, "Producto     Cantidad     Precio")
        y -= 20
        p.setFont("Helvetica", 11)
        for item in order.items.all():
            p.drawString(100, y, f"{item.product_name[:15]:<15}{item.quantity:<10}{item.product_price:<8}")
            y -= 18
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y-10, f"Total: S/ {order.total}")
        p.showPage()
        p.save()
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def validate_coupon(request):
    code = request.data.get('code')
    try:
        coupon = Coupon.objects.get(code=code, is_active=True)
        return Response({
            "valid": True,
            "discount": str(coupon.discount_value),
            "type": coupon.discount_type
        })
    except Coupon.DoesNotExist:
        return Response({"valid": False, "discount": "0"})
