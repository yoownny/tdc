// 문제와 관련된 기본 type입니다.
// 전체 문제, 선택된 문제 를 구분합니다.

export interface Problem {
  problemId: string;
  title: string;
  content: string;
  answer: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  genres: string[];
  // createdBy: string;
  creator: {
    id: number,
    nickname: string,
  },
  likes: number;
  problemType: 'ORIGINAL' | 'CUSTOM';
}

// 선택된 문제 전용 interface 입니다.
// 기존 문제, 창작 문제에 모두 사용합니다.
export interface SelectedProblem {
  problemId?: string; // 기존 문제의 경우 problemId 존재하고, 창작문제는 없음
  title: string;
  content: string;
  answer: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  genres: string[];
  // createdBy: string;
  creator: {
    id: number,
    nickname: string,
  },
  likes?: number;
  problemType: 'ORIGINAL' | 'CUSTOM';
}