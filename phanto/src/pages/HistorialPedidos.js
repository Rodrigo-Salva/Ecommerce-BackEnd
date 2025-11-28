// src/pages/HistorialPedidos.js
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom'; // Importamos Link
import { ordersAPI } from '../services/api';
import './HistorialPedidos.css';

const HistorialPedidos = () => {
  // Recuperamos el token para saber si hay usuario logueado
  const token = localStorage.getItem('token');

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders'],
    // Importante: Si tu función getMyOrders no lee el token de localStorage automáticamente,
    // debes asegurarte de que tu configuración de axios/fetch lo haga.
    // Si no, aquí podrías pasar el token si la función lo acepta.
    queryFn: ordersAPI.getMyOrders,
    enabled: !!token, // Solo ejecuta la query si hay token
    retry: false, // No reintentar si falla la autenticación
  });

  // Si no hay token, mostramos mensaje para iniciar sesión
  if (!token) {
    return (
      <div className="historial-page">
        <div className="container">
          <h1 className="historial-title">Mis Compras</h1>
          <div className="empty-state">
            <p>Debes iniciar sesión para ver tu historial.</p>
            <Link to="/login" className="btn-primary">Iniciar Sesión</Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="historial-page">
        <div className="container">
          <p>Cargando historial de compras...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="historial-page">
        <div className="container">
          <div className="error-message">
            <p>No se pudo cargar el historial.</p>
            {error.response?.status === 401 && (
                <p>Tu sesión ha expirado. <Link to="/login">Inicia sesión nuevamente</Link></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Aseguramos que orders sea un array (Django a veces devuelve { results: [...] })
  const orders = Array.isArray(data) ? data : (data?.results || []);

  return (
    <div className="historial-page">
      <div className="container">
        <h1 className="historial-title">Mis Compras</h1>

        {orders.length === 0 ? (
          <div className="historial-empty">
            <p>Aún no tienes compras registradas.</p>
            <Link to="/" className="btn-primary" style={{marginTop: '1rem', display: 'inline-block'}}>
                Ir a Comprar
            </Link>
          </div>
        ) : (
          <div className="historial-table-wrapper">
            <table className="historial-tabla">
              <thead>
                <tr>
                  <th>N° Orden</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id || order.order_number}>
                    <td>#{order.id || order.order_number}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>${parseFloat(order.total).toFixed(2)}</td>
                    <td>
                      <span className={`estado-badge estado-${order.status.toLowerCase()}`}>
                        {/* Traducir estados si es necesario */}
                        {order.status === 'confirmed' ? 'Confirmado' :
                         order.status === 'pending' ? 'Pendiente' :
                         order.status === 'cancelled' ? 'Cancelado' : order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialPedidos;
