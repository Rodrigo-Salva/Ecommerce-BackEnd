import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getAllProducts, getAllCategories, API_URL, productAPI } from '../services/api';
import './Home.css';

const Home = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const categoriaParam = searchParams.get('categoria');
  
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(categoriaParam || 'todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      setError(null);

      try {
        const all = await getAllProducts();
        const results = all.results || all || [];
        
        let filteredProducts = results;
        
        if (categoriaParam && categoriaParam !== 'todos') {
          filteredProducts = results.filter(p => {
            const categorySlug = p.category?.slug || '';
            return categorySlug === categoriaParam;
          });
        }
        
        setProductos(filteredProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, [categoriaParam]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await getAllCategories();
        let cats = data.results || data || [];

        if (cats.length > 0 && typeof cats[0] === 'string') {
          const slugify = (s) =>
            s
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');

          cats = cats.map((name, idx) => ({ id: idx + 1, slug: slugify(name), name, product_count: 0 }));
        }

        setCategorias(cats);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    };

    fetchCategorias();
  }, []);

  const filtrarPorCategoria = (categoriaSlug) => {
    setCategoriaActiva(categoriaSlug);
  };

  const handleProductHover = (slug) => {
    if (!slug) return;
    queryClient.prefetchQuery({
      queryKey: ['product', slug],
      queryFn: () => productAPI.getBySlug(slug),
      staleTime: 1000 * 60 * 5,
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content fade-in">
            <h1 className="hero-title">
              Transforma Tu Espacio con
              <span className="hero-accent"> Elegancia</span>
            </h1>
            <p className="hero-subtitle">
              Descubre muebles de diseño exclusivo que combinan estilo, confort y funcionalidad.
            </p>
            <div className="hero-actions">
              <a href="#productos" className="btn btn-primary">
                Explorar Colección
              </a>
              <a href="#categorias" className="btn btn-outline">
                Ver Categorías
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="categorias" className="categorias-section">
        <div className="container">
          <h2 className="section-title">Explora por Categoría</h2>
          <p className="section-subtitle">
            Encuentra exactamente lo que necesitas para cada espacio de tu hogar
          </p>

          <div className="categorias-grid">
            {categorias.map((cat) => (
              <Link
                key={cat.id}
                to={`/?categoria=${cat.slug}`}
                className="categoria-card"
                onClick={() => filtrarPorCategoria(cat.slug)}
              >
                <div className="categoria-overlay">
                  <h3 className="categoria-nombre">{cat.name}</h3>
                  <p className="categoria-descripcion">{cat.product_count} productos</p>
                  <span className="categoria-cta">Ver Productos →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="productos" className="productos-section">
        <div className="container">
          <div className="productos-header">
            <div>
              <h2 className="section-title">
                {categoriaActiva === 'todos' ? 'Todos los Productos' : 
                 categorias.find(c => c.slug === categoriaActiva)?.name || 'Productos'}
              </h2>
              <p className="section-subtitle">
                {productos.length} productos disponibles
              </p>
            </div>

            <div className="filtros">
              <button
                className={`filtro-btn ${categoriaActiva === 'todos' ? 'active' : ''}`}
                onClick={() => filtrarPorCategoria('todos')}
              >
                Todos
              </button>
              {categorias.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/?categoria=${cat.slug}`}
                  className={`filtro-btn ${categoriaActiva === cat.slug ? 'active' : ''}`}
                  onClick={() => filtrarPorCategoria(cat.slug)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="productos-grid">
            {productos.map((producto) => {
              const slugOrId = producto.slug || producto.id;
              const image = producto.primary_image || producto.image;
              const categoryName = producto.category?.name || producto.category || '';
              const price = producto.final_price || producto.price || 0;
              const rating = producto.average_rating || '0.0';

              return (
                <Link
                  key={producto.id || slugOrId}
                  to={`/producto/${slugOrId}`}
                  className="producto-card"
                  onMouseEnter={() => handleProductHover(producto.slug)}
                >
                  <div className="producto-imagen">
                    {image ? (
                      <img src={`${API_URL}${image}`} alt={producto.name || 'Producto'} />
                    ) : (
                      <div className="producto-placeholder">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="producto-info">
                    <div className="producto-categoria-tag">{categoryName}</div>
                    <h3 className="producto-nombre">{producto.name || 'Producto'}</h3>

                    <div className="producto-rating">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(parseFloat(rating)) ? 'star filled' : 'star'}>★</span>
                      ))}
                      <span className="rating-numero">({rating})</span>
                    </div>

                    <div className="producto-footer">
                      <div className="producto-precios">
                        <p className="producto-precio">${price}</p>
                      </div>
                      <button className="btn-ver-mas">Ver más →</button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7h-9"/>
                  <path d="M14 17H5"/>
                  <circle cx="17" cy="17" r="3"/>
                  <circle cx="7" cy="7" r="3"/>
                </svg>
              </div>
              <h3>Envío Gratis</h3>
              <p>En compras mayores a $1000</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Garantía Extendida</h3>
              <p>2 años en todos los productos</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <h3>Entrega Rápida</h3>
              <p>Recibe en 24-48 horas</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h3>Devoluciones Fáciles</h3>
              <p>30 días para devoluciones</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;