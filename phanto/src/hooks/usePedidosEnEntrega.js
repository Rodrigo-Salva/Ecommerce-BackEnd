import { useQuery } from '@tanstack/react-query';

export const ESTADOS_ENTREGA = ['processing', 'shipped', 'in_transit']; // o ajustes según tu backend

export function usePedidosEnEntrega() {
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

  const enEntrega = orders?.filter(
    o => ESTADOS_ENTREGA.includes(o.status)
  ) || [];

  return { enEntrega, isLoading, error };
}
