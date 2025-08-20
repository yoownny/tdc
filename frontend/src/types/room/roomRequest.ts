// 방을 생성할 때 API 요청을 보내기 위한 타입입니다.

import type { SelectedProblem } from "../problem/problem";

export interface CreateRoomRequest {
  title: string;
  maxPlayers: number;
  timeLimit: number;
  problemInfo: SelectedProblem;
}