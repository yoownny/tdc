import GameRoomHeader from "@/components/layout/GameRoomHeader";
import GameRoomChatSection from "@/components/layout/GameRoomChatSection";
import InGamePlayerInput from "@/components/layout/InGamePlayerInput";
import InGameHistory from "@/components/layout/InGameHistory";
import AnswerAttemptsExhaustedDialog from "@/components/dialogs/AnswerAttemptsExhaustedDialog";
import useGameStore from "@/stores/gameStore";
import useRoomStore from "@/stores/roomStore";
import useProblemStore from "@/stores/problemStore";

function GamePlayerTemplate() {
  const answerAttemptsExhaustedDialogOpen = useGameStore((state) => state.answerAttemptsExhaustedDialogOpen);

  const handleDialogClose = () => {
    const { setAnswerAttemptsExhaustedDialogOpen, roomId } = useGameStore.getState();
    const { resetRoom } = useRoomStore.getState();
    const { resetProblem } = useProblemStore.getState();
    const { clearGameData } = useGameStore.getState();

    // 다이얼로그 닫기
    setAnswerAttemptsExhaustedDialogOpen(false);

    // 모든 게임 관련 상태 초기화
    resetRoom();
    resetProblem();
    clearGameData();

    // 해당 방 대기 페이지로 이동
    window.location.replace(`/rooms/${roomId}`);
  };

  return (
    <div className="grid gap-4">
      {/* 상단 고정 헤더 + 하부 (고정 크기 + 상대 크기) */}
      <GameRoomHeader />

      {/* 하단 본 영역 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 채팅 영역 */}
        <GameRoomChatSection />

        {/* 히스토리/질문 및 답변 섹션 */}
        <div className="max-h-[700px] col-span-2 grid grid-rows-2 gap-4">
          {/* 현재 문제 정보 */}
          <InGameHistory />

          {/* 질문 답변 영역 */}
          <InGamePlayerInput />
        </div>
      </div>

      {/* 정답 횟수 소진 다이얼로그 */}
      <AnswerAttemptsExhaustedDialog
        open={answerAttemptsExhaustedDialogOpen}
        onClose={handleDialogClose}
      />
    </div>
  );
}

export default GamePlayerTemplate;
