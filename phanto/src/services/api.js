// src/services/api.js
const API_BASE_URL = 'http://127.0.0.1:8000';

// Función helper para hacer peticiones
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // 1. Recuperar token del almacenamiento local
  const token = localStorage.getItem('token');

  // 2. Preparar headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 3. Inyectar Token si existe (y si no es una ruta pública de login/registro)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      credentials: 'include', // Mantenemos esto por si usas cookies para otras cosas
      headers: headers,       // Usamos los headers con el token
      ...options,
    });

    // Si es 204 No Content, no intentar parsear JSON
    if (response.status === 204) {
      return null;
    }

    // Si el token expiró (401), podríamos limpiar el localStorage aquí
    if (response.status === 401) {
        // Opcional: localStorage.removeItem('token'); window.location.href = '/login';
        console.warn("Token expirado o inválido");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============================================
// PRODUCTOS
// ============================================

export const productAPI = {
  // GET /api/products/ - Lista con filtros y paginación
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/products/${queryString ? `?${queryString}` : ''}`;

    const data = await fetchAPI(endpoint);
    return data.results || data || [];
  },

  // GET /api/products/{slug}/ - Detalle completo
  getBySlug: async (slug) => {
    return fetchAPI(`/api/products/${slug}/`);
  },

  // GET /api/products/{slug}/related/
  getRelated: async (slug) => {
    const data = await fetchAPI(`/api/products/${slug}/related/`);
    return data.results || data || [];
  },
};

// ============================================
// CATEGORÍAS
// ============================================

export const categoryAPI = {
  getAll: async () => {
    const data = await fetchAPI('/api/products/categories/');
    return data.results || data || [];
  },

  getBySlug: async (slug) => {
    return fetchAPI(`/api/products/categories/${slug}/`);
  },

  getProducts: async (slug) => {
    const data = await fetchAPI(`/api/products/categories/${slug}/products/`);
    return data.results || data || [];
  },
};

// ============================================
// CARRITO
// ============================================

export const cartAPI = {
  get: async () => {
    return fetchAPI('/api/cart/');
  },

  addItem: async (productId, quantity = 1) => {
    console.log('🔵 Enviando a API:', { product_id: productId, quantity });
    return fetchAPI('/api/cart/items/', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        quantity: quantity,
      }),
    });
  },

  updateItem: async (itemId, quantity) => {
    return fetchAPI(`/api/cart/items/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  removeItem: async (itemId) => {
    return fetchAPI(`/api/cart/items/${itemId}/`, {
      method: 'DELETE',
    });
  },

  clear: async () => {
    return fetchAPI('/api/cart/clear/', {
      method: 'DELETE',
    });
  },
};

// ============================================
// PAGOS / ÓRDENES
// ============================================

export const paymentAPI = {
  createPaymentIntent: (amount) =>
    fetchAPI('/api/orders/create-payment-intent/', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  confirmPayment: (payload) =>
    fetchAPI('/api/orders/confirm-payment/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const ordersAPI = {
  getMyOrders: () => fetchAPI('/api/orders/'),
  getOrderDetail: (orderNumber) => fetchAPI(`/api/orders/${orderNumber}/`),
};

// Exportar URL base
export const API_URL = API_BASE_URL;

// Compatibilidad con código antiguo
export const getAllProducts = productAPI.getAll;
export const getProductBySlug = productAPI.getBySlug;
export const getAllCategories = categoryAPI.getAll;
