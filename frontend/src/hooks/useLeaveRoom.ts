import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useRoomStore from "@/stores/roomStore";
import useUserStore from "@/stores/userStore";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import { sendLeaveRoom } from "@/websocket/sender";

export default function useLeaveRoom() {
  const navigate = useNavigate();

  const roomId = useRoomStore((s) => s.roomId);
  const gameState = useRoomStore((s) => s.gameState);
  const getRoomStayDuration = useRoomStore((s) => s.getRoomStayDuration);

  const userId = useUserStore((s) => s.userId);
  const hostId = useRoomStore((s) => s.hostId);
  const isHost = userId === hostId;

  // 뒤로가기 연타 막기
  const leavingRef = useRef(false);

  const leave = useCallback(async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;

    const stayDurationSeconds = getRoomStayDuration();

    track("room_left", {
      leave_reason: "manual",
      time_in_room_seconds: stayDurationSeconds,
      room_phase: gameState === "WAITING" ? "waiting" : "playing",
      was_host: isHost,
      room_id: roomId,
      timestamp: getKoreanTimestamp(),
    });

    try {
      // sessionStorage에서 방 정보 즉시 삭제 (뒤로가기 대응)
      sessionStorage.removeItem("room-storage");
      sessionStorage.removeItem("game-storage");

      // room.tsx의 cleanup에서 sendLeaveRoom을 처리하므로 여기서는 제거
      // 로비로 직접 이동
      navigate("/lobby");
    } catch {
      track("room_leave_failed", {
        room_id: roomId,
        error_reason: "navigation_error",
        timestamp: getKoreanTimestamp(),
      });
      alert("방 나가기에 실패하였습니다.");
    }
  }, [gameState, getRoomStayDuration, isHost, navigate, roomId]);

  return leave;
}
