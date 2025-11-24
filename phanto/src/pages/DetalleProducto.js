import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import { useCart as useCartAPI } from '../hooks/useCart';
import { useProductDetail, useProducts } from '../hooks/useProducts';
import './DetalleProducto.css';

const DetalleProducto = () => {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const { addItemAsync, isAddingItem } = useCartAPI();
  const [cantidad, setCantidad] = useState(1);
  const [agregadoAlCarrito, setAgregadoAlCarrito] = useState(false);

  const isNumeric = /^\d+$/.test(slugOrId);

  const { data: productoBySlug, isLoading: loadingSlug } = useProductDetail(
    !isNumeric ? slugOrId : null
  );

  const { data: allProducts, isLoading: loadingAll } = useProducts();

  const isLoading = loadingSlug || loadingAll;

  let rawProduct = null;
  if (!isNumeric && productoBySlug) {
    rawProduct = productoBySlug;
  } else if (isNumeric && allProducts) {
    const results = allProducts.results || allProducts || [];
    rawProduct = results.find(p => p.id === parseInt(slugOrId));
  }

  const producto = rawProduct ? {
    id: rawProduct.id,
    slug: rawProduct.slug,
    nombre: rawProduct.name || rawProduct.nombre,
    precio: rawProduct.final_price || rawProduct.price || rawProduct.precio || 0,
    precio_unitario: rawProduct.price || rawProduct.precio || 0,
    stock: rawProduct.stock || 0,
    categoria: rawProduct.category?.name || rawProduct.categoria || '',
    descripcion: rawProduct.description || rawProduct.descripcion || '',
    caracteristicas: rawProduct.specifications?.map(s => `${s.name}: ${s.value}`) || rawProduct.specs || rawProduct.features || [],
    materiales: rawProduct.materials?.map(m => m.name).join(', ') || rawProduct.materiales || '',
    dimensiones: rawProduct.dimensions || rawProduct.dimensiones || (rawProduct.width ? `${rawProduct.width}x${rawProduct.height}x${rawProduct.depth} cm` : ''),
    rating: rawProduct.average_rating || rawProduct.rating || 0,
    primary_image: rawProduct.primary_image || rawProduct.image || '',
    images: rawProduct.images || [],
  } : null;

  const relacionados = allProducts && producto
    ? (allProducts.results || allProducts || [])
        .filter(p => p.category?.name === producto.categoria && p.id !== producto.id)
        .slice(0, 4)
        .map(p => ({ 
          id: p.id, 
          slug: p.slug,
          nombre: p.name, 
          precio: p.final_price || p.price || p.precio || 0,
          primary_image: p.primary_image
        }))
    : [];

  const handleCantidadChange = (tipo) => {
    if (!producto) return;
    
    if (tipo === 'incrementar' && cantidad < producto.stock) {
      setCantidad(cantidad + 1);
    } else if (tipo === 'decrementar' && cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  const handleAgregarAlCarrito = async () => {
    if (!producto) return;

    try {
      console.log('🔵 Intentando agregar al carrito:', {
        productId: producto.id,
        quantity: cantidad
      });

      // Usar addItemAsync para esperar la respuesta
      await addItemAsync({ 
        productId: producto.id, 
        quantity: cantidad 
      });
      
      console.log('✅ Producto agregado exitosamente');
      
      // Solo mostrar "Agregado" si la petición fue exitosa
      setAgregadoAlCarrito(true);
      setTimeout(() => {
        setAgregadoAlCarrito(false);
        setCantidad(1); // Resetear cantidad después de agregar
      }, 2000);

    } catch (error) {
      console.error('❌ Error al agregar al carrito:', error);
      console.error('Detalles:', error.message);
      
      // Opcional: Mostrar mensaje de error al usuario
      alert('No se pudo agregar el producto al carrito. Por favor, intenta de nuevo.');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Cargando producto...</p>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="error-container">
        <p>Producto no encontrado</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="detalle-producto fade-in">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Volver
          </Link>
        </div>

        <div className="detalle-grid">
          <div className="detalle-imagen-container">
            <div className="detalle-imagen">
              {producto.primary_image ? (
                <img 
                  src={`${API_URL}${producto.primary_image}`}
                  alt={producto.nombre}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="imagen-placeholder">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              )}
            </div>

            {producto.images && producto.images.length > 1 && (
              <div className="imagenes-miniaturas">
                {producto.images.slice(0, 4).map((img, index) => (
                  <div key={index} className="miniatura">
                    <img 
                      src={`${API_URL}${img.image}`}
                      alt={img.alt_text || `Imagen ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="detalle-info">
            <div className="producto-categoria-badge">
              {producto.categoria}
            </div>

            <h1 className="detalle-titulo">{producto.nombre}</h1>

            <div className="detalle-rating">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(producto.rating) ? 'star filled' : 'star'}>
                  ★
                </span>
              ))}
              <span className="rating-value">({producto.rating})</span>
            </div>

            <div className="detalle-precio">
              ${producto.precio}
            </div>

            <p className="detalle-descripcion">{producto.descripcion}</p>

            {producto.caracteristicas && producto.caracteristicas.length > 0 && (
              <div className="caracteristicas">
                <h3 className="caracteristicas-titulo">Características:</h3>
                <ul className="caracteristicas-lista">
                  {producto.caracteristicas.map((caract, index) => (
                    <li key={index} className="caracteristica-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      {caract}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="especificaciones">
              {producto.materiales && (
                <div className="especificacion-item">
                  <span className="especificacion-label">Materiales</span>
                  <span className="especificacion-valor">{producto.materiales}</span>
                </div>
              )}
              {producto.dimensiones && (
                <div className="especificacion-item">
                  <span className="especificacion-label">Dimensiones</span>
                  <span className="especificacion-valor">{producto.dimensiones}</span>
                </div>
              )}
            </div>

            <div className="cantidad-container">
              <label className="cantidad-label">Cantidad:</label>
              <div className="cantidad-controls">
                <button
                  className="cantidad-btn"
                  onClick={() => handleCantidadChange('decrementar')}
                  disabled={cantidad <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  value={cantidad}
                  readOnly
                  className="cantidad-input"
                />
                <button
                  className="cantidad-btn"
                  onClick={() => handleCantidadChange('incrementar')}
                  disabled={cantidad >= producto.stock}
                >
                  +
                </button>
              </div>
              <span className="stock-info">
                {producto.stock} disponibles
              </span>
            </div>

            <button
              className={`btn-agregar-carrito ${agregadoAlCarrito ? 'agregado' : ''}`}
              onClick={handleAgregarAlCarrito}
              disabled={isAddingItem || agregadoAlCarrito}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {isAddingItem ? 'Agregando...' : agregadoAlCarrito ? 'Agregado al Carrito ✓' : `Agregar al Carrito - $${producto.precio * cantidad}`}
            </button>

            <div className="info-adicional">
              <div className="info-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7h-9"/>
                  <path d="M14 17H5"/>
                  <circle cx="17" cy="17" r="3"/>
                  <circle cx="7" cy="7" r="3"/>
                </svg>
                <span>Envío gratis en compras +$1000</span>
              </div>
              <div className="info-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Garantía de 2 años</span>
              </div>
              <div className="info-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Devolución en 30 días</span>
              </div>
            </div>
          </div>
        </div>

        {relacionados.length > 0 && (
          <section className="productos-relacionados">
            <h2 className="section-title">Productos Relacionados</h2>
            <div className="relacionados-grid">
              {relacionados.map(p => (
                <Link key={p.id} to={`/producto/${p.slug || p.id}`} className="relacionado-card">
                  <div className="relacionado-imagen">
                    {p.primary_image ? (
                      <img 
                        src={`${API_URL}${p.primary_image}`}
                        alt={p.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="imagen-placeholder-small">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="relacionado-info">
                    <h4>{p.nombre}</h4>
                    <p className="relacionado-precio">${p.precio}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default DetalleProducto;