// src/pages/Checkout.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { paymentAPI } from '../services/api';
import './Checkout.css';

// Clave pública de Stripe (test)
const stripePromise = loadStripe(
  'pk_test_51SYK6fRsm57ZrL8Dvrf7AEMInt0971Z6eLtZmUU128oEANciw0rPYE8lKdNaewyqyJ5j4mDdqg4MdYFHsGP0obET00XTU6tTgu'
);

const CheckoutForm = () => {
  const { cart, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const location = useLocation();

  const [clientSecret, setClientSecret] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const cartTotal = parseFloat(cart?.total_price || 0);
  const shipping = cartTotal >= 1000 ? 0 : 50;
  const amountInCents = Math.round((cartTotal + shipping) * 100);

  // Crear PaymentIntent al entrar
  useEffect(() => {
    if (!cart || !cart.items || cart.items.length === 0) return;

    const createIntent = async () => {
      try {
        const data = await paymentAPI.createPaymentIntent(amountInCents);
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Error creando intent:", err);
        setErrorMessage('No se pudo iniciar el proceso de pago.');
      }
    };

    createIntent();
  }, [cart, amountInCents]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const cardElement = elements.getElement(CardElement);

      // 1. Confirmar cobro en Stripe
      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        setErrorMessage(error.message || 'Error al procesar el pago con el banco.');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // 2. Preparar datos
        const orderPayload = {
          payment_intent_id: paymentIntent.id,
          order: {
            full_name: location.state?.fullName || 'Cliente Web',
            email: location.state?.email || 'cliente@ejemplo.com',
            phone: location.state?.phone || '999999999',
            address_line1: location.state?.address || 'Dirección Principal',
            address_line2: '',
            city: location.state?.city || 'Lima',
            state: location.state?.state || 'Lima',
            postal_code: location.state?.postalCode || '15000',
            country: location.state?.country || 'Peru',
            order_notes: '',
            items: cart.items.map((item) => ({
              product_id: item.product.id, 
              quantity: item.quantity,
              // Guardamos datos extra para el recibo visual por si acaso
              name: item.product.name,
              price: item.product.final_price
            })),
            coupon_code: '',
          },
        };

        // 3. Guardar orden en backend
        await paymentAPI.confirmPayment(orderPayload);

        // Preparamos datos para el recibo visual (para invitados)
        const receiptData = {
          orderId: paymentIntent.id.slice(-8).toUpperCase(),
          total: cartTotal + shipping,
          items: cart.items // Pasamos los items actuales para mostrarlos en el recibo
        };

        setSuccessMessage('¡Pago exitoso! Procesando...');
        
        // Limpiamos carrito
        clearCart();

        // --- LÓGICA DE REDIRECCIÓN INTELIGENTE ---
        const token = localStorage.getItem('token');
        
        setTimeout(() => {
          if (token) {
            // Si está logueado -> Ver historial completo
            navigate('/mis-compras');
          } else {
            // Si es invitado -> Ver pantalla de éxito con recibo
            navigate('/order-success', { state: receiptData });
          }
        }, 2500);

      } else {
        setErrorMessage('El pago no se completó. Intente nuevamente.');
      }
    } catch (err) {
      console.error("Error en confirmación final:", err);
      setErrorMessage('Pago recibido, pero hubo un error guardando la orden. Contáctanos.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <h2>Tu carrito está vacío</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page fade-in">
      <div className="container">
        <h1 className="checkout-title">Pago Seguro</h1>

        <div className="checkout-grid">
          <div className="checkout-form-card">
            <h3>Datos de la tarjeta</h3>
            <p className="checkout-subtitle">
              Transacción segura cifrada vía Stripe.
            </p>

            <form onSubmit={handleSubmit} className="checkout-form">
              <label className="checkout-label">Número de tarjeta</label>
              <div className="card-element-wrapper">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#1f2933',
                        '::placeholder': { color: '#9ca3af' },
                      },
                      invalid: { color: '#f97373' },
                    },
                  }}
                />
              </div>

              {errorMessage && <div className="checkout-error">{errorMessage}</div>}
              {successMessage && <div className="checkout-success">{successMessage}</div>}

              <button
                type="submit"
                className="btn-pagar"
                disabled={!stripe || !clientSecret || isProcessing}
              >
                {isProcessing ? 'Procesando...' : `Pagar $${(cartTotal + shipping).toFixed(2)}`}
              </button>
            </form>
          </div>

          <div className="checkout-summary-card">
            <h3>Resumen</h3>
            <div className="resumen-linea">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="resumen-linea">
              <span>Envío</span>
              <span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="resumen-divider" />
            <div className="resumen-linea total">
              <span>Total</span>
              <span>${(cartTotal + shipping).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);

export default Checkout;
