from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Prefetch
from django.db import transaction
from django.core.exceptions import ValidationError
import logging

from .models import Cart, CartItem, Wishlist
from .serializers import (
    CartSerializer, CartItemSerializer, CartItemCreateSerializer,
    CartItemUpdateSerializer, WishlistSerializer, WishlistCreateSerializer
)
from drf_spectacular.utils import extend_schema
from applications.products.models import Product


logger = logging.getLogger(__name__)


@extend_schema(tags=['Cart'])
class CartViewSet(viewsets.ViewSet):
    """ViewSet para gestionar el carrito"""
    
    def get_permissions(self):
        return [AllowAny()]
    
    def get_cart(self, request):
        """
        Obtiene o crea el carrito del usuario o sesión
        Optimizado con prefetch_related
        """
        if request.user.is_authenticated:
            cart, created = Cart.objects.prefetch_related(
                Prefetch(
                    'items',
                    queryset=CartItem.objects.select_related('product')
                )
            ).get_or_create(user=request.user, is_active=True)
        else:
            session_id = request.session.session_key
            if not session_id:
                request.session.create()
                session_id = request.session.session_key
            
            cart, created = Cart.objects.prefetch_related(
                Prefetch(
                    'items',
                    queryset=CartItem.objects.select_related('product')
                )
            ).get_or_create(session_id=session_id, is_active=True)
        
        return cart
    
    def list(self, request):
        """
        Obtener el carrito actual
        GET /api/cart/
        """
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='items')
    def add_item(self, request):
        """
        Agregar producto al carrito con transacción atómica
        POST /api/cart/items/
        """
        serializer = CartItemCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        
        # Validar cantidad mínima
        if quantity <= 0:
            return Response(
                {"error": "La cantidad debe ser mayor a 0"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                cart = self.get_cart(request)
                
                # Usar select_for_update para evitar race conditions
                product = Product.objects.select_for_update().get(
                    id=product_id,
                    is_active=True
                )
                
                # Verificar disponibilidad
                if not product.is_available or product.stock <= 0:
                    return Response(
                        {"error": f"{product.name} no está disponible"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Intentar obtener item existente con lock
                try:
                    cart_item = CartItem.objects.select_for_update().select_related(
                        'product'
                    ).get(cart=cart, product_id=product_id)
                    
                    new_quantity = cart_item.quantity + quantity
                    
                    # Validar stock disponible
                    if new_quantity > product.stock:
                        return Response({
                            "error": f"Stock insuficiente. Solo hay {product.stock} unidades disponibles."
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    cart_item.quantity = new_quantity
                    cart_item.save(update_fields=['quantity'])
                    message = "Cantidad actualizada en el carrito"
                    
                except CartItem.DoesNotExist:
                    # Validar stock para nuevo item
                    if quantity > product.stock:
                        return Response({
                            "error": f"Stock insuficiente. Solo hay {product.stock} unidades disponibles."
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    cart_item = CartItem.objects.create(
                        cart=cart,
                        product=product,
                        quantity=quantity
                    )
                    message = f"{product.name} agregado al carrito"
                
                # Refrescar cart para obtener totales actualizados
                cart.refresh_from_db()
                
                item_serializer = CartItemSerializer(cart_item, context={'request': request})
                
                logger.info(f"Item added to cart: product_id={product_id}, quantity={quantity}")
                
                return Response({
                    "message": message,
                    "item": item_serializer.data,
                    "cart_total": cart.total_price,
                    "cart_items_count": cart.total_items
                }, status=status.HTTP_201_CREATED)
        
        except Product.DoesNotExist:
            return Response(
                {"error": "Producto no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error adding item to cart: {str(e)}")
            return Response(
                {"error": "Error al agregar producto al carrito"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['put', 'patch'], url_path='update')
    def update_item(self, request, pk=None):
        """
        Actualizar cantidad de un item del carrito
        PUT/PATCH /api/cart/{id}/update/
        """
        serializer = CartItemUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        new_quantity = serializer.validated_data.get('quantity')
        
        if new_quantity and new_quantity <= 0:
            return Response(
                {"error": "La cantidad debe ser mayor a 0"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                cart = self.get_cart(request)
                
                # Obtener item con lock
                cart_item = CartItem.objects.select_for_update().select_related(
                    'product'
                ).get(id=pk, cart=cart)
                
                product = cart_item.product
                
                # Validar stock
                if new_quantity > product.stock:
                    return Response({
                        "error": f"Stock insuficiente. Solo hay {product.stock} unidades disponibles."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Validar disponibilidad
                if not product.is_available:
                    return Response({
                        "error": f"{product.name} ya no está disponible"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                cart_item.quantity = new_quantity
                cart_item.save(update_fields=['quantity'])
                
                cart.refresh_from_db()
                
                return Response({
                    "message": "Cantidad actualizada",
                    "item": CartItemSerializer(cart_item, context={'request': request}).data,
                    "cart_total": cart.total_price,
                    "cart_items_count": cart.total_items
                })
        
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item no encontrado en el carrito"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating cart item: {str(e)}")
            return Response(
                {"error": "Error al actualizar el item"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'], url_path='remove')
    def remove_item(self, request, pk=None):
        """
        Eliminar item del carrito
        DELETE /api/cart/{id}/remove/
        """
        try:
            with transaction.atomic():
                cart = self.get_cart(request)
                
                cart_item = CartItem.objects.select_related('product').get(
                    id=pk,
                    cart=cart
                )
                
                product_name = cart_item.product.name
                cart_item.delete()
                
                cart.refresh_from_db()
                
                return Response({
                    "message": f"{product_name} eliminado del carrito",
                    "cart_total": cart.total_price,
                    "cart_items_count": cart.total_items
                })
        
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item no encontrado en el carrito"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error removing cart item: {str(e)}")
            return Response(
                {"error": "Error al eliminar el item"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['delete'], url_path='clear')
    def clear_cart(self, request):
        """
        Vaciar todo el carrito
        DELETE /api/cart/clear/
        """
        try:
            with transaction.atomic():
                cart = self.get_cart(request)
                items_count = cart.items.count()
                cart.items.all().delete()
                
                return Response({
                    "message": f"Carrito vaciado. {items_count} productos eliminados.",
                    "cart_total": 0,
                    "cart_items_count": 0
                })
        except Exception as e:
            logger.error(f"Error clearing cart: {str(e)}")
            return Response(
                {"error": "Error al vaciar el carrito"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema(tags=['Wishlist'])
class WishlistViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar la lista de deseos"""
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Optimizar consultas con select_related
        """
        return Wishlist.objects.filter(
            user=self.request.user
        ).select_related('product')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WishlistCreateSerializer
        return WishlistSerializer
    
    def perform_create(self, serializer):
        """
        Crear item en wishlist verificando duplicados
        """
        product_id = serializer.validated_data.get('product').id
        
        # Verificar si ya existe
        if Wishlist.objects.filter(
            user=self.request.user,
            product_id=product_id
        ).exists():
            raise ValidationError("Este producto ya está en tu lista de deseos")
        
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='move-to-cart')
    def move_to_cart(self, request, pk=None):
        """
        Mover producto de wishlist al carrito
        POST /api/wishlist/{id}/move-to-cart/
        """
        try:
            with transaction.atomic():
                wishlist_item = self.get_queryset().select_related(
                    'product'
                ).get(pk=pk)
                
                product = wishlist_item.product
                
                # Validar disponibilidad y stock
                if not product.is_available or product.stock <= 0:
                    return Response({
                        "error": f"{product.name} no está disponible actualmente"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Obtener o crear carrito
                cart, _ = Cart.objects.get_or_create(
                    user=request.user,
                    is_active=True
                )
                
                # Obtener o crear item con lock
                cart_item, created = CartItem.objects.select_for_update().get_or_create(
                    cart=cart,
                    product=product,
                    defaults={'quantity': 1}
                )
                
                if not created:
                    # Validar stock antes de incrementar
                    if cart_item.quantity + 1 > product.stock:
                        return Response({
                            "error": f"Stock insuficiente. Solo hay {product.stock} unidades disponibles."
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    cart_item.quantity += 1
                    cart_item.save(update_fields=['quantity'])
                
                # Eliminar de wishlist
                wishlist_item.delete()
                
                cart.refresh_from_db()
                
                return Response({
                    "message": f"{product.name} movido al carrito",
                    "cart_total": cart.total_price,
                    "cart_items_count": cart.total_items
                })
        
        except Wishlist.DoesNotExist:
            return Response(
                {"error": "Producto no encontrado en la lista de deseos"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error moving item to cart: {str(e)}")
            return Response(
                {"error": "Error al mover el producto al carrito"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )