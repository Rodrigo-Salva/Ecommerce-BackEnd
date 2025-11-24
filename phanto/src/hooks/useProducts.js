// src/hooks/useProducts.js
import { useQuery } from '@tanstack/react-query';
import { productAPI } from '../services/api';

export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productAPI.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useProductDetail = (slug) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productAPI.getBySlug(slug),
    enabled: !!slug, // Solo ejecutar si hay slug
    staleTime: 1000 * 60 * 5,
  });
};

export const useRelatedProducts = (slug) => {
  return useQuery({
    queryKey: ['relatedProducts', slug],
    queryFn: () => productAPI.getRelated(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
};