export type RoomSummary = {
  roomId: number;
  title: string;
  currentPlayers: number;
  maxPlayers: number;
  gameState: "WAITING" | "PLAYING";
  problemType: "ORIGINAL" | "CUSTOM";
  genres: string[]; // 1~3개
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  timeLimit: number;
  host: {
    id: number,
    nickname: string,
  }
}