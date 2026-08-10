import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SearchFilters } from '../types';
import { EMPTY_FILTERS, FILTER_STORAGE_KEY } from '../lib/constants';

export function useSearchFilters() {
  const [filters, setFiltersState] = useState<SearchFilters>(EMPTY_FILTERS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FILTER_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as SearchFilters;
            setFiltersState(parsed);
          } catch {
            // ignore
          }
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const setFilters = useCallback((next: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => {
    setFiltersState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(resolved)).catch(() => {});
      return resolved;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, [setFilters]);

  const activeFilterCount =
    filters.operators.length +
    filters.amenities.length +
    filters.departureTime.length +
    filters.seatClass.length +
    (filters.isExpress ? 1 : 0);

  return { filters, setFilters, clearFilters, activeFilterCount, loaded };
}
