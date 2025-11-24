// src/hooks/useCart.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI } from '../services/api';

export const useCart = () => {
  const queryClient = useQueryClient();

  // Query: Obtener carrito
  const { data: cart, isLoading, error, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const data = await cartAPI.get();
      console.log('📦 Carrito cargado:', data);
      return data;
    },
    staleTime: 0, // Siempre considerar los datos como obsoletos
    cacheTime: 1000 * 60 * 5, // Mantener en caché 5 minutos
    refetchOnMount: 'always', // Siempre refetch al montar
    refetchOnWindowFocus: true, // Refetch al volver a la ventana
  });

  // Mutation: Agregar producto al carrito
  const addItemMutation = useMutation({
    mutationFn: ({ productId, quantity }) => {
      console.log('🟢 useCart: Ejecutando mutación addItem', { productId, quantity });
      return cartAPI.addItem(productId, quantity);
    },
    
    onSuccess: async (data) => {
      console.log('✅ Producto agregado exitosamente:', data);
      // Invalidar Y refetch inmediato del carrito
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.refetchQueries({ queryKey: ['cart'] });
      console.log('🔄 Carrito refrescado');
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
    
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.refetchQueries({ queryKey: ['cart'] });
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
    
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.refetchQueries({ queryKey: ['cart'] });
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
    
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.refetchQueries({ queryKey: ['cart'] });
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