# Create your views here.
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from drf_spectacular.utils import extend_schema, extend_schema_view


from .models import Category, Brand, Material, Product, Review
from .serializers import (
    CategoryListSerializer, CategoryDetailSerializer,
    BrandSerializer, MaterialSerializer,
    ProductListSerializer, ProductDetailSerializer,
    ProductCreateSerializer, ProductUpdateSerializer,
    ReviewSerializer, ReviewCreateSerializer
)
from .filters import ProductFilter
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin

@extend_schema(tags=['Products'])
class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de categorías
    GET /api/products/categories/ - Listar categorías
    GET /api/products/categories/{slug}/ - Detalle de categoría
    POST /api/products/categories/ - Crear (admin)
    """
    queryset = Category.objects.filter(is_active=True)
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CategoryDetailSerializer
        return CategoryListSerializer
    
    @action(detail=True, methods=['get'])
    def subcategories(self, request, slug=None):
        """
        Obtener subcategorías de una categoría
        GET /api/products/categories/{slug}/subcategories/
        """
        category = self.get_object()
        subcategories = category.subcategories.filter(is_active=True)
        serializer = CategoryListSerializer(subcategories, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        """
        Obtener productos de una categoría
        GET /api/products/categories/{slug}/products/
        """
        category = self.get_object()
        products = Product.objects.filter(
            category=category,
            is_active=True
        ).select_related('category', 'brand').prefetch_related('images', 'materials')
        
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

@extend_schema(tags=['Products'])
class BrandViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de marcas
    """
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']


@extend_schema(tags=['Products'])
class MaterialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet solo lectura para materiales
    """
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


@extend_schema(tags=['Products'])
class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para productos con filtros y búsqueda
    """
    queryset = Product.objects.filter(is_active=True).select_related(
        'category', 'brand'
    ).prefetch_related(
        'materials', 'images', 'specifications', 'reviews'
    )
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['price', 'created_at', 'name', 'views_count']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        elif self.action in ['create']:
            return ProductCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProductUpdateSerializer
        return ProductListSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """
        Incrementa contador de vistas al ver detalle
        """
        instance = self.get_object()
        instance.increment_views()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Productos destacados
        GET /api/products/featured/
        """
        products = self.get_queryset().filter(is_featured=True)[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def new(self, request):
        """
        Productos nuevos
        GET /api/products/new/
        """
        products = self.get_queryset().filter(is_new=True).order_by('-created_at')[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def best_sellers(self, request):
        """
        Productos más vendidos (por ahora por vistas)
        GET /api/products/best-sellers/
        TODO: Implementar basado en ventas reales cuando se integre orders
        """
        products = self.get_queryset().order_by('-views_count')[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        """
        Productos relacionados (misma categoría)
        GET /api/products/{slug}/related/
        """
        product = self.get_object()
        related_products = self.get_queryset().filter(
            category=product.category
        ).exclude(id=product.id)[:6]
        
        serializer = ProductListSerializer(related_products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def increment_view(self, request, slug=None):
        """
        Incrementar contador de vistas
        POST /api/products/{slug}/increment-view/
        """
        product = self.get_object()
        product.increment_views()
        return Response({'views_count': product.views_count})
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, slug=None):
        """
        Obtener reviews de un producto
        GET /api/products/{slug}/reviews/
        """
        product = self.get_object()
        reviews = product.reviews.filter(is_approved=True).order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)


@extend_schema(tags=['Products'])
class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de reviews
    """
    queryset = Review.objects.filter(is_approved=True)
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ReviewCreateSerializer
        return ReviewSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        product_slug = self.request.query_params.get('product', None)
        if product_slug:
            queryset = queryset.filter(product__slug=product_slug)
        return queryset
    
    def perform_create(self, serializer):
        """
        Crear review y verificar si es compra verificada
        TODO: Implementar verificación real con orders
        """
        serializer.save(
            user=self.request.user,
            is_verified_purchase=False  # Cambiar cuando se integre con orders
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_reviews(self, request):
        """
        Obtener reviews del usuario autenticado
        GET /api/products/reviews/my-reviews/
        """
        reviews = Review.objects.filter(user=request.user)
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)