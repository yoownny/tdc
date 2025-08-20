import useWebsocketStore from "@/stores/useWebSocketStore";
import { AnswerStatus } from "@/types/game/game";

// 방 입장 요청을 WebSocket을 통해 서버에 발신하는 함수
function publishWS(destination: string, body?: object) {
  const stompClient = useWebsocketStore.getState().client;

  const storageString = sessionStorage.getItem("auth-storage");
  if (!storageString) {
    console.warn("저장된 정보가 없습니다.");
    return;
  }

  const accessToken = JSON.parse(storageString).state.accessToken;
  if (!stompClient || !accessToken) {
    console.warn("WebSocket client 또는 token이 없습니다.");
    return;
  }

  stompClient?.publish({
    destination,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// 방 조회 발신 WS
export function sendGetRoomList() {
  publishWS("/app/room/list", {});
}

// 방 생성 발신 WS
export function sendCreateRoom(
  maxPlayers: number,
  timeLimit: number,
  problemInfo: { problemId: string; problemType: "CUSTOM" | "ORIGINAL" }
) {
  publishWS("/app/room/create", { maxPlayers, timeLimit, problemInfo });
}

// 방 입장 발신 WS
export function sendJoinRoom(roomId: number) {
  publishWS("/app/room/join", { roomId });
}

// 방 퇴장 발신 WS
export function sendLeaveRoom(roomId: number) {
  const sendData = { roomId };
  console.log("🚪 [LEAVE_ROOM] 서버 발신:", {
    destination: "/app/room/leave",
    data: sendData,
    timestamp: new Date().toISOString(),
  });
  publishWS("/app/room/leave", sendData);
}

// 채팅 발신 WS
export function sendChat(roomId: number, content: string) {
  publishWS(`/app/games/${roomId}/chat`, { message: content });
}

// 준비 상태 발신 WS
export function sendReady(roomId: number, isReady: boolean) {
  publishWS(`/app/room/ready`, {
    roomId,
    readyState: isReady ? "READY" : "WAITING",
  });
}

// 문제 변경 발신 WS
export function sendChangeProblem(
  problemId: string,
  problemType: "ORIGINAL" | "CUSTOM"
) {
  publishWS(`/app/room/problem/update`, { problemId, problemType });
}

// 방 설정 변경 발신 WS
export function sendChangeSettings(
  roomId: number,
  maxPlayers: number,
  timeLimit: number
) {
  publishWS(`/app/room/settings`, { roomId, maxPlayers, timeLimit });
}

// 방장 권한 이양 발신 WS
export function sendTransferHost(roomId: number, targetUserId: number) {
  publishWS(`/app/room/transfer-host`, {
    roomId,
    targetUserId,
  });
}

// 방장 권한 응답 발신 WS
export function sendRespondHostTransfer(roomId: number, accept: boolean) {
  publishWS(`/app/room/respond-host-transfer`, {
    roomId,
    accept,
  });
}

// 게임 시작 발신 WS
export function sendGameStart(roomId: number) {
  publishWS(`/app/games/${roomId}/start`, {});
}

// 질문 발신 WS
export function sendQuestion(roomId: number, content: string) {
  console.log("질문 전송:", {
    roomId,
    content,
    destination: `/app/games/${roomId}/question`,
  });
  publishWS(`/app/games/${roomId}/question`, { question: content });
}

// 답변 발신 WS
export function sendReply(
  roomId: number,
  questionerId: number,
  question: string,
  answerStatus: AnswerStatus
) {
  publishWS(`/app/games/${roomId}/respond-question`, {
    questionerId,
    question,
    answerStatus,
  });
}

// 정답 추리 발신 WS
export function sendAnswer(roomId: number, content: string) {
  publishWS(`/app/games/${roomId}/guess`, { question: content });
}

// 정답 판정 발신 WS (작업 중)
export function sendJudgement(
  roomId: number,
  senderId: number,
  guess: string,
  answerStatus: AnswerStatus
) {
  publishWS(`/app/games/${roomId}/respond-guess`, {
    senderId,
    guess,
    answerStatus,
  });
}

// 방장 응답 없음 WS
export function sendHostTimeout(roomId: number) {
  publishWS(`/app/games/${roomId}/host-timeout`, {});
}

// 턴 넘기기 발신 WS
export function sendTurnOver(
  roomId: number,
  passTurnReason: "TIMEOUT" | "MANUAL"
) {
  const sendData = { passTurnReason };
  console.log("🔄 [TURN_OVER] 서버 발신:", {
    destination: `/app/games/${roomId}/pass-turn`,
    data: sendData,
    timestamp: new Date().toISOString(),
  });

  // 서버로 메시지 전송하고 NEXT_TURN 이벤트 응답 대기
  publishWS(`/app/games/${roomId}/pass-turn`, sendData);
}
