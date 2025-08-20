import React from 'react';

// 해당 타입은 UI 사용 및 Props를 위한 FE Custom Type입니다.
// 실제 타입은 BE API 응답에 따라 결정됩니다.

// 사용자의 질문 및 응답에 대한 구조입니다. type으로 분류됩니다.
export interface Interaction {
  id: number;
  playerId: number; // 실제 사용자 ID 추가
  username: string;
  type: "QUESTION" | "GUESS";
  content: string;
  status: AnswerStatus;
};

export interface Reply {
  id: number;
  type: string;
  player_id: number;
  button_value: string;
};

export interface WebsocketResponse<T = any> {
  eventType: string;
  payload: T;
}

export const AnswerStatus = {
  PENDING: "PENDING",
  CORRECT: "CORRECT",
  INCORRECT: "INCORRECT",
  IRRELEVANT: "IRRELEVANT",
} as const;

export type AnswerStatus = typeof AnswerStatus[keyof typeof AnswerStatus];

export interface PlayAction {
  buttonLabel: React.ReactNode;
  onClick: () => void;
}

export interface TurnOrderItem {
  userId: number;
  nickname: string;
}

export interface CurrentTurn {
  questionerId: number;
  nickname?: string;
}

export interface ServerPlayer {
  userId: number;
  nickname: string;
  role: "HOST" | "PARTICIPANT";
  state: string;
  readyState: string;
  answerAttempts: number;
}