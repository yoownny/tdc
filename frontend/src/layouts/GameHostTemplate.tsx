import GameRoomHeader from "@/components/layout/GameRoomHeader";
import GameRoomChatSection from "@/components/layout/GameRoomChatSection";
import InGameProblemInfo from "@/components/layout/InGameProblemInfo";
import InGamePlayerQuestion from "@/components/layout/InGamePlayerQuestion";
import InGamePlayerAnswer from "@/components/layout/InGamePlayerAnswer";
import AnswerAttemptsExhaustedDialog from "@/components/dialogs/AnswerAttemptsExhaustedDialog";
import useGameStore from "@/stores/gameStore";
import useRoomStore from "@/stores/roomStore";
import useProblemStore from "@/stores/problemStore";
import { toast } from "sonner";
import { useEffect } from "react";

function GameHostTemplate() {
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const answerAttemptsExhaustedDialogOpen = useGameStore((state) => state.answerAttemptsExhaustedDialogOpen);
  
  const { hostNoResponseWarning, setHostNoResponseWarning } = useGameStore();

  // 디버깅용 로그
  console.log("🎮 GameHostTemplate 렌더링:", {
    answerAttemptsExhaustedDialogOpen,
    currentQuestion
  });

  // 방장 응답없음 Toast
  useEffect(() => {
    if (hostNoResponseWarning) {
      toast.warning("응답 시간이 지났습니다", {
        description: "1번 더 응답하지 않으면 게임에서 퇴장됩니다.",
        duration: 3000, // 3초간 표시
        dismissible: true, // 닫기 가능
        action: {
          label: "확인",
          onClick: () => {
            console.log("방장 응답없음 경고 확인됨");
            setHostNoResponseWarning(false); // 상태 리셋
          },
        },
      });
      
      // 3초 후 자동으로 상태 리셋
      setTimeout(() => {
        setHostNoResponseWarning(false);
      }, 3000);
    }
  }, [hostNoResponseWarning, setHostNoResponseWarning]);

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

        {/* 문제/질문 응답 섹션 */}
        <div className="max-h-[700px] col-span-2 grid grid-rows-2 gap-4">
          {/* 현재 문제 정보 */}
          <InGameProblemInfo />

          {/* 질문 응답 영역 */}
          {currentQuestion?.type === "GUESS" ? (
            <InGamePlayerAnswer />
          ) : (
            <InGamePlayerQuestion />
          )}
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

export default GameHostTemplate;
