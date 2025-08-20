// 랭킹과 관련된 타입입니다.

export interface ProblemRank {
  rank: number;
  problemId: number;
  title: string;
  likes: number;
  playCount: number;
//   score?: number;
}

// 랭킹 API 응답 타입
export interface RankingResponse {
  ranking: ProblemRank[];
  totalCount: number;
  lastUpdated: string;
}

// 랭킹 조회 파라미터 타입 (선택사항)
export interface RankingParams {
  limit?: number; // 조회할 랭킹 개수 (최대 10, 기본값: 10)
}