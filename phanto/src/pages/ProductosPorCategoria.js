import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCategoryProducts, useCategoryDetail } from '../hooks/useCategories';
import { API_URL, productAPI } from '../services/api';
import './ProductosPorCategoria.css';

const ProductosPorCategoria = () => {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  const { data: categoryData, isLoading: categoryLoading } = useCategoryDetail(slug);
  const { data: productsData, isLoading: productsLoading, error } = useCategoryProducts(slug);

  const isLoading = categoryLoading || productsLoading;

  const handleProductHover = (productSlug) => {
    if (!productSlug) return;
    queryClient.prefetchQuery({
      queryKey: ['product', productSlug],
      queryFn: () => productAPI.getBySlug(productSlug),
      staleTime: 1000 * 60 * 5,
    });
  };

  if (isLoading) {
    return (
      <div className="productos-categoria-page">
        <div className="container">
          <div className="loading-container">
            <p>Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="productos-categoria-page">
        <div className="container">
          <div className="error-container">
            <p>Error al cargar productos: {error.message}</p>
            <Link to="/categorias" className="btn btn-primary">
              Volver a Categorías
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const productos = productsData?.results || productsData || [];
  const categoria = categoryData || {};

  return (
    <div className="productos-categoria-page fade-in">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to="/categorias">Categorías</Link>
          <span>/</span>
          <span>{categoria.name}</span>
        </div>

        <div className="categoria-header">
          <h1 className="categoria-titulo-page">{categoria.name}</h1>
          <p className="categoria-productos-count">
            {productos.length} productos disponibles
          </p>
        </div>

        {productos.length === 0 ? (
          <div className="no-productos">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>No hay productos en esta categoría</h3>
            <Link to="/categorias" className="btn btn-primary">
              Ver Otras Categorías
            </Link>
          </div>
        ) : (
          <div className="productos-grid">
            {productos.map((producto) => (
              <Link
                key={producto.id}
                to={`/producto/${producto.slug}`}
                className="producto-card"
                onMouseEnter={() => handleProductHover(producto.slug)}
              >
                <div className="producto-imagen">
                  {producto.primary_image ? (
                    <img 
                      src={`${API_URL}${producto.primary_image}`}
                      alt={producto.name}
                    />
                  ) : (
                    <div className="producto-placeholder">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    </div>
                  )}
                  {producto.is_new && (
                    <span className="badge-nuevo">Nuevo</span>
                  )}
                  {producto.discount_percentage && parseFloat(producto.discount_percentage) > 0 && (
                    <span className="badge-descuento">-{producto.discount_percentage}%</span>
                  )}
                </div>

                <div className="producto-info">
                  <h3 className="producto-nombre">{producto.name}</h3>
                  
                  <div className="producto-rating">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={i < Math.floor(parseFloat(producto.average_rating || 0)) ? 'star filled' : 'star'}
                      >
                        ★
                      </span>
                    ))}
                    <span className="rating-numero">({producto.average_rating || '0.0'})</span>
                  </div>

                  <div className="producto-footer">
                    <div className="producto-precios">
                      {producto.discount_price ? (
                        <>
                          <p className="producto-precio-original">${producto.price}</p>
                          <p className="producto-precio">${producto.final_price}</p>
                        </>
                      ) : (
                        <p className="producto-precio">${producto.price}</p>
                      )}
                    </div>
                    <button className="btn-ver-mas">
                      Ver más →
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductosPorCategoria;