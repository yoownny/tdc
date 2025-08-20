import type { AnswerStatus, Interaction, TurnOrderItem, CurrentTurn } from "@/types/game/game";
import type { GamePlayer, User } from "@/types/user";

export interface GameStoreType {
  // 게임 정보
  roomId: number;
  players: GamePlayer[];
  remainingQuestions: number;
  totalQuestions: number;

  // 질문 정보
  currentPlayer: User | null;
  currentQuestion: Interaction | null;
  PendingInteraction: Interaction[];
  gameHistory: Interaction[];

  // 결과 정보
  endReason: "CORRECT_ANSWER" | "TIMEOUT" | "MANUAL";
  winnerId: number;
  winnerName: string;
  submitted_answer: string;
  playTime: string;
  totalQuestionCount: number;

  // 게임
  currentTimer: number;

  // State Logic 별도
  nextInteractionId: number;
  resultOpen: boolean; // Modal Open 용
  answerAttemptsExhaustedDialogOpen: boolean; // 정답 횟수 소진 다이얼로그 Open 용
  isAnswerAttemptsExhausted: boolean; // 정답 횟수 소진 여부 플래그

  // 추가된 상태들
  lastTurnChange: number; // 턴 변경 감지용

  // 응답없음 관련 상태
  hostNoResponseWarning: boolean;
  setHostNoResponseWarning: (warning: boolean) => void;

  gameStart: (
    roomId: number,
    playerList: GamePlayer[],
    remainingQuestions: number,
    totalQuestions: number,
    currentPlayer: User
  ) => void;

  addInteraction: (
    type: "QUESTION" | "GUESS",
    playerId: number,
    content: string
  ) => void;

  addHistory: (
    type: "QUESTION" | "GUESS",
    playerId: number,
    content: string,
    replyContent: AnswerStatus
  ) => void;

  nextTurn: (targetUserId: number) => void;
  dropOutPlayer: (leaveUserId: number, nowPlayers: GamePlayer[], turnOrder?: TurnOrderItem[], currentTurn?: CurrentTurn) => void;
  clearCurrentQuestion: () => void;
  processAnswerQueue: () => void;
  syncTimer: (remainingTime: number) => void;
  setResultOpen: (open: boolean) => void;
  setAnswerAttemptsExhaustedDialogOpen: (open: boolean) => void;
  setIsAnswerAttemptsExhausted: (exhausted: boolean) => void;

  // 추가된 액션들
  updateRemainingQuestions: (remaining: number) => void;
  updatePlayerAnswerAttempts: (playerId: number, attempts: number) => void;

  gameOver: (
    endReason: "CORRECT_ANSWER" | "TIMEOUT" | "MANUAL",
    userId: number,
    nickname: string,
    content: string,
    questionCnt: number,
    playTime: string
  ) => void;
  clearGameData: () => void;
}
