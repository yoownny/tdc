import { useState, useMemo } from 'react';
import type { FilterState } from '@/types/filter';

interface UseFilterProps<T> {
  data: T[];
  filterFunction: (item: T, filters: FilterState) => boolean;
  initialFilters?: Partial<FilterState>;
}

export const useFilter = <T>({ 
  data, 
  filterFunction, 
  initialFilters = {} 
}: UseFilterProps<T>) => {
  const [filters, setFilters] = useState<FilterState>({
    difficulties: [],
    genres: [],
    problemTypes: [],
    searchQuery: '',
    ...initialFilters
  });

  const filteredData = useMemo(() => {
    return data.filter(item => filterFunction(item, filters));
  }, [data, filters, filterFunction]);

  const updateFilter = <K extends keyof FilterState>(
    key: K, 
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      difficulties: [],
      genres: [],
      problemTypes: [],
      searchQuery: ''
    });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.difficulties.length > 0 ||
      filters.genres.length > 0 ||
      filters.problemTypes.length > 0 ||
      filters.searchQuery.trim() !== ''
    );
  }, [filters]);

  return {
    filters,
    filteredData,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    totalCount: data.length,
    filteredCount: filteredData.length
  };
};
