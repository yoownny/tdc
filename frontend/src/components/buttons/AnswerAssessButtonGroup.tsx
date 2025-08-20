import { Button } from "@/components/ui/button";
import useRoomStore from "@/stores/roomStore";
import {
  AnswerStatus,
  type Interaction,
  type PlayAction,
} from "@/types/game/game";
import { sendJudgement } from "@/websocket/sender";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import useGameStore from "@/stores/gameStore";

interface AnswerAssessButtonGroupProps {
  question: Interaction;
}

const AnswerAssessButtonGroup = ({
  question,
}: AnswerAssessButtonGroupProps) => {
  const roomId = useRoomStore((state) => state.roomId);

  const gameHistory = useGameStore((state) => state.gameHistory);

  const handleJudgement = (isCorrect: boolean) => {
    if (question.status !== AnswerStatus.PENDING) {
      console.log("정답 시도가 이미 처리되었음:", question);
      return;
    }

    console.log("정답 판정 요청:", {
      roomId,
      playerId: question.playerId,
      guess: question.content,
      isCorrect,
      questionStatus: question.status
    });

    const totalQuestions = gameHistory.filter(
      (h) => h.type === "QUESTION"
    ).length;

    track("answer_judged", {
      is_correct: isCorrect,
      judgment_time_seconds: 0, // 판정 시간은 즉시이므로 0
      total_questions_when_judged: totalQuestions,
      judgment_time_limit_seconds: 60,
      timestamp: getKoreanTimestamp(),
    });

    const answerType = isCorrect
      ? AnswerStatus.CORRECT
      : AnswerStatus.INCORRECT;
    
    sendJudgement(roomId, question.playerId, question.content, answerType);
  };

  const buttons: PlayAction[] = [
    {
      buttonLabel: "맞습니다",
      onClick: () => handleJudgement(true),
    },
    {
      buttonLabel: "아닙니다",
      onClick: () => handleJudgement(false),
    },
  ];

  const buttonStyles = [
    "bg-green-500/30 border-green-400/50 hover:bg-green-500/50 hover:border-green-400/70 text-black",
    "bg-red-500/30 border-red-400/50 hover:bg-red-500/50 hover:border-red-400/70 text-black",
  ];

  return (
    <div className="flex w-full gap-3" role="group">
      {buttons.map((keys, index) => (
        <Button
          key={index}
          variant="outline"
          className={`flex-1 h-12 text-xl font-ownglyph font-semibold transition-all duration-200 border backdrop-blur-sm ${buttonStyles[index]}`}
          onClick={keys.onClick}
        >
          {keys.buttonLabel}
        </Button>
      ))}
    </div>
  );
};

export default AnswerAssessButtonGroup;
