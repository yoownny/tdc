import { joinLobby, leaveLobby } from "@/websocket/subscription";
import LobbyTemplate from "@/layouts/LobbyTemplate";
import { useEffect } from "react";
import useWebsocketStore from "@/stores/useWebSocketStore";

const LobbyPage = () => {
  const connectionStatus = useWebsocketStore((s) => s.connectionStatus);

  useEffect(() => {
    useWebsocketStore.getState().setCurrentRoomId(null);
  }, []);

  useEffect(() => {
    if (connectionStatus === "connected") {
      // 이미 구독돼 있으면 joinLobby 내부 가드로 무시되도록
      joinLobby();
      return () => {
        leaveLobby();
      };
    }
  }, [connectionStatus]);

  return (
    // 각 페이지별 필요한 커스텀 설정으로 감싸기
    <div>
      <LobbyTemplate />
    </div>
  );
};

export default LobbyPage;
