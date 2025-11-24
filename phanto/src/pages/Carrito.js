import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '../hooks/useCart';
import { API_URL, productAPI } from '../services/api';
import { usePedidosEnEntrega } from '../hooks/usePedidosEnEntrega';
import { usePedidosCompletados } from '../hooks/usePedidosCompletados';
import './Carrito.css';

const Carrito = () => {
  const queryClient = useQueryClient();
  const { 
    cart, 
    isLoading, 
    error,
    updateItem,
    removeItem,
    clearCart,
    isUpdatingItem,
    isRemovingItem,
    isClearingCart
  } = useCart();

  const { enEntrega = [], isLoading: loadingEntrega } = usePedidosEnEntrega();
  const { completados = [], isLoading: loadingCompletados } = usePedidosCompletados();

  const handleProductHover = (slug) => {
    if (!slug) return;
    queryClient.prefetchQuery({
      queryKey: ['product', slug],
      queryFn: () => productAPI.getBySlug(slug),
      staleTime: 1000 * 60 * 5,
    });
  };

  const handleCantidadChange = (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateItem({ itemId, quantity: newQuantity });
    }
  };

  const handleRemoveItem = (itemId) => {
    if (window.confirm('¿Eliminar este producto del carrito?')) {
      removeItem(itemId);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de vaciar todo el carrito?')) {
      clearCart();
    }
  };

  // ------ PROCESO DE CHECKOUT -------
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError('');
    const user = JSON.parse(localStorage.getItem('user'));
    const items = cart?.items?.map(item => ({
      product_id: item.product?.id,
      quantity: item.quantity
    })) || [];
    const body = {
      full_name: user?.first_name + ' ' + user?.last_name,
      email: user?.email,
      phone: user?.phone || '',
      address_line1: user?.default_address_line1 || 'Sin dirección',
      address_line2: user?.default_address_line2 || '',
      city: user?.default_city || '',
      state: user?.default_state || '',
      postal_code: user?.default_postal_code || '',
      country: user?.default_country || '',
      order_notes: '',
      items
    };
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Error al crear la orden');
      }
      clearCart();
      window.location.href = '/historial';
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="carrito-page">
        <div className="container">
          <div className="loading-container">
            <p>Cargando carrito...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="carrito-page">
        <div className="container">
          <div className="error-container">
            <p>Error al cargar el carrito: {error.message}</p>
            <Link to="/" className="btn btn-primary">
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const totalPrice = parseFloat(cart?.total_price || 0);

  // ------ Si el carrito está vacío, muestra mensaje dinámico con historial ------
  if (cartItems.length === 0) {
    const pedidosEnCurso = enEntrega.length;
    const pedidosCompletados = completados.length;
    const tienePedidos = pedidosEnCurso > 0 || pedidosCompletados > 0;
    return (
      <div className="carrito-vacio">
        <div className="container">
          <div className="vacio-content fade-in">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <h2>Inicia tu próxima compra</h2>
            {loadingEntrega || loadingCompletados ? (
              <p>Cargando tu historial...</p>
            ) : tienePedidos ? (
              <p>
                Tu historial: {pedidosCompletados} pedido{pedidosCompletados !== 1 ? 's' : ''} completado{pedidosCompletados !== 1 ? 's' : ''}, {pedidosEnCurso} en curso.
              </p>
            ) : (
              <p>No tienes pedidos activos. Empieza comprando productos increíbles.</p>
            )}
            <Link to="/historial" className="btn btn-primary">
              Ver historial de pedidos
            </Link>
            <Link to="/" className="btn btn-primary">
              Explorar Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }
  // --------------------------------------------------------------------

  return (
    <div className="carrito-page fade-in">
      <div className="container">
        <div className="carrito-header">
          <h1 className="carrito-titulo">Carrito de Compras</h1>
          <button 
            className="btn-limpiar" 
            onClick={handleClearCart}
            disabled={isClearingCart}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            {isClearingCart ? 'Vaciando...' : 'Vaciar Carrito'}
          </button>
        </div>
        <div className="carrito-grid">
          <div className="carrito-items">
            {cartItems.map((item) => {
              const producto = item.product || {};
              const precio = parseFloat(producto.final_price || producto.price || 0);
              const cantidad = item.quantity || 1;
              const itemId = item.id;
              return (
                <div key={itemId} className="carrito-item">
                  <Link
                    to={`/producto/${producto.slug || producto.id}`}
                    className="item-imagen"
                    onMouseEnter={() => handleProductHover(producto.slug)}
                  >
                    {producto.primary_image ? (
                      <img 
                        src={`${API_URL}${producto.primary_image}`}
                        alt={producto.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="imagen-placeholder-carrito">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                      </div>
                    )}
                  </Link>
                  <div className="item-info">
                    <Link
                      to={`/producto/${producto.slug || producto.id}`}
                      className="item-nombre"
                      onMouseEnter={() => handleProductHover(producto.slug)}
                    >
                      {producto.name}
                    </Link>
                    <p className="item-categoria">{producto.category?.name}</p>
                    <p className="item-precio-unitario">${precio.toFixed(2)} c/u</p>
                  </div>
                  <div className="item-cantidad">
                    <button
                      className="cantidad-btn-carrito"
                      onClick={() => handleCantidadChange(itemId, cantidad, -1)}
                      disabled={isUpdatingItem}
                    >
                      −
                    </button>
                    <span className="cantidad-valor">{cantidad}</span>
                    <button
                      className="cantidad-btn-carrito"
                      onClick={() => handleCantidadChange(itemId, cantidad, 1)}
                      disabled={isUpdatingItem}
                    >
                      +
                    </button>
                  </div>
                  <div className="item-precio-total">
                    ${(precio * cantidad).toFixed(2)}
                  </div>
                  <button
                    className="item-eliminar"
                    onClick={() => handleRemoveItem(itemId)}
                    disabled={isRemovingItem}
                    title="Eliminar producto"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
          <div className="carrito-resumen">
            <h3 className="resumen-titulo">Resumen del Pedido</h3>
            <div className="resumen-detalles">
              <div className="resumen-linea">
                <span>Subtotal ({cart?.total_items || 0} productos)</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="resumen-linea">
                <span>Envío</span>
                <span className={totalPrice >= 1000 ? 'gratis' : ''}>
                  {totalPrice >= 1000 ? 'Gratis' : '$50.00'}
                </span>
              </div>
              {totalPrice >= 1000 && (
                <div className="envio-gratis-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  ¡Envío gratis aplicado!
                </div>
              )}
              <div className="resumen-divider"></div>
              <div className="resumen-linea total">
                <span>Total</span>
                <span>${(totalPrice + (totalPrice >= 1000 ? 0 : 50)).toFixed(2)}</span>
              </div>
            </div>
            <button
              className="btn-finalizar"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Procesando...' : 'Finalizar compra'}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14"/>
                <path d="M12 5l7 7-7 7"/>
              </svg>
            </button>
            {checkoutError && <div className="error-message">{checkoutError}</div>}
            <Link to="/" className="btn-continuar">
              Continuar Comprando
            </Link>
            <div className="garantias">
              <div className="garantia-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                <span>Pago seguro</span>
              </div>
              <div className="garantia-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Garantía de 2 años</span>
              </div>
              <div className="garantia-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Devolución gratis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carrito;
