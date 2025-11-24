// src/config/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos" (5 minutos)
      staleTime: 1000 * 60 * 5,
      
      // Tiempo que los datos permanecen en caché (10 minutos)
      gcTime: 1000 * 60 * 10, // antes era cacheTime en v4
      
      // Reintentar 1 vez si falla
      retry: 1,
      
      // No refetch automático cuando la ventana vuelve a tener foco
      refetchOnWindowFocus: false,
      
      // Refetch al reconectar internet
      refetchOnReconnect: true,
    },
    mutations: {
      // Reintentar mutaciones fallidas
      retry: 1,
    },
  },
});