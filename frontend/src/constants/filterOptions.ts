import type { FilterOptions } from '@/types/filter';

export const FILTER_OPTIONS: FilterOptions = {
  difficulties: [
    { value: 'EASY', label: '쉬움', icon: '🌱' },
    { value: 'NORMAL', label: '보통', icon: '⚡' },
    { value: 'HARD', label: '어려움', icon: '🔥' }
  ],
  genres: [
    { value: '공포', label: '공포' },
    { value: '스릴러', label: '스릴러' },
    { value: '범죄', label: '범죄' },
    { value: '코믹', label: '코믹' },
    { value: '일상', label: '일상' },
    { value: '교훈', label: '교훈' },
    { value: '평화', label: '평화' },
    { value: '모험', label: '모험' },
    { value: '추리', label: '추리' },
    { value: '판타지', label: '판타지' },
    { value: '괴담', label: '괴담' },
    { value: '미스터리', label: '미스터리' },
    { value: '동물', label: '동물' }
  ],
  problemTypes: [
    { value: 'ORIGINAL', label: '기존 사건' },
    { value: 'CUSTOM', label: '새로운 사건' }
  ]
};