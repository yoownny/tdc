import GameRoomHeader from "@/components/layout/GameRoomHeader";
import GameRoomChatSection from "@/components/layout/GameRoomChatSection";
import WaitingProblemInfo from "@/components/layout/WaitingProblemInfo";
import PlayerListPanel from "@/components/layout/PlayerListPanel";
import HostButtonSet from "@/components/buttons/HostButtonSet";
import PlayerButtonSet from "@/components/buttons/PlayerButtonSet";
import useUserStore from "@/stores/userStore";
import useRoomStore from "@/stores/roomStore";
import HostAcceptDialog from "@/components/dialogs/TransferHostDialog";
import { useEffect } from "react";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import { toast } from "sonner";
import useProblemStore from "@/stores/problemStore";

function WaitingTemplate() {
  const players = useRoomStore((state) => state.players);
  const roomId = useRoomStore((state) => state.roomId);
  const myUserId = useUserStore((state) => state.userId);
  const isHost = players.find((player) => player.id === myUserId)?.isHost ?? false;

  const { timerWarning, hostTimeout, setTimerWarning } = useRoomStore();
  // 모든 플레이어 준비 상태 확인
  const areAllPlayersReady = useRoomStore((state) => state.areAllPlayersReady);

  // 대기방 진입 추적
  useEffect(() => {
    track("game_waiting_room_entered", {
      is_host: isHost,
      current_players_count: players.length,
      problem_selected: true,
      room_id: roomId,
      timestamp: getKoreanTimestamp(),
    });
  }, [isHost, players.length, roomId]);

  // 4분 30초 경고 Toast 처리 (방장만)
  useEffect(() => {
    if (timerWarning && isHost) {
      toast.warning("게임 시작 시간 경고", {
        description: "30초 이내에 게임을 시작하지 않으면 방에서 퇴장됩니다.",
        duration: 5000, // 5초간 표시
        closeButton: true,
        action: {
          label: "확인",
          onClick: () => {
            console.log("방장 타이머 경고 확인됨");
            setTimerWarning(false); // 상태 리셋
          },
        },
      });
    }
  }, [timerWarning, isHost, setTimerWarning]);

  // 모든 플레이어가 준비 완료되지 않은 상태로 변경되면 경고 Toast 해제
  useEffect(() => {
    if (timerWarning && !areAllPlayersReady()) {
      console.log("플레이어 준비 상태 변경으로 타이머 경고 해제");
      setTimerWarning(false);
    }
  }, [players, timerWarning, areAllPlayersReady, setTimerWarning]);

  // 5분 강퇴 Toast 처리 (방장만)
  useEffect(() => {
    if (hostTimeout && isHost) {
      toast.error("시간 초과로 방에서 퇴장됩니다", {
        description: "게임을 시작하지 않아 방에서 퇴장됩니다.",
        duration: 3000,
        dismissible: false, // 강퇴는 닫기 불가
      });

      // 방장 강퇴 처리
      setTimeout(() => {
        console.log("방장 5분 타이머 만료 강퇴");

        // Amplitude 추적 (방장 타임아웃으로 퇴장)
        track("room_left", {
          leave_reason: "host_timeout",
          time_in_room_seconds: useRoomStore.getState().getRoomStayDuration(),
          room_phase: "waiting",
          was_host: true,
          room_id: roomId,
          timestamp: getKoreanTimestamp(),
        });

        // 서버 응답을 기다리지 않고 즉시 이동 (타임아웃)
        setTimeout(() => {
          const { resetRoom } = useRoomStore.getState();
          const { resetProblem } = useProblemStore.getState();

          resetRoom();
          resetProblem();

          window.location.href = "/lobby";
        }, 500); // 0.5초 후 이동 (서버 알림 전송 후)
      }, 1000); // 1초 후 강퇴 처리
    }
  }, [hostTimeout, isHost, roomId]);

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* 상단 고정 헤더 */}
      <GameRoomHeader />

      {/* 하단 본 영역 - 채팅 영역 높이에 맞춰 고정 */}
      <div className="flex gap-6 px-6 py-3 max-w-[1440px] mx-auto w-full">
        {/* 채팅 영역 - 고정 높이 700px */}
        <div className="w-2/5">
          <GameRoomChatSection isWaiting={true} />
        </div>

        {/* 문제/참가자/버튼 섹션 - 채팅 영역과 같은 높이 */}
        <div className="flex-1 flex flex-col gap-6">
          {/* 문제 정보 */}
          <div className="flex-shrink-0">
            <WaitingProblemInfo isHost={isHost} />
          </div>

          {/* 참가자 + 버튼 (3:2 비율) - 남은 공간을 모두 사용 */}
          <div className="flex-1 flex gap-6 min-h-0">
            {/* 참가자 패널 */}
            <div className="flex-1 flex flex-col">
              <PlayerListPanel />
            </div>

            {/* 버튼 영역 */}
            <div className="w-80 flex flex-col">
              {isHost ? <HostButtonSet /> : <PlayerButtonSet />}
            </div>
          </div>
        </div>
      </div>
      <HostAcceptDialog />
    </div>
  );
}

export default WaitingTemplate;
