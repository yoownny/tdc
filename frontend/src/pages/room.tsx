import WaitingTemplate from "@/layouts/WaitingTemplate";
import GameHostTemplate from "@/layouts/GameHostTemplate";
import GamePlayerTemplate from "@/layouts/GamePlayerTemplate";
import { useEffect, useRef, useState, type ReactNode } from "react";
import useRoomStore from "@/stores/roomStore";
import { joinRoom, leaveRoom } from "@/websocket/subscription";
import useWebsocketStore from "@/stores/useWebSocketStore";
import useUserStore from "@/stores/userStore";
import { sendJoinRoom, sendLeaveRoom } from "@/websocket/sender";
import ResultDialog from "@/components/dialogs/ResultDialog";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import useLeaveRoom from "@/hooks/useLeaveRoom";

const RoomPage = () => {
  const client = useWebsocketStore((s) => s.client);
  const setCurrentRoomId = useWebsocketStore((s) => s.setCurrentRoomId);
  const gameState = useRoomStore((state) => state.gameState);

  const roomId = useRoomStore((s) => s.roomId);
  const hostId = useRoomStore((state) => state.hostId);
  const myUserId = useUserStore((state) => state.userId);
  const isHost = hostId > 0 && myUserId === hostId;

  // 중복 전송 방지 가드 코드
  const joinedRef = useRef(false);
  const leavingRef = useRef(false);

  const [hasTrackedPageView, setHasTrackedPageView] = useState(false);

  const leave = useLeaveRoom();

  // 방 페이지 조회 추적 (한 번만)
  useEffect(() => {
    if (roomId && !hasTrackedPageView) {
      track("page_viewed", {
        page_name: "room",
        previous_page: "lobby",
        view_source: "room_join",
        room_id: roomId,
        is_host: isHost,
        timestamp: getKoreanTimestamp(),
      });
      setHasTrackedPageView(true);
    }
  }, [roomId, isHost, hasTrackedPageView]);

  // 방 새로고침 차단 (브라우저 새로고침은 가능)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F5 또는 Ctrl+R 차단
      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 브라우저 뒤로가기
  useEffect(() => {
    const onPopState = () => {
      leave();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [leave]);

  useEffect(() => {
    if (!client || !client.connected || !roomId) return;

    joinRoom(roomId);
    if (!joinedRef.current) {
      if (!isHost) {
        sendJoinRoom(roomId);
      }
      joinedRef.current = true;
      setCurrentRoomId(roomId);
    }

    return () => {
      if (joinedRef.current && !leavingRef.current) {
        leavingRef.current = true;
        leaveRoom(roomId);
        sendLeaveRoom(roomId);
        setCurrentRoomId(null);
        joinedRef.current = false;
      }
    };
  }, [client, roomId, setCurrentRoomId]);

  const templateStatus = (): ReactNode => {
    switch (gameState) {
      case "PLAYING":
        return isHost ? <GameHostTemplate /> : <GamePlayerTemplate />;
      default:
        return <WaitingTemplate />;
    }
  };

  return (
    <>
      {templateStatus()}
      <ResultDialog />
    </>
  );
};

export default RoomPage;
