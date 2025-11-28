// src/hooks/useCart.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI } from '../services/api';

const CART_ID_KEY = 'ecommerce_cart_id';

export const useCartAPI = () => {
  const queryClient = useQueryClient();

  // Query: Obtener carrito
  const { data: cart, isLoading, error, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const data = await cartAPI.get();
      console.log('📦 Carrito cargado:', data);
      
      // Guardar el cart_id en localStorage para futuras sincronizaciones
      if (data && data.id) {
        localStorage.setItem(CART_ID_KEY, data.id.toString());
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache 5 minutos (no siempre considerar obsoleto)
    cacheTime: 1000 * 60 * 10, // Mantener en caché 10 minutos
    refetchOnMount: false, // NO refetch automáticamente al montar
    refetchOnWindowFocus: false, // NO refetch al volver a la ventana
    refetchOnReconnect: true, // Refetch si reconecta
  });

  // Mutation: Agregar producto al carrito
  const addItemMutation = useMutation({
    mutationFn: ({ productId, quantity }) => {
      console.log('🟢 useCart: Ejecutando mutación addItem', { productId, quantity });
      return cartAPI.addItem(productId, quantity);
    },
    
    onSuccess: (data) => {
      console.log('✅ Producto agregado exitosamente:', data);
      
      // Actualizar el carrito localmente con los datos de la respuesta
      if (data && data.item) {
        queryClient.setQueryData(['cart'], (old) => {
          if (!old) return old;
          
          // Verificar si el item ya existe
          const itemExists = old.items.some(i => i.id === data.item.id);
          
          return {
            ...old,
            items: itemExists 
              ? old.items.map(i => i.id === data.item.id ? data.item : i)
              : [...old.items, data.item],
            total_items: data.cart_items_count,
            total_price: data.cart_total,
          };
        });
      }
      
      console.log('🔄 Carrito actualizado localmente');
    },
    
    onError: (err) => {
      console.error('❌ Error al agregar producto:', err);
      console.error('Detalles del error:', err.message);
    },
  });

  // Mutation: Actualizar cantidad
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => cartAPI.updateItem(itemId, quantity),
    
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      
      // Actualizar optimísticamente
      queryClient.setQueryData(['cart'], (old) => {
        if (!old || !old.items) return old;
        
        return {
          ...old,
          items: old.items.map(item => 
            item.id === itemId 
              ? { ...item, quantity }
              : item
          ),
        };
      });
      
      return { previousCart };
    },
    
    onError: (err, variables, context) => {
      queryClient.setQueryData(['cart'], context.previousCart);
      console.error('Error al actualizar cantidad:', err);
    },
    
    onSuccess: (data) => {
      // La respuesta contiene el carrito actualizado
      if (data && data.cart) {
        queryClient.setQueryData(['cart'], data.cart);
      }
    },
  });

  // Mutation: Eliminar producto
  const removeItemMutation = useMutation({
    mutationFn: (itemId) => cartAPI.removeItem(itemId),
    
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      
      // Actualizar optimísticamente
      queryClient.setQueryData(['cart'], (old) => {
        if (!old || !old.items) return old;
        
        return {
          ...old,
          items: old.items.filter(item => item.id !== itemId),
        };
      });
      
      return { previousCart };
    },
    
    onError: (err, itemId, context) => {
      queryClient.setQueryData(['cart'], context.previousCart);
      console.error('Error al eliminar producto:', err);
    },
    
    onSuccess: (data) => {
      // La respuesta contiene el carrito actualizado
      if (data && data.cart) {
        queryClient.setQueryData(['cart'], data.cart);
      }
    },
  });

  // Mutation: Vaciar carrito
  const clearCartMutation = useMutation({
    mutationFn: cartAPI.clear,
    
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      
      // Actualizar optimísticamente
      queryClient.setQueryData(['cart'], (old) => ({
        ...old,
        items: [],
        total: 0,
      }));
      
      return { previousCart };
    },
    
    onError: (err, variables, context) => {
      queryClient.setQueryData(['cart'], context.previousCart);
      console.error('Error al vaciar carrito:', err);
    },
    
    onSuccess: (data) => {
      // La respuesta contiene el carrito actualizado
      if (data && data.cart) {
        queryClient.setQueryData(['cart'], data.cart);
      }
    },
  });

  return {
    // Data
    cart,
    isLoading,
    error,
    refetch, // Exportar refetch para uso manual
    
    // Mutations - exponer tanto mutate como mutateAsync
    addItem: addItemMutation.mutate,
    addItemAsync: addItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutate,
    updateItemAsync: updateItemMutation.mutateAsync,
    removeItem: removeItemMutation.mutate,
    removeItemAsync: removeItemMutation.mutateAsync,
    clearCart: clearCartMutation.mutate,
    clearCartAsync: clearCartMutation.mutateAsync,
    
    // Status de las mutaciones
    isAddingItem: addItemMutation.isPending,
    isUpdatingItem: updateItemMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
    
    // Estados de éxito/error
    addItemSuccess: addItemMutation.isSuccess,
    addItemError: addItemMutation.error,
  };
};