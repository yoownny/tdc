import { useState, useMemo } from 'react';
import type { RoomSummary } from '@/types/room/roomSummary';

interface FilterState {
  difficulties: ('EASY' | 'NORMAL' | 'HARD')[];
  genres: string[];
  problemTypes: ('ORIGINAL' | 'CUSTOM' | 'AI')[];
  searchQuery: string;
}

const roomFilterFunction = (room: RoomSummary, filters: FilterState): boolean => {
  // 난이도 필터
  if (filters.difficulties.length > 0 && !filters.difficulties.includes(room.difficulty)) {
    return false;
  }

  // 장르 필터
  if (filters.genres.length > 0) {
    const hasMatchingGenre = room.genres.some(genre => filters.genres.includes(genre));
    if (!hasMatchingGenre) return false;
  }

  // 문제 유형 필터
  if (filters.problemTypes.length > 0 && !filters.problemTypes.includes(room.problemType)) {
    return false;
  }

  // 검색어 필터
  if (filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.toLowerCase();
    const searchableText = [
      room.title,
      room.host.nickname,
      ...room.genres
    ].join(' ').toLowerCase();
    
    if (!searchableText.includes(query)) return false;
  }

  return true;
};

export const useRoomFilter = (rooms: RoomSummary[]) => {
  const [filters, setFilters] = useState<FilterState>({
    difficulties: [],
    genres: [],
    problemTypes: [],
    searchQuery: ''
  });

  const filteredData = useMemo(() => {
    return rooms.filter(room => roomFilterFunction(room, filters));
  }, [rooms, filters]);

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
    totalCount: rooms.length,
    filteredCount: filteredData.length
  };
};