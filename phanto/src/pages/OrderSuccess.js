// src/pages/OrderSuccess.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const OrderSuccess = () => {
  const location = useLocation();
  // Recuperamos los datos enviados desde Checkout
  const { orderId, total, items } = location.state || {};

  return (
    <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Icono de éxito */}
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: '#d1fae5', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <span style={{ fontSize: '40px', color: '#059669' }}>✓</span>
        </div>

        <h1 style={{ color: '#1f2933', fontSize: '2.5rem', marginBottom: '10px' }}>¡Gracias por tu compra!</h1>
        
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
          Tu pedido {orderId && <strong>#{orderId}</strong>} ha sido procesado correctamente.
        </p>

        {/* SECCIÓN DE RECIBO (Solo visible si hay datos) */}
        {items && items.length > 0 && (
          <div style={{ 
            background: '#f8fafc', 
            padding: '25px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            textAlign: 'left',
            marginBottom: '30px'
          }}>
            <h3 style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginTop: 0, color: '#334155' }}>
              Resumen del pedido
            </h3>
            
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {item.quantity}x
                  </span>
                  <span style={{ color: '#1e293b' }}>{item.product.name}</span>
                </div>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>
                  ${(parseFloat(item.product.final_price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '10px', borderTop: '2px solid #cbd5e1' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>Total Pagado</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#059669' }}>${total?.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn-pagar" style={{ textDecoration: 'none', padding: '12px 30px', background: '#1f2933', borderRadius: '8px' }}>
            Volver a la tienda
          </Link>
          
          {/* Si no está logueado, sugerir registro */}
          {!localStorage.getItem('token') && (
            <Link to="/register" style={{ 
              textDecoration: 'none', 
              padding: '12px 30px', 
              background: 'transparent', 
              color: '#2563eb', 
              border: '1px solid #2563eb',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}>
              Crear cuenta
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
