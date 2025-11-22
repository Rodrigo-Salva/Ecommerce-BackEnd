-- Limpiar datos existentes (opcional, solo si quieres empezar desde cero)
TRUNCATE TABLE users_address, users_userprofile, orders_coupon, orders_orderstatushistory, 
orders_orderitem, orders_order, cart_wishlist, cart_cartitem, cart_cart, 
products_review, products_productspecification, products_productimage, 
products_product_materials, products_product, products_material, products_brand, 
products_category, auth_user RESTART IDENTITY CASCADE;

-- Usuarios
INSERT INTO auth_user (id, username, password, email, first_name, last_name, is_staff, is_superuser, is_active, date_joined) VALUES
(1, 'alice', 'pbkdf2_sha256$390000$abcdef$0123456789abcdefghijklmnopqrstuvwxyzABCD', 'alice@example.com', 'Alice', 'Test', true, true, true, '2025-01-01 10:00:00'),
(2, 'bob', 'pbkdf2_sha256$390000$abcdef$0123456789abcdefghijklmnopqrstuvwxyzEFGH', 'bob@example.com', 'Bob', 'Example', false, false, true, '2025-02-15 15:00:00'),
(3, 'carol', 'pbkdf2_sha256$390000$abcdef$0123456789abcdefghijklmnopqrstuvwxyzIJKL', 'carol@example.com', 'Carol', 'User', false, false, true, '2025-03-10 11:30:00');

-- Categorías (order es palabra reservada, usar comillas)
INSERT INTO products_category (id, name, slug, description, image, parent_id, is_active, "order", created_at, updated_at) VALUES
(1, 'Sillas', 'sillas', 'Sillas de oficina', '', NULL, true, 0, NOW(), NOW()),
(2, 'Mesas', 'mesas', 'Mesas de centro', '', NULL, true, 1, NOW(), NOW()),
(3, 'Estanterías', 'estanterias', 'Estanterías y libreros', '', NULL, true, 2, NOW(), NOW());

-- Marcas
INSERT INTO products_brand (id, name, slug, logo, description, is_active, created_at) VALUES
(1, 'MueblesX', 'mueblesx', '', 'Marca de muebles de calidad', true, NOW()),
(2, 'LaCasa', 'lacasa', '', 'Muebles para el hogar', true, NOW()),
(3, 'DecoHome', 'decohome', '', 'Decoración moderna', true, NOW());

-- Materiales
INSERT INTO products_material (id, name, description) VALUES
(1, 'Madera', 'Madera natural'),
(2, 'Metal', 'Acero inoxidable'),
(3, 'Plástico', 'Material plástico durable');

-- Productos
INSERT INTO products_product (
  id, name, slug, sku, description, category_id, brand_id,
  price, discount_price, stock, min_stock, width, height, depth, weight,
  color, warranty_months, assembly_required, assembly_time_minutes,
  is_featured, is_active, is_new, views_count, created_at, updated_at
) VALUES
(1, 'Silla ergonómica', 'silla-ergonomica', 'SKU001', 'Silla cómoda', 1, 1, 59990, 49990, 10, 5, NULL, NULL, NULL, NULL, 'Negro', 12, false, NULL, true, true, false, 20, NOW(), NOW()),
(2, 'Mesa de centro', 'mesa-centro', 'SKU002', 'Mesa elegante', 2, 2, 89990, NULL, 5, 5, NULL, NULL, NULL, NULL, 'Madera', 12, false, NULL, false, true, true, 10, NOW(), NOW()),
(3, 'Estantería moderna', 'estanteria-moderna', 'SKU003', 'Estantería de diseño', 3, 3, 129990, 119990, 8, 5, NULL, NULL, NULL, NULL, 'Blanco', 12, true, NULL, false, true, true, 5, NOW(), NOW());

-- Producto-Material (ManyToMany)
INSERT INTO products_product_materials (id, product_id, material_id) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1),
(4, 2, 3),
(5, 3, 1),
(6, 3, 3);

-- Imágenes de producto (order es palabra reservada)
INSERT INTO products_productimage (id, product_id, image, is_primary, alt_text, "order", created_at) VALUES
(1, 1, 'products/silla1.jpg', true, 'Vista frontal', 0, NOW()),
(2, 2, 'products/mesa1.jpg', true, 'Mesa desde arriba', 0, NOW()),
(3, 3, 'products/estanteria1.jpg', true, 'Detalle estantería', 0, NOW());

-- Especificaciones del producto (order es palabra reservada)
INSERT INTO products_productspecification (id, product_id, name, value, "order") VALUES
(1, 1, 'Altura', '120 cm', 1),
(2, 2, 'Largo', '90 cm', 1),
(3, 3, 'Peso máximo', '50 kg', 1);

-- Reviews
INSERT INTO products_review (id, product_id, user_id, rating, title, comment, is_verified_purchase, is_approved, created_at, updated_at) VALUES
(1, 1, 1, 5, 'Excelente', 'Muy cómoda', true, true, NOW(), NOW()),
(2, 2, 2, 4, 'Buena mesa', 'Llegó rápido', true, true, NOW(), NOW()),
(3, 3, 3, 4, 'Estantería práctica', 'Buena calidad', true, true, NOW(), NOW());

-- Carrito
INSERT INTO cart_cart (id, user_id, session_id, created_at, updated_at, is_active) VALUES
(1, 1, NULL, NOW(), NOW(), true),
(2, 2, NULL, NOW(), NOW(), true),
(3, NULL, 'Anon123session', NOW(), NOW(), true);

-- Items del carrito
INSERT INTO cart_cartitem (id, cart_id, product_id, quantity, added_at) VALUES
(1, 1, 1, 2, NOW()),
(2, 2, 2, 1, NOW()),
(3, 3, 3, 3, NOW());

-- Wishlist
INSERT INTO cart_wishlist (id, user_id, product_id, added_at, notes) VALUES
(1, 1, 2, NOW(), 'Me gustaría para navidad'),
(2, 2, 1, NOW(), 'Parece cómoda'),
(3, 1, 3, NOW(), 'Ideal para la oficina');

-- Órdenes
INSERT INTO orders_order (
  id, user_id, order_number, full_name, email, phone, address_line1, address_line2,
  city, state, postal_code, country, subtotal, shipping_cost, tax, discount, total,
  status, payment_method, payment_id, is_paid, paid_at, order_notes, tracking_number,
  estimated_delivery, delivered_at, created_at, updated_at
) VALUES
(1, 1, 'ORD-001', 'Alice Test', 'alice@example.com', '+56912345678', 'Av. Principal 123', '', 'Santiago', 'RM', '1234567', 'Chile', 149980, 3990, 0, 10000, 143970, 'confirmed', 'credit_card', '', true, NOW(), '', 'TRACK001', '2025-12-01', NULL, NOW(), NOW()),
(2, 2, 'ORD-002', 'Bob Example', 'bob@example.com', '+56987654321', 'Calle Secundaria 456', '', 'Santiago', 'RM', '7654321', 'Chile', 89990, 0, 0, 0, 89990, 'pending', 'debit_card', '', false, NULL, '', NULL, NULL, NULL, NOW(), NOW()),
(3, 3, 'ORD-003', 'Carol User', 'carol@example.com', '+56911112222', 'Av. Central 789', '', 'Concepción', 'Bio Bio', '3456789', 'Chile', 129990, 0, 0, 0, 129990, 'processing', 'transfer', '', false, NULL, '', NULL, NULL, NULL, NOW(), NOW());

-- Items de Orden
INSERT INTO orders_orderitem (id, order_id, product_id, product_name, product_sku, product_price, quantity, subtotal, created_at) VALUES
(1, 1, 1, 'Silla ergonómica', 'SKU001', 49990, 2, 99980, NOW()),
(2, 1, 2, 'Mesa de centro', 'SKU002', 89990, 1, 89990, NOW()),
(3, 2, 2, 'Mesa de centro', 'SKU002', 89990, 1, 89990, NOW());

-- Historial de estados
INSERT INTO orders_orderstatushistory (id, order_id, status, comment, created_by_id, created_at) VALUES
(1, 1, 'confirmed', 'Pedido confirmado', 1, NOW()),
(2, 1, 'shipped', 'Pedido enviado', 1, NOW()),
(3, 3, 'processing', 'En preparación', 3, NOW());

-- Cupones
INSERT INTO orders_coupon (id, code, discount_type, discount_value, is_active, expires_at, usage_limit, used_count) VALUES
(1, 'NAVIDAD10', 'percent', 10.00, true, NULL, NULL, 0),
(2, 'BIENVENIDO5000', 'amount', 5000.00, true, NULL, NULL, 0),
(3, 'BLACKFRIDAY', 'percent', 20.00, true, NULL, NULL, 0);

-- Perfiles de usuario
INSERT INTO users_userprofile (id, user_id, phone, birth_date, avatar, default_address_line1, default_address_line2, default_city, default_state, default_postal_code, default_country, created_at, updated_at) VALUES
(1, 1, '+56912345678', NULL, '', 'Av. Principal 123', '', 'Santiago', 'RM', '1234567', 'Chile', NOW(), NOW()),
(2, 2, '+56987654321', NULL, '', 'Calle Secundaria 456', '', 'Santiago', 'RM', '7654321', 'Chile', NOW(), NOW()),
(3, 3, '+56911112222', NULL, '', 'Av. Central 789', '', 'Concepción', 'Bio Bio', '3456789', 'Chile', NOW(), NOW());

-- Direcciones
INSERT INTO users_address (id, user_id, label, address_line1, address_line2, city, state, postal_code, country, is_default, created_at, updated_at) VALUES
(1, 1, 'Casa', 'Av. Principal 123', '', 'Santiago', 'RM', '1234567', 'Chile', true, NOW(), NOW()),
(2, 2, 'Trabajo', 'Calle Secundaria 456', '', 'Santiago', 'RM', '7654321', 'Chile', true, NOW(), NOW()),
(3, 3, 'Casa', 'Av. Central 789', '', 'Concepción', 'Bio Bio', '3456789', 'Chile', true, NOW(), NOW());