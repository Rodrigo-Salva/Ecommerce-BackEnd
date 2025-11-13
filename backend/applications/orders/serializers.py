from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import Order, OrderItem, OrderStatusHistory, Coupon
from applications.products.models import Product

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'product_price', 'quantity', 'subtotal', 'created_at'
        ]
        read_only_fields = ['created_at', 'subtotal']

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = [
            'id', 'status', 'comment', 'created_by', 'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']

class OrderListSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'status', 'total', 'is_paid',
            'created_at', 'items'
        ]

class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    history = OrderStatusHistorySerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = '__all__'

class OrderCreateItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField()

    def validate(self, data):
        try:
            product = Product.objects.get(id=data['product_id'], is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Producto no encontrado o inactivo.")
        if data['quantity'] < 1:
            raise serializers.ValidationError("La cantidad debe ser al menos 1.")
        if data['quantity'] > product.stock:
            raise serializers.ValidationError(f"Stock insuficiente ({product.stock})")
        return data

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderCreateItemSerializer(many=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, write_only=True)
    class Meta:
        model = Order
        fields = [
            'full_name', 'email', 'phone',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
            'order_notes', 'items', 'coupon_code'
        ]
    
    def validate_items(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("Seleccione al menos un producto.")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        items_data = validated_data.pop('items')
        coupon_code = validated_data.pop('coupon_code', None)

        validated_data.pop('user', None)
        validated_data.pop('status', None)
        validated_data.pop('is_paid', None)
        validated_data.pop('paid_at', None)

        subtotal = Decimal('0')
        for item in items_data:
            product = Product.objects.get(id=item['product_id'])
            subtotal += product.final_price * item['quantity']

        shipping_cost = Decimal('10')
        tax = subtotal * Decimal('0.18')
        discount = Decimal('0')
        applied_coupon = None

        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code, is_active=True)
                if coupon.discount_type == 'amount':
                    discount = coupon.discount_value
                elif coupon.discount_type == 'percent':
                    discount = subtotal * (coupon.discount_value / 100)
                applied_coupon = coupon
            except Coupon.DoesNotExist:
                pass

        total = subtotal + shipping_cost + tax - discount

        order = Order.objects.create(
            user=user,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            tax=tax,
            discount=discount,
            total=total,
            status='confirmed',
            is_paid=True,
            paid_at=timezone.now(),
            **validated_data,
        )
        for item in items_data:
            product = Product.objects.get(id=item['product_id'])
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                product_sku=getattr(product, 'sku', ''),
                product_price=product.final_price,
                quantity=item['quantity'],
                subtotal=product.final_price * item['quantity'],
            )
            product.stock -= item['quantity']
            product.save()
        if applied_coupon:
            applied_coupon.used_count += 1
            applied_coupon.save()
        return order

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = "__all__"
