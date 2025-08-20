import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AnswerAssessButtonGroup from "../buttons/AnswerAssessButtonGroup";
import { TimerLeft } from "../timer/Timer";
import useGameStore from "@/stores/gameStore";
import useRoomStore from "@/stores/roomStore";
import { useCallback, useEffect, useState, useMemo } from "react";

const InGamePlayerAnswer = () => {
  const gameState = useGameStore((state) => state);
  const currentQuestion = gameState.currentQuestion;
  const lastTurnChange = gameState.lastTurnChange;
  const [, forceUpdate] = useState({});

  // 타이머 동기화를 위한 key
  const timerKey = useMemo(() => {
    return `${lastTurnChange}-${currentQuestion?.status}-${currentQuestion?.username}`;
  }, [lastTurnChange, currentQuestion?.status, currentQuestion?.username]);

  // lastTurnChange 감지하여 강제 업데이트
  useEffect(() => {
    forceUpdate({});
  }, [lastTurnChange]);

  // 정답 판정 상태 정보
  const getJudgeStatusInfo = () => {
    if (
      currentQuestion &&
      currentQuestion.type === "GUESS" &&
      currentQuestion.status === "PENDING"
    ) {
      return {
        message: "정답이 도착했어요! 정답 여부를 골라주세요!",
        showTimer: true,
        gameState: "judge" as const,
      };
    }
    return {
      message: "정답 판정을 기다리는 중...",
      showTimer: false,
      gameState: "waiting" as const,
    };
  };

  const {
    message,
    showTimer,
    gameState: timerGameState,
  } = getJudgeStatusInfo();

  // 타이머 시간 초과 시 처리 (정답 판정 중에는 턴을 넘기지 않음)
  const handleTimerComplete = useCallback(() => {
    console.log("정답 판정 타이머 시간 초과");
    // 정답 판정 중에는 자동 턴 패스하지 않음
  }, []);

  return (
    <Card className="bg-white rounded-xl border border-white/10 h-full flex flex-col p-6 gap-4">
      <CardHeader className="p-0">
        <CardTitle className="text-pc-title-sm font-semibold text-gray font-ownglyph">
          <Card className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 font-ownglyph">
            {currentQuestion?.username}의 정답 제출
          </Card>
        </CardTitle>
      </CardHeader>

      {/* 정답 판정 상태 메시지와 타이머 */}
      <div className="text-center">
        <div className="text-pc-body-sm text-gray/80 mb-2">{message}</div>
        {showTimer && (
          <TimerLeft
            key={timerKey}
            gameState={timerGameState}
            onComplete={handleTimerComplete}
          />
        )}
      </div>

      <CardContent className="flex-1 overflow-y-auto p-0">
        <Card className="bg-white/5 backdrop-blur-sm rounded-lg h-full p-4 border border-white/10">
          <span className="text-pc-body-md text-gray leading-relaxed">
            {currentQuestion?.content}
          </span>
        </Card>
      </CardContent>

      <CardFooter className="p-0">
        {currentQuestion && (
          <AnswerAssessButtonGroup question={currentQuestion} />
        )}
      </CardFooter>
    </Card>
  );
};

export default InGamePlayerAnswer;
