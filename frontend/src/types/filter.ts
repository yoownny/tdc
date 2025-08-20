// 필터와 관련된 타입 정의입니다.
// 난이도, 장르(태그), 문제유형

export type FilterState = {
  difficulties: ('EASY' | 'NORMAL' | 'HARD')[];
  genres: string[];
  problemTypes: ('ORIGINAL' | 'CUSTOM' | 'AI')[];
  searchQuery: string;
}

export type FilterOptions = {
  difficulties: Array<{
    value: 'EASY' | 'NORMAL' | 'HARD';
    label: string;
    icon: string;
  }>;
  genres: Array<{
    value: string;
    label: string;
  }>;
  problemTypes: Array<{
    value: 'ORIGINAL' | 'CUSTOM' | 'AI';
    label: string;
  }>;
}