const API_BASE_URL = 'http://127.0.0.1:8000';

// Función helper para hacer peticiones
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',      // >>> Esta línea es vital para TODAS las peticiones
      ...options,
    });

    if (response.status === 204) return null;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
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

    return fetchAPI(endpoint);
  },

  // GET /api/products/{slug}/ - Detalle completo
  getBySlug: async (slug) => fetchAPI(`/api/products/${slug}/`),

  // GET /api/products/{slug}/related/ - Productos relacionados
  getRelated: async (slug) => fetchAPI(`/api/products/${slug}/related/`),
};

// ============================================
// CATEGORÍAS
// ============================================

export const categoryAPI = {
  // GET /api/products/categories/ - Lista todas las categorías
  getAll: async () => fetchAPI('/api/products/categories/'),

  // GET /api/products/categories/{slug}/ - Detalle de categoría
  getBySlug: async (slug) => fetchAPI(`/api/products/categories/${slug}/`),

  // GET /api/products/categories/{slug}/products/ - Productos por categoría
  getProducts: async (slug) => fetchAPI(`/api/products/categories/${slug}/products/`),
};

// ============================================
// CARRITO
// ============================================

export const cartAPI = {
  // GET /api/cart/ - Obtener carrito del usuario
  get: async () => fetchAPI('/api/cart/'),

  // POST /api/cart/items/ - Agregar producto
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

  // PATCH /api/cart/items/{id}/ - Actualizar cantidad
  updateItem: async (itemId, quantity) => {
    return fetchAPI(`/api/cart/items/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        quantity: quantity,
      }),
    });
  },

  // DELETE /api/cart/items/{id}/ - Eliminar item
  removeItem: async (itemId) => fetchAPI(`/api/cart/items/${itemId}/`, { method: 'DELETE' }),

  // DELETE /api/cart/clear/ - Vaciar carrito
  clear: async () => fetchAPI('/api/cart/clear/', { method: 'DELETE' }),
};

// Exportar URL base
export const API_URL = API_BASE_URL;

// Mantener compatibilidad con código antiguo
export const getAllProducts = productAPI.getAll;
export const getProductBySlug = productAPI.getBySlug;
export const getAllCategories = categoryAPI.getAll;
