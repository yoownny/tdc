import type { User } from "../user";

export interface RoomDetailResponse {
  roomId: number;
  maxPlayers: number;
  numPlayers: number;
  timeLimit: number;
  gameState: "WAITING" | "PLAYING";
  hostId: number;
  participants: User[];
}
