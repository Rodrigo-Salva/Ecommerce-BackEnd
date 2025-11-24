import { useQuery } from '@tanstack/react-query';

const STATUS_COMPLETADOS = ['delivered', 'completed'];

export function usePedidosCompletados() {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const resp = await fetch('http://127.0.0.1:8000/api/orders/', { 
        credentials: 'include' 
      });
      if (!resp.ok) throw new Error('Error al cargar las órdenes');
      return await resp.json();
    }
  });

  const completados = orders?.filter(
    o => STATUS_COMPLETADOS.includes(o.status)
  ) || [];

  return { completados, isLoading, error };
}
