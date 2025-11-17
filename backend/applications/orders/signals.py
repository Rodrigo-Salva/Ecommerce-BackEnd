from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Order, OrderStatusHistory, OrderItem
from applications.products.models import Product


# ==========================================================
# 1) Recalcular totales siempre que un OrderItem cambia
# ==========================================================
def recalc_order_totals(order: Order):
    items = order.items.all()
    subtotal = sum(item.subtotal for item in items)

    tax = subtotal * 0.18  # IVA 18%
    total = subtotal + order.shipping_cost + tax - order.discount

    order.subtotal = subtotal
    order.tax = tax
    order.total = total
    order.save(update_fields=['subtotal', 'tax', 'total'])


@receiver(post_save, sender=OrderItem)
def orderitem_saved(sender, instance, **kwargs):
    """Recalcular totales cuando se crea o edita un OrderItem."""
    recalc_order_totals(instance.order)


@receiver(post_delete, sender=OrderItem)
def orderitem_deleted(sender, instance, **kwargs):
    """Recalcular totales cuando un OrderItem se elimina."""
    recalc_order_totals(instance.order)


# ==========================================================
# 2) Historial de estado en creación de la orden
# ==========================================================
@receiver(post_save, sender=Order)
def create_status_history(sender, instance, created, **kwargs):
    if created:
        OrderStatusHistory.objects.create(
            order=instance,
            status=instance.status,
            comment='Orden creada',
            created_by=instance.user
        )


# ==========================================================
# 3) Actualizar stock cuando la orden se crea por primera vez
# ==========================================================
@receiver(post_save, sender=Order)
def update_stock(sender, instance, created, **kwargs):
    if created:
        for item in instance.items.all():
            product = item.product
            if product:
                new_stock = max(product.stock - item.quantity, 0)
                product.stock = new_stock
                product.save(update_fields=['stock'])
