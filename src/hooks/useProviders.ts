import { useState, useEffect } from 'react';
import type { Provider, Category } from '../types/provider';
import { providers as fallbackProviders } from '../data/providers';
import { categories as fallbackCategories } from '../data/categories';

interface UseProvidersReturn {
  providers: Provider[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProviders(estate: string | null): UseProvidersReturn {
  const [providers, setProviders] = useState<Provider[]>(estate ? [] : fallbackProviders);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    if (!estate) return;
    setIsLoading(true);
    const params = new URLSearchParams({ estate });
    Promise.all([
      fetch(`/api/providers?${params}`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`/api/categories?${params}`).then(r => r.ok ? r.json() : Promise.reject()),
    ])
      .then(([provData, catData]) => {
        const mapped: Provider[] = provData.map((p: Record<string, unknown>) => ({
          id: String(p.id),
          name: p.name as string,
          businessName: (p.business_name as string) || undefined,
          category: p.category as string,
          description: p.description as string,
          phone: p.phone as string,
          whatsapp: (p.whatsapp as string) || undefined,
          serviceArea: (p.service_area as string) || undefined,
          address: (p.address as string) || undefined,
          workingHours: (p.working_hours as string) || undefined,
          image: (p.image as string) || undefined,
          isVerified: Boolean(p.is_verified),
          lastUpdated: (p.updated_at as string) || undefined,
          services: (p.services as string[]) || [],
        }));
        const cats: Category[] = catData.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          description: c.description as string,
          providerCount: (c.provider_count as number) || 0,
        }));
        setProviders(mapped);
        setCategories(cats);
        setError(null);
      })
      .catch(() => {
        setError('Could not load data from server');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [estate]); // eslint-disable-line react-hooks/exhaustive-deps

  return { providers, categories, isLoading, error, refetch: loadData };
}
