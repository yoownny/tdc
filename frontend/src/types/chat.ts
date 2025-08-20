export interface ChatLog {
  id: number;
  user: string;
  content: string;
  timestamp: string;
  type?: "QUESTION" | "GUESS" | "CHAT"; // 메시지 타입
  status?: "PENDING" | "CORRECT" | "INCORRECT" | "IRRELEVANT"; // 응답 상태
}

export interface ChatResponse {
  eventType: string;
  payload: {
    senderId: number;
    nickname: string;
    message: string;
    timestamp: string;
  };
}
