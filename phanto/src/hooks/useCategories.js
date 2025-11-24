// src/hooks/useCategories.js
import { useQuery } from '@tanstack/react-query';
import { categoryAPI } from '../services/api';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoryAPI.getAll,
    staleTime: 1000 * 60 * 10, // 10 minutos (no cambian frecuentemente)
  });
};

export const useCategoryDetail = (slug) => {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoryAPI.getBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  });
};

export const useCategoryProducts = (slug) => {
  return useQuery({
    queryKey: ['categoryProducts', slug],
    queryFn: () => categoryAPI.getProducts(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
};