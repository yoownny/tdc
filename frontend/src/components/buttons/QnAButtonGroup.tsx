import { Button } from "@/components/ui/button";
import useRoomStore from "@/stores/roomStore";
import useGameStore from "@/stores/gameStore";
import {
  AnswerStatus,
  type Interaction,
  type PlayAction,
} from "@/types/game/game";
import { sendReply } from "@/websocket/sender";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import { useState, useEffect } from "react";

interface QnAButtonGroupProps {
  question: Interaction;
}

const QnAButtonGroup = ({ question }: QnAButtonGroupProps) => {
  const roomId = useRoomStore((state) => state.roomId);
  const currentTimer = useGameStore((state) => state.currentTimer);
  const gameHistory = useGameStore((state) => state.gameHistory);
  
  // 질문이 시작된 시점의 시간을 기록
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [questionStartTimer, setQuestionStartTimer] = useState<number | null>(null);

  // 질문이 변경될 때마다 시작 시간 기록
  useEffect(() => {
    if (question && question.status === AnswerStatus.PENDING) {
      setQuestionStartTime(Date.now());
      setQuestionStartTimer(currentTimer);
    }
  }, [question?.id, question?.status, currentTimer]);

  const isDisabled =
    !question ||
    question.content.trim() === "" ||
    question.status !== AnswerStatus.PENDING;

  const handleAnswer = (answerType: AnswerStatus) => {
    if (isDisabled) return;

    // 실제 응답 시간 계산
    const responseTimeSeconds = questionStartTime 
      ? Math.floor((Date.now() - questionStartTime) / 1000)
      : 0;

    // 턴 제한 시간 계산 (시작 시 타이머에서 현재 타이머를 뺀 값)
    const turnTimeLimitSeconds = questionStartTimer && currentTimer
      ? Math.max(0, questionStartTimer - currentTimer)
      : 20; // 기본값

    // 🎯 출제자의 질문 답변 추적 (핵심 게임 플레이 지표)
    track("question_answered", {
      question_number: gameHistory.filter(h => h.type === "QUESTION").length + 1,
      answer_type: answerType === AnswerStatus.CORRECT ? "yes" : 
                   answerType === AnswerStatus.INCORRECT ? "no" : "irrelevant",
      response_time_seconds: responseTimeSeconds,
      turn_time_limit_seconds: turnTimeLimitSeconds,
      remaining_timer_seconds: currentTimer,
      timestamp: getKoreanTimestamp(),
    });

    sendReply(roomId, question.playerId, question.content, answerType);
  };

  const buttons: PlayAction[] = [
    {
      buttonLabel: "예",
      onClick: () => handleAnswer(AnswerStatus.CORRECT),
    },
    {
      buttonLabel: "아니오",
      onClick: () => handleAnswer(AnswerStatus.INCORRECT),
    },
    {
      buttonLabel: "상관없음",
      onClick: () => handleAnswer(AnswerStatus.IRRELEVANT),
    },
  ];

  const buttonStyles = [
    "bg-green-500/30 border-green-400/50 hover:bg-green-500/50 hover:border-green-400/70 text-black",
    "bg-red-500/30 border-red-400/50 hover:bg-red-500/50 hover:border-red-400/70 text-black",
    "bg-yellow-500/30 border-yellow-400/50 hover:bg-yellow-500/50 hover:border-yellow-400/70 text-black",
  ];

  return (
    <div className="flex w-full gap-3" role="group">
      {buttons.map((keys, index) => (
        <Button
          key={index}
          variant="outline"
          className={`flex-1 h-12 text-xl font-ownglyph font-semibold transition-all duration-200 border backdrop-blur-sm ${buttonStyles[index]}`}
          onClick={keys.onClick}
          disabled={isDisabled}
        >
          {keys.buttonLabel}
        </Button>
      ))}
    </div>
  );
};

export default QnAButtonGroup;