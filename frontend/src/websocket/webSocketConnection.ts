import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import useWebsocketStore from "@/stores/useWebSocketStore";
import { joinMyMsg, joinRoom } from "./subscription";

// 시스템 메시지를 출력하는 유틸 함수
function addSystemMessage(message: string, type: "system" | "user" = "system") {
  console.log(`[${type.toUpperCase()}] ${message}`);
}

export function openConnect(): void {
  const {
    client,
    connectionStatus,
    setClient,
    setConnectionStatus,
    clearAllSubscriptions,
  } = useWebsocketStore.getState();

  // 이미 연결 중/연결됨이면 재호출 방지 (idempotent)
  if (connectionStatus === "connecting" || connectionStatus === "connected")
    return;

  // 기존 커넥션이 살아있으면 재사용
  if (client && client.active) {
    setConnectionStatus("connected");
    return;
  }

  // 인증 스토리지 선검증 (SockJS 생성 전에)
  const storageString = sessionStorage.getItem("auth-storage");
  if (!storageString) {
    addSystemMessage("인증 정보가 없습니다. WebSocket 연결을 중단합니다.");
    setConnectionStatus("idle");
    return;
  }

  let storageItems: any;

  try {
    storageItems = JSON.parse(storageString);
  } catch {
    addSystemMessage("인증 정보 파싱 실패. 연결 중단");
    setConnectionStatus("idle");
    return;
  }

  // accessToken 존재 여부 확인
  const accessToken = storageItems.state.accessToken;
  const socialId = storageItems.state.user.socialId;
  const nickname = storageItems.state.user.nickname;

  if (!accessToken || !socialId || !nickname) {
    addSystemMessage("인증 정보가 불완전합니다. 연결 중단");
    setConnectionStatus("idle");
    return;
  }

  try {
    setConnectionStatus("connecting");

    // Client 정의
    const socket = new SockJS(import.meta.env.VITE_WS_BASE_URL);
    const stompClient = new Client({
      webSocketFactory: () => socket,

      // ✅ userId를 헤더에 담아 서버로 전달
      connectHeaders: {
        socialId: String(socialId),
        nickname: String(nickname),
        Authorization: `Bearer ${accessToken}`,
      },

      // 하트비트 설정
      reconnectDelay: 2000,
      heartbeatIncoming: 20000,
      heartbeatOutgoing: 20000,

      // 연결 성공
      onConnect: () => {
        addSystemMessage(`Websocket 연결 성공`);
        setClient(stompClient);

        joinMyMsg();

        const { currentRoomId } = useWebsocketStore.getState();
        if (currentRoomId !== null) {
          joinRoom(currentRoomId); // 🔁 새로고침 후 재접속 시 구독 복원
        }
        setConnectionStatus("connected");
      },

      // Stomp 에러
      onStompError: (frame) => {
        addSystemMessage(
          `STOMP 에러: ${frame.headers["message"] ?? "unknown"}`
        );
        // STOMP 프레임 에러 시 상태 정리
        setConnectionStatus("idle");
      },

      // webSocket 에러
      onWebSocketError: (event) => {
        addSystemMessage(`WebSocket 연결 오류: ${String(event)}`);
        // 소켓 에러 시에도 idle 전이
        setConnectionStatus("idle");
      },

      // 연결 끊어짐
      // STOMP Protocol 표준: 연결 해제 시 귀속된 모든 구독은
      // Client/Server 양쪽에서 제거됩니다.
      onWebSocketClose: () => {
        addSystemMessage("WebSocket이 종료되었습니다.");
        // 구독/클라이언트 정리
        clearAllSubscriptions();
        setClient(null);
        setConnectionStatus("idle");
      },

      // DISCONNECT 프레임을 정상 교환했을 때(수동 종료 등)
      onDisconnect: () => {
        addSystemMessage("STOMP Disconnect 처리 완료");
        clearAllSubscriptions();
        setClient(null);
        setConnectionStatus("idle");
      },
    });

    // 연결 시작
    stompClient.activate();
  } catch (error) {
    addSystemMessage(
      "연결 중 에러: " +
        (error instanceof Error ? error.message : "알 수 없는 에러")
    );
    // 실패 시 상태 되돌리기
    setConnectionStatus("idle");
  }
}

export function closeConnect(): void {
  const { client } = useWebsocketStore.getState();
  // deactivate()는 내부적으로 DISCONNECT → 소켓 종료까지 수행
  client?.deactivate();
}
