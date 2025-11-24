import React from 'react';
import './HistorialPedidos.css';
import { usePedidosEnEntrega } from '../hooks/usePedidosEnEntrega';

const HistorialPedidos = () => {
  const { enEntrega, isLoading, error } = usePedidosEnEntrega();

  if (isLoading)
    return (
      <div className="historial-pedidos">
        <div className="sin-pedidos">Cargando pedidos...</div>
      </div>
    );
  if (error)
    return (
      <div className="historial-pedidos">
        <div className="sin-pedidos">{error.message}</div>
      </div>
    );

  return (
    <div className="historial-pedidos">
      <h2 className="historial-titulo">Pedidos en proceso de entrega</h2>
      <div className="pedidos-lista">
        {enEntrega.length === 0 ? (
          <div className="sin-pedidos">
            No tienes pedidos en proceso de entrega.
          </div>
        ) : (
          enEntrega.map(order => (
            <div className="pedido-item" key={order.order_number}>
              <span className="pedido-numero">#{order.order_number}</span>
              <span className={`pedido-estado ${order.status}`}>
                {order.status.replace('_', ' ')}
              </span>
              <span className="pedido-precio">S/ {order.total}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistorialPedidos;
