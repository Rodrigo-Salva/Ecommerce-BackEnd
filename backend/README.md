# README - E-commerce de Muebles y Artículos del Hogar (Backend Django REST Framework)

## 📋 Descripción del Proyecto

API REST desarrollada con Django REST Framework para un e-commerce de muebles y artículos del hogar, similar a Sodimac. Esta API será consumida por una aplicación frontend en React.

## 🛠️ Stack Tecnológico

- **Framework:** Django 4.2.7
- **API:** Django REST Framework 3.14.0
- **Autenticación:** JWT (djangorestframework-simplejwt)
- **Base de Datos:** PostgreSQL
- **Almacenamiento de Imágenes:** Pillow
- **CORS:** django-cors-headers
- **Filtros:** django-filter
- **Documentación:** drf-yasg (Swagger)
- **PDFs:** ReportLab
- **Tareas Asíncronas:** Celery + Redis

## 📦 Instalación y Configuración

### Prerrequisitos

```bash
Python 3.10+
PostgreSQL 14+
Redis (para Celery)
```

### Instalación

```bash
# Clonar repositorio
git clone [URL_DEL_REPO]
cd home_store

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Crear base de datos
createdb home_store_db

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor de desarrollo
python manage.py runserver
```

## 📁 Estructura del Proyecto

```
home_store/
├── home_store/          # Configuración principal
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── users/               # Gestión de usuarios
├── products/            # Catálogo de productos
├── cart/                # Carrito y wishlist
├── orders/              # Órdenes y pagos
├── media/               # Archivos multimedia
├── requirements.txt
└── README.md
```

***

## 🎯 ROADMAP DE DESARROLLO

---

## 📱 APLICACIÓN: `users`

### Modelos a Implementar

#### **UserProfile**
```python
- user (OneToOneField → User)
- phone (CharField)
- birth_date (DateField)
- avatar (ImageField)
- default_address_line1 (CharField)
- default_address_line2 (CharField)
- default_city (CharField)
- default_state (CharField)
- default_postal_code (CharField)
- default_country (CharField)
- created_at (DateTimeField)
- updated_at (DateTimeField)
```

#### **Address** (Opcional)
```python
- user (ForeignKey → User)
- label (CharField) # "Casa", "Trabajo"
- address_line1 (CharField)
- address_line2 (CharField)
- city (CharField)
- state (CharField)
- postal_code (CharField)
- country (CharField)
- is_default (BooleanField)
```

### Serializers

- [ ] UserRegistrationSerializer
- [ ] UserLoginSerializer
- [ ] UserProfileSerializer
- [ ] UserUpdateSerializer
- [ ] AddressSerializer
- [ ] ChangePasswordSerializer
- [ ] PasswordResetSerializer

### Endpoints API

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/api/users/register/` | Registro de nuevo usuario | No |
| POST | `/api/users/login/` | Login (retorna JWT) | No |
| POST | `/api/users/token/refresh/` | Refrescar token | No |
| GET | `/api/users/profile/` | Obtener perfil | Sí |
| PUT | `/api/users/profile/` | Actualizar perfil | Sí |
| PATCH | `/api/users/profile/` | Actualización parcial | Sí |
| POST | `/api/users/change-password/` | Cambiar contraseña | Sí |
| POST | `/api/users/reset-password/` | Solicitar reset | No |
| POST | `/api/users/reset-password-confirm/` | Confirmar reset | No |
| GET | `/api/users/addresses/` | Listar direcciones | Sí |
| POST | `/api/users/addresses/` | Crear dirección | Sí |
| PUT | `/api/users/addresses/{id}/` | Actualizar dirección | Sí |
| DELETE | `/api/users/addresses/{id}/` | Eliminar dirección | Sí |

### Tareas de Desarrollo

#### Modelos
- [ ] Crear modelo `UserProfile` con relación OneToOne a User
- [ ] Implementar señal `post_save` para crear perfil automáticamente
- [ ] Crear modelo `Address` para múltiples direcciones
- [ ] Configurar upload de avatares con Pillow

#### Serializers
- [ ] Implementar `UserRegistrationSerializer` con validación de email único
- [ ] Crear validación de formato de teléfono
- [ ] Implementar validación de edad mínima (birth_date)
- [ ] Configurar campos read_only apropiados

#### Views/Viewsets
- [ ] Crear `UserRegistrationAPIView` que hashea contraseña
- [ ] Implementar `UserProfileViewSet` con permisos `IsAuthenticated`
- [ ] Crear endpoint de cambio de contraseña con validación
- [ ] Implementar reset de contraseña con tokens temporales
- [ ] Validar que usuario solo acceda a sus propios datos

#### Autenticación JWT
- [ ] Configurar `djangorestframework-simplejwt`
- [ ] Establecer tiempo de expiración de tokens (ACCESS: 1 día, REFRESH: 7 días)
- [ ] Implementar rotación de refresh tokens
- [ ] Crear custom claims si es necesario

#### Email
- [ ] Configurar Django Email Backend (SMTP)
- [ ] Crear template HTML para email de bienvenida
- [ ] Crear template para reset de contraseña
- [ ] Implementar envío asíncrono con Celery (opcional)

#### Administración
- [ ] Registrar `UserProfile` en admin.py
- [ ] Registrar `Address` en admin.py
- [ ] Crear inline de Address en admin de User
- [ ] Configurar list_display, list_filter, search_fields

#### Testing
- [ ] Tests de registro de usuario
- [ ] Tests de login y JWT
- [ ] Tests de actualización de perfil
- [ ] Tests de cambio de contraseña
- [ ] Tests de permisos

***

## 🛍️ APLICACIÓN: `products`

### Modelos a Implementar

#### **Category**
```python
- name (CharField)
- slug (SlugField, unique)
- description (TextField)
- image (ImageField)
- parent (ForeignKey → self, nullable) # Categorías anidadas
- is_active (BooleanField)
- order (IntegerField)
- created_at (DateTimeField)
- updated_at (DateTimeField)
```

#### **Brand**
```python
- name (CharField)
- slug (SlugField, unique)
- logo (ImageField)
- description (TextField)
- is_active (BooleanField)
- created_at (DateTimeField)
```

#### **Material**
```python
- name (CharField) # "Madera", "Metal", "Tela"
- description (TextField)
```

#### **Product**
```python
- name (CharField)
- slug (SlugField, unique)
- sku (CharField) # Código de producto
- description (TextField)
- category (ForeignKey → Category)
- brand (ForeignKey → Brand, nullable)
- materials (ManyToManyField → Material)
- price (DecimalField)
- discount_price (DecimalField, nullable)
- stock (IntegerField)
- min_stock (IntegerField) # Para alertas
- width (DecimalField) # en cm
- height (DecimalField) # en cm
- depth (DecimalField) # en cm
- weight (DecimalField) # en kg
- color (CharField)
- warranty_months (IntegerField)
- assembly_required (BooleanField)
- assembly_time_minutes (IntegerField)
- is_featured (BooleanField)
- is_active (BooleanField)
- is_new (BooleanField)
- views_count (IntegerField)
- created_at (DateTimeField)
- updated_at (DateTimeField)
```

#### **ProductImage**
```python
- product (ForeignKey → Product)
- image (ImageField)
- is_primary (BooleanField)
- alt_text (CharField)
- order (IntegerField)
- created_at (DateTimeField)
```

#### **ProductSpecification**
```python
- product (ForeignKey → Product)
- name (CharField) # "Capacidad de carga"
- value (CharField) # "150 kg"
- order (IntegerField)
```

#### **Review**
```python
- product (ForeignKey → Product)
- user (ForeignKey → User)
- rating (IntegerField, choices 1-5)
- title (CharField)
- comment (TextField)
- is_verified_purchase (BooleanField)
- is_approved (BooleanField) # Moderación
- created_at (DateTimeField)
- updated_at (DateTimeField)
- Meta: unique_together = ('product', 'user')
```

### Serializers

- [ ] CategoryListSerializer
- [ ] CategoryDetailSerializer (con subcategorías)
- [ ] BrandSerializer
- [ ] MaterialSerializer
- [ ] ProductImageSerializer
- [ ] ProductSpecificationSerializer
- [ ] ProductListSerializer (campos resumidos)
- [ ] ProductDetailSerializer (completo)
- [ ] ProductCreateSerializer
- [ ] ProductUpdateSerializer
- [ ] ReviewSerializer
- [ ] ReviewCreateSerializer

### Endpoints API

#### Categorías

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/products/categories/` | Listar categorías | Public |
| GET | `/api/products/categories/{slug}/` | Detalle de categoría | Public |
| GET | `/api/products/categories/{slug}/subcategories/` | Subcategorías | Public |
| POST | `/api/products/categories/` | Crear categoría | Admin |
| PUT | `/api/products/categories/{slug}/` | Actualizar | Admin |
| DELETE | `/api/products/categories/{slug}/` | Eliminar | Admin |

#### Marcas

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/products/brands/` | Listar marcas | Public |
| GET | `/api/products/brands/{slug}/` | Detalle de marca | Public |
| POST | `/api/products/brands/` | Crear marca | Admin |

#### Productos

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/products/` | Listar productos | Public |
| GET | `/api/products/{slug}/` | Detalle de producto | Public |
| POST | `/api/products/` | Crear producto | Admin |
| PUT | `/api/products/{slug}/` | Actualizar producto | Admin |
| PATCH | `/api/products/{slug}/` | Actualización parcial | Admin |
| DELETE | `/api/products/{slug}/` | Eliminar producto | Admin |
| GET | `/api/products/featured/` | Productos destacados | Public |
| GET | `/api/products/new/` | Productos nuevos | Public |
| GET | `/api/products/best-sellers/` | Más vendidos | Public |
| GET | `/api/products/{slug}/related/` | Productos relacionados | Public |
| POST | `/api/products/{slug}/increment-view/` | Incrementar vistas | Public |

#### Filtros y Búsqueda

```
GET /api/products/search/?q=mesa
GET /api/products/?category=muebles
GET /api/products/?brand=ikea
GET /api/products/?min_price=100&max_price=500
GET /api/products/?color=azul
GET /api/products/?materials=madera
GET /api/products/?ordering=-created_at
GET /api/products/?ordering=price
```

#### Reviews

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/products/{slug}/reviews/` | Reviews del producto | Public |
| POST | `/api/products/{slug}/reviews/` | Crear review | Authenticated |
| PUT | `/api/products/reviews/{id}/` | Actualizar review | Owner |
| DELETE | `/api/products/reviews/{id}/` | Eliminar review | Owner |
| GET | `/api/users/my-reviews/` | Mis reviews | Authenticated |

### Tareas de Desarrollo

#### Modelos
- [ ] Crear todos los modelos con relaciones correctas
- [ ] Implementar property `final_price` en Product
- [ ] Implementar property `discount_percentage` en Product
- [ ] Implementar método `average_rating` en Product
- [ ] Crear índices en campos de búsqueda (Meta indexes)
- [ ] Configurar unique_together en Review

#### Señales
- [ ] Señal pre_save para generar slug automático
- [ ] Señal post_save para ProductImage (solo una primary)
- [ ] Señal para actualizar average_rating al crear review

#### Serializers
- [ ] Implementar SerializerMethodField para datos calculados
- [ ] Configurar diferentes serializers según acción (list/detail)
- [ ] Implementar validación de stock en serializers
- [ ] Validar formato de dimensiones y peso

#### Filtros y Búsqueda
- [ ] Crear FilterSet con django-filter para filtros complejos
- [ ] Implementar SearchFilter (nombre, descripción, SKU)
- [ ] Implementar OrderingFilter (precio, fecha, nombre, rating)
- [ ] Crear filtros custom por rango de precio
- [ ] Filtro por categoría (incluyendo subcategorías)
- [ ] Filtro por marca
- [ ] Filtro por materiales
- [ ] Filtro por disponibilidad (stock > 0)

#### Viewsets
- [ ] Crear ProductViewSet con diferentes serializers por acción
- [ ] Implementar acción custom `featured` con @action
- [ ] Implementar acción custom `new` con @action
- [ ] Implementar acción custom `best_sellers` con @action
- [ ] Implementar acción custom `related` con @action
- [ ] Crear método para incrementar contador de vistas

#### Permisos
- [ ] Crear permiso custom `IsAdminOrReadOnly`
- [ ] Implementar permiso `IsOwnerOrAdmin` para reviews
- [ ] Validar que solo usuarios que compraron puedan hacer review

#### Optimización
- [ ] Usar select_related('category', 'brand') en queries
- [ ] Usar prefetch_related('materials', 'images') en queries
- [ ] Implementar paginación personalizada
- [ ] Configurar throttling para búsquedas

#### Administración
- [ ] Registrar todos los modelos en admin.py
- [ ] Crear inline de ProductImage en admin de Product
- [ ] Crear inline de ProductSpecification en admin
- [ ] Configurar list_display con campos clave
- [ ] Implementar list_filter por categoría, marca, stock
- [ ] Configurar search_fields (nombre, sku, descripción)
- [ ] Crear actions custom (marcar como destacado, activar/desactivar)

#### Testing
- [ ] Tests de creación de productos
- [ ] Tests de filtros y búsqueda
- [ ] Tests de reviews y ratings
- [ ] Tests de permisos
- [ ] Tests de stock validation

***

## 🛒 APLICACIÓN: `cart`

### Modelos a Implementar

#### **Cart**
```python
- user (ForeignKey → User, nullable) # Para carritos anónimos
- session_id (CharField) # Para usuarios no autenticados
- created_at (DateTimeField)
- updated_at (DateTimeField)
- is_active (BooleanField)
```

#### **CartItem**
```python
- cart (ForeignKey → Cart)
- product (ForeignKey → Product)
- quantity (IntegerField)
- added_at (DateTimeField)
- Meta: unique_together = ('cart', 'product')
```

#### **Wishlist**
```python
- user (ForeignKey → User)
- product (ForeignKey → Product)
- added_at (DateTimeField)
- notes (TextField, opcional)
- Meta: unique_together = ('user', 'product')
```

### Serializers

- [ ] CartItemSerializer
- [ ] CartSerializer (con items anidados y total)
- [ ] CartItemCreateSerializer
- [ ] CartItemUpdateSerializer
- [ ] WishlistSerializer
- [ ] WishlistCreateSerializer

### Endpoints API

#### Carrito

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/api/cart/` | Obtener carrito actual | Opcional |
| POST | `/api/cart/items/` | Agregar producto | Opcional |
| PUT | `/api/cart/items/{id}/` | Actualizar cantidad | Opcional |
| PATCH | `/api/cart/items/{id}/` | Actualización parcial | Opcional |
| DELETE | `/api/cart/items/{id}/` | Eliminar item | Opcional |
| DELETE | `/api/cart/clear/` | Vaciar carrito | Opcional |
| POST | `/api/cart/merge/` | Fusionar carritos | Sí |

#### Wishlist

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/api/wishlist/` | Obtener wishlist | Sí |
| POST | `/api/wishlist/` | Agregar producto | Sí |
| DELETE | `/api/wishlist/{product_id}/` | Eliminar | Sí |
| POST | `/api/wishlist/{id}/move-to-cart/` | Mover a carrito | Sí |

### Tareas de Desarrollo

#### Modelos
- [ ] Crear modelo Cart con soporte para usuarios anónimos
- [ ] Implementar property `total_price` en Cart
- [ ] Implementar property `total_items` en Cart
- [ ] Implementar property `subtotal` en CartItem
- [ ] Configurar unique_together en CartItem y Wishlist

#### Métodos de Negocio
- [ ] Crear método `get_or_create_cart` (por user o session)
- [ ] Método para obtener carrito de usuario anónimo
- [ ] Método para fusionar carrito anónimo con usuario autenticado
- [ ] Método para validar stock disponible

#### Serializers
- [ ] Implementar serializer con total calculado automáticamente
- [ ] Incluir información del producto en CartItemSerializer
- [ ] Validar cantidad mínima (1) en serializer
- [ ] Validar cantidad máxima (stock disponible)

#### Views/Viewsets
- [ ] Crear vista para obtener o crear carrito automáticamente
- [ ] Implementar validación de stock al agregar item
- [ ] Lógica para incrementar cantidad si producto ya existe
- [ ] Endpoint para actualizar cantidad con validaciones
- [ ] Endpoint para vaciar carrito completo
- [ ] Implementar fusión de carritos al login

#### Wishlist
- [ ] Crear CRUD de wishlist
- [ ] Método para mover item de wishlist a carrito
- [ ] Validar unique_together al agregar

#### Tareas Programadas
- [ ] Crear comando para limpiar carritos abandonados (>30 días)
- [ ] Configurar tarea de Celery para ejecutar limpieza

#### Permisos
- [ ] Permitir carritos anónimos
- [ ] Validar que usuario solo acceda a su carrito
- [ ] Validar que usuario solo acceda a su wishlist

#### Optimización
- [ ] Usar select_related('product') en CartItem queries
- [ ] Prefetch_related para optimizar carga de carritos

#### Administración
- [ ] Registrar Cart en admin
- [ ] Crear inline de CartItem en admin de Cart
- [ ] Registrar Wishlist en admin
- [ ] Configurar list_display y filters

#### Testing
- [ ] Tests de agregar al carrito
- [ ] Tests de actualizar cantidad
- [ ] Tests de validación de stock
- [ ] Tests de fusión de carritos
- [ ] Tests de wishlist

***

## 📦 APLICACIÓN: `orders`

### Modelos a Implementar

#### **Order**
```python
- user (ForeignKey → User)
- order_number (CharField, unique) # Auto-generado
- full_name (CharField)
- email (EmailField)
- phone (CharField)
- address_line1 (CharField)
- address_line2 (CharField)
- city (CharField)
- state (CharField)
- postal_code (CharField)
- country (CharField)
- subtotal (DecimalField)
- shipping_cost (DecimalField)
- tax (DecimalField)
- discount (DecimalField)
- total (DecimalField)
- status (CharField, choices)
- payment_method (CharField, choices)
- payment_id (CharField) # ID de transacción
- is_paid (BooleanField)
- paid_at (DateTimeField)
- order_notes (TextField)
- tracking_number (CharField, nullable)
- estimated_delivery (DateField)
- delivered_at (DateTimeField)
- created_at (DateTimeField)
- updated_at (DateTimeField)
```

**Status Choices:**
- `pending` - Pendiente
- `confirmed` - Confirmado
- `processing` - En Preparación
- `shipped` - Enviado
- `in_transit` - En Tránsito
- `delivered` - Entregado
- `cancelled` - Cancelado
- `refunded` - Reembolsado

**Payment Method Choices:**
- `credit_card` - Tarjeta de Crédito
- `debit_card` - Tarjeta de Débito
- `transfer` - Transferencia Bancaria
- `cash` - Efectivo en Entrega

#### **OrderItem**
```python
- order (ForeignKey → Order)
- product (ForeignKey → Product, SET_NULL)
- product_name (CharField) # Snapshot
- product_sku (CharField) # Snapshot
- product_price (DecimalField) # Snapshot del precio
- quantity (IntegerField)
- subtotal (DecimalField)
- created_at (DateTimeField)
```

#### **OrderStatusHistory**
```python
- order (ForeignKey → Order)
- status (CharField)
- comment (TextField)
- created_by (ForeignKey → User, nullable)
- created_at (DateTimeField)
```

#### **Coupon** (Opcional)
```python
- code (CharField, unique)
- discount_type (CharField, choices) # 'percentage', 'fixed'
- discount_value (DecimalField)
- min_purchase_amount (DecimalField)
- max_uses (IntegerField)
- used_count (IntegerField)
- valid_from (DateTimeField)
- valid_to (DateTimeField)
- is_active (BooleanField)
```

#### **CouponUsage**
```python
- coupon (ForeignKey → Coupon)
- user (ForeignKey → User)
- order (ForeignKey → Order)
- used_at (DateTimeField)
```

### Serializers

- [ ] OrderItemSerializer
- [ ] OrderCreateSerializer
- [ ] OrderListSerializer (resumido)
- [ ] OrderDetailSerializer (completo con historial)
- [ ] OrderUpdateSerializer (admin)
- [ ] OrderStatusUpdateSerializer
- [ ] OrderStatusHistorySerializer
- [ ] CouponSerializer
- [ ] CouponValidationSerializer

### Endpoints API

#### Órdenes del Usuario

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/orders/` | Listar mis órdenes | Authenticated |
| GET | `/api/orders/{order_number}/` | Detalle de orden | Owner |
| POST | `/api/orders/` | Crear orden | Authenticated |
| PUT | `/api/orders/{order_number}/cancel/` | Cancelar orden | Owner |
| GET | `/api/orders/{order_number}/invoice/` | Descargar PDF | Owner |

#### Admin

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/orders/all/` | Todas las órdenes | Admin |
| PUT | `/api/orders/{order_number}/status/` | Actualizar estado | Admin |
| PUT | `/api/orders/{order_number}/tracking/` | Añadir tracking | Admin |
| GET | `/api/orders/stats/` | Estadísticas | Admin |
| GET | `/api/orders/export/` | Exportar CSV | Admin |

#### Cupones

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/api/orders/validate-coupon/` | Validar cupón | Authenticated |
| GET | `/api/orders/coupons/` | Listar cupones | Public |
| POST | `/api/orders/coupons/` | Crear cupón | Admin |

### Tareas de Desarrollo

#### Modelos
- [ ] Crear modelo Order con todos los campos
- [ ] Implementar generación automática de `order_number` único
- [ ] Crear choices para `status` y `payment_method`
- [ ] Implementar validación de transiciones de estado
- [ ] Crear modelo OrderItem con snapshots
- [ ] Implementar property `subtotal` en OrderItem
- [ ] Crear modelo OrderStatusHistory para auditoría

#### Señales
- [ ] Señal pre_save para calcular totales automáticamente
- [ ] Señal post_save para crear historial de estado inicial
- [ ] Señal para enviar email al cambiar estado a "shipped"
- [ ] Señal para reducir stock al confirmar orden

#### Lógica de Creación de Orden
- [ ] Validar que el carrito no esté vacío
- [ ] Copiar items del carrito a OrderItem con snapshots
- [ ] Calcular subtotal sumando items del carrito
- [ ] Calcular shipping_cost según ubicación/peso
- [ ] Calcular tax (IVA 19% en Chile)
- [ ] Aplicar descuento si hay cupón válido
- [ ] Calcular total final
- [ ] Reducir stock de cada producto
- [ ] Vaciar carrito después de crear orden
- [ ] Enviar email de confirmación

#### Serializers
- [ ] Serializer de creación que valide datos
- [ ] Incluir items anidados en OrderDetailSerializer
- [ ] Incluir historial de estados en detalle
- [ ] Validar dirección de envío completa

#### Cálculos
- [ ] Método para calcular costo de envío por región
- [ ] Método para calcular impuestos
- [ ] Método para validar y aplicar cupones
- [ ] Validar cupón: fechas, usos, monto mínimo

#### Cancelación y Reembolsos
- [ ] Endpoint de cancelación con validaciones
- [ ] Solo permitir cancelar si status es 'pending' o 'confirmed'
- [ ] Restaurar stock al cancelar
- [ ] Crear registro en OrderStatusHistory
- [ ] Enviar email de confirmación de cancelación

#### Facturación
- [ ] Instalar ReportLab para PDFs
- [ ] Crear template de factura con diseño profesional
- [ ] Incluir logo, datos de empresa, items, totales
- [ ] Generar PDF y retornar como descarga

#### Viewsets y Permisos
- [ ] Crear OrderViewSet con permisos diferenciados
- [ ] Usuario solo puede ver sus propias órdenes
- [ ] Admin puede ver todas las órdenes
- [ ] Implementar acción custom para estadísticas
- [ ] Implementar acción custom para exportar

#### Filtros
- [ ] Filtro por status
- [ ] Filtro por rango de fechas
- [ ] Filtro por usuario (admin)
- [ ] Filtro por método de pago
- [ ] Ordenamiento por fecha, total

#### Estadísticas (Admin)
- [ ] Total de ventas por período
- [ ] Cantidad de órdenes por estado
- [ ] Ticket promedio
- [ ] Productos más vendidos
- [ ] Ingresos totales

#### Exportación
- [ ] Instalar django-import-export
- [ ] Crear recurso de exportación para Order
- [ ] Endpoint para descargar CSV con filtros
- [ ] Incluir información de items en exportación

#### Cupones
- [ ] CRUD de cupones para admin
- [ ] Endpoint de validación de cupón
- [ ] Validar código, fecha de vigencia, usos máximos
- [ ] Validar monto mínimo de compra
- [ ] Incrementar `used_count` al aplicar
- [ ] Crear registro en CouponUsage

#### Emails
- [ ] Template HTML para confirmación de orden
- [ ] Template para cambio de estado
- [ ] Template para cancelación
- [ ] Configurar envío asíncrono con Celery

#### Administración
- [ ] Registrar Order en admin
- [ ] Crear inline de OrderItem
- [ ] Crear inline de OrderStatusHistory
- [ ] Configurar list_display con campos clave
- [ ] list_filter por status, fecha, is_paid
- [ ] search_fields por order_number, email, nombre
- [ ] Action para marcar como pagado
- [ ] Action para exportar órdenes seleccionadas

#### Testing
- [ ] Tests de creación de orden
- [ ] Tests de cálculo de totales
- [ ] Tests de reducción de stock
- [ ] Tests de cancelación
- [ ] Tests de validación de cupones
- [ ] Tests de permisos

***

## ⚙️ CONFIGURACIÓN GENERAL

### settings.py

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_yasg',  # Swagger documentation
    
    # Local apps
    'users.apps.UsersConfig',
    'products.apps.ProductsConfig',
    'cart.apps.CartConfig',
    'orders.apps.OrdersConfig',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Tareas Generales

#### Configuración Inicial
- [ ] Crear proyecto Django
- [ ] Crear apps: users, products, cart, orders
- [ ] Configurar PostgreSQL como base de datos
- [ ] Instalar todas las dependencias
- [ ] Configurar variables de entorno con python-decouple
- [ ] Crear archivo .env.example

#### CORS y Seguridad
- [ ] Instalar y configurar django-cors-headers
- [ ] Configurar orígenes permitidos
- [ ] Configurar ALLOWED_HOSTS para producción
- [ ] Activar HTTPS en producción
- [ ] Configurar CSRF settings

#### REST Framework
- [ ] Configurar autenticación JWT
- [ ] Configurar permisos por defecto
- [ ] Configurar paginación global
- [ ] Configurar filtros y búsqueda
- [ ] Configurar throttling (rate limiting)

#### Archivos Estáticos y Media
- [ ] Configurar STATIC_URL y STATIC_ROOT
- [ ] Configurar MEDIA_URL y MEDIA_ROOT
- [ ] Crear carpetas media/ para uploads
- [ ] Configurar AWS S3 para producción (opcional)

#### URLs
- [ ] Configurar URLs principales en home_store/urls.py
- [ ] Crear urls.py en cada app
- [ ] Configurar endpoints de JWT
- [ ] Configurar Swagger UI en /swagger/

#### Documentación API
- [ ] Instalar drf-yasg
- [ ] Configurar Swagger
- [ ] Documentar endpoints con docstrings
- [ ] Configurar OpenAPI schema

#### Manejo de Errores
- [ ] Crear exception_handler personalizado
- [ ] Configurar respuestas de error consistentes
- [ ] Implementar logging de errores
- [ ] Configurar Sentry para monitoreo (producción)

#### Permisos Personalizados
- [ ] Crear `IsAdminOrReadOnly`
- [ ] Crear `IsOwnerOrAdmin`
- [ ] Crear `IsOwner`
- [ ] Aplicar permisos en viewsets

#### Señales (Signals)
- [ ] Señal para crear UserProfile al registrar
- [ ] Señal para generar slugs automáticamente
- [ ] Señal para actualizar stock
- [ ] Señal para enviar emails

#### Management Commands
- [ ] Comando para limpiar carritos antiguos
- [ ] Comando para generar datos de prueba (fixtures)
- [ ] Comando para recalcular ratings
- [ ] Comando para verificar stock bajo

#### Email
- [ ] Configurar Django Email Backend
- [ ] Configurar SMTP (Gmail/SendGrid)
- [ ] Crear templates HTML para emails
- [ ] Implementar envío asíncrono con Celery

#### Tareas Asíncronas (Celery)
- [ ] Instalar Celery y Redis
- [ ] Configurar Celery en proyecto
- [ ] Crear tarea para enviar emails
- [ ] Crear tarea para limpiar carritos
- [ ] Crear tarea para actualizar estadísticas

#### Testing
- [ ] Configurar pytest-django
- [ ] Crear fixtures de prueba
- [ ] Tests unitarios de modelos
- [ ] Tests de API endpoints
- [ ] Tests de permisos
- [ ] Tests de autenticación
- [ ] Configurar coverage

#### Optimización
- [ ] Implementar select_related donde sea necesario
- [ ] Implementar prefetch_related para relaciones M2M
- [ ] Crear índices en base de datos
- [ ] Configurar caché con Redis
- [ ] Optimizar queries N+1

#### Logging
- [ ] Configurar logging de Django
- [ ] Logs de errores
- [ ] Logs de acceso
- [ ] Logs de queries lentas

#### Base de Datos
- [ ] Crear migraciones iniciales
- [ ] Ejecutar migraciones
- [ ] Crear script de seed data
- [ ] Backup automático (producción)

#### Admin Django
- [ ] Personalizar Django Admin
- [ ] Configurar list_display en todos los modelos
- [ ] Configurar list_filter
- [ ] Configurar search_fields
- [ ] Crear inlines donde sea apropiado
- [ ] Crear actions personalizadas

#### Deployment
- [ ] Configurar settings para producción
- [ ] Configurar Gunicorn
- [ ] Configurar Nginx
- [ ] Configurar AWS S3 para media files
- [ ] Configurar PostgreSQL en producción
- [ ] Configurar variables de entorno
- [ ] Deploy en Railway/Heroku/DigitalOcean
- [ ] Configurar dominio y SSL
- [ ] Configurar monitoring

#### Documentación
- [ ] Completar README.md
- [ ] Documentar instalación
- [ ] Documentar estructura del proyecto
- [ ] Documentar API endpoints
- [ ] Crear guía de contribución
- [ ] Documentar modelos y relaciones

***

## 📋 requirements.txt

```txt
Django==4.2.7
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.0
django-filter==23.3
Pillow==10.1.0
python-decouple==3.8
psycopg2-binary==2.9.9
drf-yasg==1.21.7
reportlab==4.0.7
celery==5.3.4
redis==5.0.1
django-import-export==3.3.1
pytest-django==4.5.2
coverage==7.3.2
```

***

## 🔐 Variables de Entorno (.env)

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=home_store_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Email
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# AWS S3 (Production)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=your-bucket

# Stripe (Optional)
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

***

## 🚀 Comandos Útiles

```bash
# Crear migraciones
python manage.py makemigrations

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver

# Crear datos de prueba
python manage.py loaddata fixtures/categories.json
python manage.py loaddata fixtures/products.json

# Ejecutar tests
pytest

# Ver cobertura de tests
coverage run -m pytest
coverage report

# Limpiar carritos antiguos
python manage.py clean_old_carts

# Ejecutar Celery worker
celery -A home_store worker -l info

# Ejecutar Celery beat (tareas programadas)
celery -A home_store beat -l info
```

***

## 📚 Documentación API

Una vez el proyecto esté corriendo, la documentación interactiva de la API estará disponible en:

- **Swagger UI:** `http://localhost:8000/swagger/`
- **ReDoc:** `http://localhost:8000/redoc/`
- **Django Admin:** `http://localhost:8000/admin/`

***

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

***

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

***

## 👥 Equipo de Desarrollo

- **Backend Team:** [Nombres]
- **Frontend Team:** [Otro grupo]

***

## 📞 Contacto

Para preguntas o sugerencias, contactar a: [email]

***

**Última actualización:** Noviembre 2025

[1](https://github.com/rexgarland/markdown-plan)
[2](https://www.reddit.com/r/github/comments/1frjep0/can_you_share_an_example_of_a_great_publicly/)
[3](https://github.com/kamranahmedse/developer-roadmap)
[4](https://github.com/topics/markdown-template?o=desc&s=forks)
[5](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-roadmap-layout)
[6](https://www.pullchecklist.com/posts/ultimate-guide-github-markdown-checklist-project-management)
[7](https://github.com/logos-co/roadmap)
[8](https://github.com/NavigoLearn/RoadmapsMarkdown)
[9](https://github.com/github/roadmap)
[10](https://github.com/Ismaestro/markdown-template)