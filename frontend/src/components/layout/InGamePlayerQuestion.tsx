import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import QnAButtonGroup from "../buttons/QnAButtonGroup";
import { TimerLeft } from "../timer/Timer";
import useGameStore from "@/stores/gameStore";
import useRoomStore from "@/stores/roomStore";
import { sendHostTimeout } from "@/websocket/sender";
import { useCallback, useEffect, useState, useMemo } from "react";

const InGamePlayerQuestion = () => {
  // 전체 게임 상태를 구독하여 변경사항을 확실히 감지
  const gameState = useGameStore((state) => state);
  const currentQuestion = gameState.currentQuestion;
  const currentPlayer = gameState.currentPlayer;
  const lastTurnChange = gameState.lastTurnChange; // 턴 변경 감지용
  const roomId = useRoomStore((state) => state.roomId);
  const [, forceUpdate] = useState({});
  // 타이머 동기화를 위한 key (상태 기반)
  const timerKey = useMemo(() => {
    return `${lastTurnChange}-${currentQuestion?.status}-${currentQuestion?.username}`;
  }, [lastTurnChange, currentQuestion?.status, currentQuestion?.username]);

  // lastTurnChange 감지하여 강제 업데이트
  useEffect(() => {
    forceUpdate({});
  }, [lastTurnChange]);

  // 방장의 게임 상태에 따른 메시지와 타이머 표시 로직
  const getHostGameStatusInfo = () => {
    console.log("getHostGameStatusInfo 호출:", {
      currentQuestion,
      currentPlayer,
      currentPlayerName: currentPlayer?.name,
    });

    if (!currentQuestion) {
      const currentPlayerName = currentPlayer?.name || "알 수 없음";
      return {
        message: `${currentPlayerName}님의 질문을 기다리는 중...`,
        showTimer: true,
        gameState: "waiting" as const,
      };
    } else if (
      currentQuestion.status === "PENDING" &&
      currentQuestion.type === "QUESTION"
    ) {
      // 질문에 대한 답변
      return {
        message: "내 차례! 질문에 답을 골라보세요",
        showTimer: true,
        gameState: "answer" as const,
      };
    } else if (
      currentQuestion.status === "PENDING" &&
      currentQuestion.type === "GUESS"
    ) {
      // 정답 제출에 대한 판정
      return {
        message: "정답이 도착했어요! 정답 여부를 골라주세요!",
        showTimer: true,
        gameState: "judge" as const,
      };
    } else {
      // 이미 처리된 상태
      const currentPlayerName = currentPlayer?.name || "알 수 없음";
      return {
        message: `${currentPlayerName}님의 질문을 기다리는 중...`,
        showTimer: true,
        gameState: "waiting" as const,
      };
    }
  };

  const {
    message,
    showTimer,
    gameState: timerGameState,
  } = getHostGameStatusInfo();

  // 타이머 시간 초과 시 자동으로 턴 패스
  const handleTimerComplete = useCallback(() => {
    // 정답 판정 중일 때는 턴을 넘기지 않음
    if (
      currentQuestion &&
      currentQuestion.type === "GUESS" &&
      currentQuestion.status === "PENDING"
    ) {
      console.log("방장 정답 판정 중 - 턴 패스 보류");
      return;
    }

    // 플레이어가 질문할 차례에 방장의 타이머가 만료된 경우,
    // 실제 턴 패스는 플레이어 클라이언트에서 처리하므로 방장은 아무것도 하지 않음.
    // 방장은 자신의 답변/판정 차례에만 타임아웃 책임을 가짐.
    if (currentQuestion) {
      console.log("방장 타이머 시간 초과 - 자동 턴 패스");
      sendHostTimeout(roomId);
    }
  }, [roomId, currentQuestion]);

  return (
    <Card className="bg-white rounded-xl border border-white/10 h-full flex flex-col p-6 gap-4">
      <CardHeader className="p-0">
        <CardTitle className="text-pc-title-sm font-semibold text-gray font-ownglyph">
          <Card className="bg-point-200/30 backdrop-blur-sm rounded-lg p-4 border border-white/10 font-ownglyph">
            {currentQuestion
              ? `${currentQuestion.username}의 질문`
              : `${currentPlayer?.name || "참가자"}의 차례`}
          </Card>
        </CardTitle>
      </CardHeader>

      {/* 방장용 게임 상태 메시지와 타이머 */}
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
            {currentQuestion
              ? currentQuestion.content
              : "질문이 올 때까지 대기해 주세요."}
          </span>
        </Card>
      </CardContent>

      <CardFooter className="p-0">
        {currentQuestion && <QnAButtonGroup question={currentQuestion} />}
      </CardFooter>
    </Card>
  );
};

export default InGamePlayerQuestion;
