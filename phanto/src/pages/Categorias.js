import React from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories } from '../hooks/useCategories';
import { API_URL, categoryAPI } from '../services/api';
import './Categorias.css';

const Categorias = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useCategories();

  const handleCategoryHover = (slug) => {
    if (!slug) return;
    queryClient.prefetchQuery({
      queryKey: ['categoryProducts', slug],
      queryFn: () => categoryAPI.getProducts(slug),
      staleTime: 1000 * 60 * 5,
    });
  };

  if (isLoading) {
    return (
      <div className="categorias-page">
        <div className="container">
          <div className="loading-container">
            <p>Cargando categorías...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="categorias-page">
        <div className="container">
          <div className="error-container">
            <p>Error al cargar categorías: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const categorias = data?.results || data || [];

  return (
    <div className="categorias-page fade-in">
      <div className="container">
        <div className="categorias-hero">
          <h1 className="categorias-titulo">Explora Nuestras Categorías</h1>
          <p className="categorias-subtitulo">
            Encuentra los muebles perfectos para cada espacio de tu hogar
          </p>
        </div>

        <div className="categorias-grid">
          {categorias.map((categoria) => (
            <Link
              key={categoria.id}
              to={`/categoria/${categoria.slug}`}
              className="categoria-card"
              onMouseEnter={() => handleCategoryHover(categoria.slug)}
            >
              <div className="categoria-imagen-container">
                {categoria.image ? (
                  <img 
                    src={`${API_URL}${categoria.image}`}
                    alt={categoria.name}
                    className="categoria-imagen"
                  />
                ) : (
                  <div className="categoria-placeholder">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                )}
                <div className="categoria-overlay">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14"/>
                    <path d="M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>

              <div className="categoria-info">
                <h3 className="categoria-nombre">{categoria.name}</h3>
                <p className="categoria-cantidad">
                  {categoria.product_count || 0} productos
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="categorias-cta">
          <h2>¿No encuentras lo que buscas?</h2>
          <p>Explora todos nuestros productos</p>
          <Link to="/" className="btn btn-primary">
            Ver Todos los Productos
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Categorias;