from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, validate_coupon

router = DefaultRouter()
router.register('', OrderViewSet, basename='orders')

urlpatterns = [
    path('validate-coupon/', validate_coupon, name='validate-coupon'),
    path('', include(router.urls)),
]
