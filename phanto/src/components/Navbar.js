// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { usePedidosEnEntrega } from '../hooks/usePedidosEnEntrega'; // <--- IMPORTA SOLO UNA VEZ
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { enEntrega = [] } = usePedidosEnEntrega();  // Obtén los pedidos activos
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Calcula cantidad de items en el carrito
  const cartCount = cart?.items?.reduce((count, item) => count + (item.quantity || 0), 0) || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">◆</span>
          <span className="logo-text">Phaton</span>
        </Link>

        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            Inicio
          </Link>
          <Link to="/categorias" className="nav-link" onClick={() => setMenuOpen(false)}>
            Categorías
          </Link>
        </div>

        <div className="navbar-actions">
          <Link to="/carrito" className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          <Link to="/historial" className="nav-link">
            {enEntrega.length} pedidos en proceso de entrega
          </Link>

          {user ? (
            <div className="user-menu">
              <button className="user-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{user.first_name || user.nombre}</span>
              </button>
              <div className="dropdown-menu">
                <button onClick={handleLogout} className="dropdown-item">
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              Iniciar Sesión
            </Link>
          )}

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
