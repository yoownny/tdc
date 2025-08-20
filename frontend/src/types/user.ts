// 해당 타입은 UI 사용 및 Props를 위한 FE Custom Type입니다.
// 실제 타입은 BE API 응답에 따라 결정됩니다.

export interface User {
  id: number;
  name: string;
  isHost: boolean;
  status: "WAITING" | "READY" | "PLAYING";
  isActive?: boolean; // 빈 자리의 활성화 상태 (선택적 속성)
  turnNumber?: number; // 게임에서의 턴 번호 (1부터 시작)
}

export interface GamePlayer extends User {
  answerAttempts: number;
}

export interface UserRank {
  nickname: string;
  totalGame: number;
  rank?: number;
}

export interface UserRankingResponse {
  statusCode: number;
  message: string;
  data: {
    ranking: UserRank[];
    lastUpdated?: string;
  };
}
