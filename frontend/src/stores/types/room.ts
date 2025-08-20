import type { ChatLog } from "@/types/chat";
import type { RoomDetailResponse } from "@/types/room/roomDetail";
import type { User } from "@/types/user";

export interface RoomStoreType {
  roomId: number;
  gameState: "WAITING" | "PLAYING";
  numPlayers: number;
  maxPlayers: number;
  hostId: number;
  players: User[];
  chattings: ChatLog[];
  nextChatlogId: number;
  timeLimit: number;
  roomEntryTime: number | null; // 방 체류 시간 계산을 위한 변수

  setRoom: (roomData: RoomDetailResponse) => void;
  resetRoom: () => void;
  // 참가자 입퇴장
  joinPlayer: (newPlayer: User, currentPlayers: number) => void;
  leavePlayer: (targetUserId: number) => void;
  // 방장 변경
  updateHost: (oldHostId: number, newHostId: number) => void;
  newHost: (newHostId: number) => void;

  updateSetting: (maxPlayers: number, timeLimit: number) => void;
  addChatting: (username: string, content: string, timestamp: string, type?: "QUESTION" | "GUESS" | "CHAT", status?: "PENDING" | "CORRECT" | "INCORRECT" | "IRRELEVANT") => void;
  clearChattings: () => void;
  updatePlayerStatus: (players: User[]) => void;
  updateRoomStatus: (gameState: "WAITING" | "PLAYING") => void;

  // 참가자 준비 상태 체크 함수
  areAllPlayersReady: () => boolean;
  isNotAlone: () => boolean;
  getRoomStayDuration: () => number;

  // 타이머 관련 상태
  timerWarning: boolean;
  hostTimeout: boolean;
  setTimerWarning: (warning: boolean) => void;
  setHostTimeout: (timeout: boolean) => void;
}

// 유틸: id 기준 중복 제거
export const uniqById = <T extends { id: number }>(list: T[]) => {
  const m = new Map<number, T>();
  for (const it of list) m.set(it.id, it);
  return Array.from(m.values());
};