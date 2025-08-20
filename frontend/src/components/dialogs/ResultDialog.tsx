import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { apiClient } from "@/services/api/apiClient";
import useProblemStore from "@/stores/problemStore";
import useRoomStore from "@/stores/roomStore";
import useGameStore from "@/stores/gameStore";
import useUserStore from "@/stores/userStore";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const evaluateProblem = async ({
  problemId, // string (숫자 or uuid)
  totalPlayers,
}: {
  problemId: string;
  totalPlayers: number;
}) => {
  const isMemory = problemId.includes("-");

  const body = isMemory
    ? {
        memoryProblemId: problemId,
        isLike: true,
        totalPlayers,
      }
    : {
        problemId: Number(problemId),
        isLike: true,
      };

  try {
    await apiClient.post("/problems/evaluate", body);
    alert("평가 완료! 감사합니다.");
  } catch (err) {
    console.error("문제 평가 실패:", err);
    alert("평가에 실패했습니다.");
  }
};

const ResultDialog = () => {
  const problemId = useProblemStore((state) => state.problemId);
  const totalPlayers = useRoomStore((state) => state.numPlayers);

  const endReason = useGameStore((state) => state.endReason);
  const winnerName = useGameStore((state) => state.winnerName);
  // const answerContent = useGameStore((state) => state.submitted_answer);
  const totalQuestionCount = useGameStore((state) => state.totalQuestionCount);
  const playTime = useGameStore((state) => state.playTime);

  const problemContent = useProblemStore((state) => state.content);
  const problemAnswer = useProblemStore((state) => state.answer);

  const resultOpen = useGameStore((s) => s.resultOpen);
  const setResultOpen = useGameStore((s) => s.setResultOpen);
  const clearGameData = useGameStore((s) => s.clearGameData);
  const updateRoomStatus = useRoomStore((s) => s.updateRoomStatus);
  
  // 현재 사용자 정보
  const userId = useUserStore((s) => s.userId);
  const hostId = useRoomStore((s) => s.hostId);
  const isHost = userId === hostId;

  // 문제 평가 버튼 클릭 핸들러
  const handleEvaluateClick = async () => {
    track("problem_rated", {
      problem_type: problemId.includes("-") ? "custom" : "existing",
      rating: "like",
      game_outcome: endReason === "CORRECT_ANSWER" ? "victory" : "timeout",
      game_duration_seconds: playTime ? parseInt(playTime.replace(/[^0-9]/g, '')) * 60 : 0,
      timestamp: getKoreanTimestamp(),
    });

    await evaluateProblem({
      problemId: problemId,
      totalPlayers: totalPlayers,
    });
  };

  // Modal이 닫힌 경우 로직
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      track("game_result_viewed", {
        game_outcome: endReason === "CORRECT_ANSWER" ? "victory" : "timeout",
        winner_name: winnerName || "none",
        total_questions: totalQuestionCount,
        play_time: playTime || "0",
        was_host: isHost,
        timestamp: getKoreanTimestamp(),
      });
    }

    setResultOpen(open);

    if (!open) {
      console.log(isHost ? "방장이 모달을 닫았습니다" : "참가자가 모달을 닫았습니다");
      clearGameData(); // 게임 관련 일시 데이터 초기화
      updateRoomStatus("WAITING"); // 대기방 상태로 전환
    }
  };

  console.log(endReason, winnerName);

  return (
    <Dialog open={resultOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader className="text-center">
          <DialogTitle>수사 결과</DialogTitle>
        </DialogHeader>

        {/* 결과 메시지 */}
        <div className="text-center p-4">
          <div className="text-2xl mb-2">
            {endReason === "CORRECT_ANSWER" ? "🎉" : "📝"}
          </div>
          <div className="text-lg font-semibold">
            {endReason === "CORRECT_ANSWER"
              ? "수사 성공!"
              : "수사 종료"}
          </div>
        </div>

        {/* 게임 정보 */}
        <div className="flex gap-2 justify-center">
          <Badge className="px-3 py-1 text-black bg-gray-200">
            소요시간 {playTime}
          </Badge>
          <Badge className="px-3 py-1 text-black bg-gray-200">
            시도횟수 {totalQuestionCount}턴
          </Badge>
          <Badge className="px-3 py-1 text-black bg-gray-200">
            정답자: {winnerName !== "" ? winnerName : "없음"}
          </Badge>
        </div>

        {/* 사건 내용 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base">사건 내용</h3>
          <div className="bg-muted rounded-md p-4 text-sm">
            {problemContent}
          </div>
        </div>

        {/* 사건의 전말 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base">사건의 전말</h3>
          <div className="bg-muted rounded-md p-4 text-sm font-medium">
            {problemAnswer}
          </div>
        </div>

        {/* 좋아요 버튼 */}
        <div className="text-center mt-6">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleEvaluateClick}
            className="hover:bg-point-200/50"
          >
            👍 이 문제 좋아요
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResultDialog;
