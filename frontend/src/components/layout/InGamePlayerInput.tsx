import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import InputThrowButtonGroup from "../buttons/InputThrowButtonGroup";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo, useCallback, useEffect } from "react";
import { TimerLeft } from "../timer/Timer";
import useRoomStore from "@/stores/roomStore";
import useGameStore from "@/stores/gameStore";
import useUserStore from "@/stores/userStore";
import { sendTurnOver } from "@/websocket/sender";
import { getTimerColors } from "@/utils/timerColors";
import { toast } from "sonner";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const InGamePlayerInput = () => {
  const roomId = useRoomStore((s) => s.roomId);
  const [contentInput, setContentInput] = useState("");
  const [currentProgress, setCurrentProgress] = useState(100); // 타이머 progress 상태

  // 필요한 상태만 개별적으로 구독
  const currentPlayer = useGameStore((state) => state.currentPlayer);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const lastTurnChange = useGameStore((state) => state.lastTurnChange);
  const myName = useUserStore((state) => state.userName);
  const players = useGameStore((state) => state.players);

  // 현재 플레이어가 턴 당사자인지 확인
  const isMyTurn = currentPlayer?.name === myName;

  // 내가 방장인지 확인
  const isHost = players.find((p) => p.name === myName)?.isHost || false;

  // 타이머 동기화를 위한 key 상태
  const [timerKey, setTimerKey] = useState(Date.now());

  // // 디버깅용 콘솔 출력 (턴 변경 시에만)
  // useEffect(() => {
  //   console.log("InGamePlayerInput Debug:", {
  //     lastTurnChange, // 턴 변경 타임스탬프
  //     currentPlayer: currentPlayer?.name,
  //     myName,
  //     isMyTurn,
  //     isHost, // 방장 여부
  //     currentQuestion: currentQuestion,
  //     currentQuestionUsername: currentQuestion?.username,
  //   });
  // }, [lastTurnChange, isMyTurn, currentQuestion]);

  // currentQuestion과 턴 변경 감지 (타이머 동기화용)
  useEffect(() => {
    console.log("InGamePlayerInput - 상태 변경:", {
      hasQuestion: !!currentQuestion,
      questionStatus: currentQuestion?.status,
      questionUsername: currentQuestion?.username,
      currentPlayer: currentPlayer?.name,
      lastTurnChange,
    });
    setTimerKey(Date.now()); // 질문 상태 또는 턴 변경시 타이머 리셋
  }, [currentQuestion, lastTurnChange]);

  // 자기 턴이 돌아왔을 때 toast 알림
  useEffect(() => {
    if (isMyTurn) {
      toast.success("내 차례입니다! 질문을 입력하세요.");
    }
  }, [isMyTurn]);

  // 게임 상태에 따른 메시지와 타이머 표시 로직
  const getGameStatusInfo = useMemo(() => {
    console.log("getGameStatusInfo Debug:", {
      isMyTurn,
      currentQuestion: currentQuestion,
      currentQuestionStatus: currentQuestion?.status,
      currentQuestionUsername: currentQuestion?.username,
      currentQuestionType: currentQuestion?.type,
    });

    // 먼저 정답 판정 상태를 확인 (최우선)
    if (
      currentQuestion &&
      currentQuestion.type === "GUESS" &&
      currentQuestion.status === "PENDING"
    ) {
      // 정답 제출이 있고 방장이 판정 중인 상태
      if (isHost) {
        // 방장인 경우 - 정답 판정
        return {
          message: "정답이 도착했어요! 정답 여부를 골라주세요!",
          showTimer: true,
          gameState: "judge" as const,
          inputMode: "none" as const,
        };
      } else {
        // 일반 참가자인 경우 - 방장의 판정 대기
        return {
          message: "방장이 다른 참가자의 정답 제출을 판정 중입니다...",
          showTimer: true,
          gameState: "judge" as const,
          inputMode: "none" as const,
        };
      }
    }
    // 질문에 대한 응답 대기 상태 확인
    else if (
      currentQuestion &&
      currentQuestion.type === "QUESTION" &&
      currentQuestion.status === "PENDING"
    ) {
      if (isMyTurn) {
        // 내 턴이고 내 질문에 대한 응답을 기다리는 경우
        return {
          message: "내 질문에 대한 응답을 기다리는 중...",
          showTimer: true,
          gameState: "answer" as const,
          inputMode: "none" as const,
        };
      } else if (isHost) {
        // 방장인 경우 - 질문에 답변
        return {
          message: "질문에 답을 골라보세요",
          showTimer: true,
          gameState: "answer" as const,
          inputMode: "answer" as const,
        };
      } else {
        // 일반 참가자인 경우 - 방장의 응답 대기
        return {
          message: "다른 참가자의 질문에 대한 방장의 응답을 기다리는 중...",
          showTimer: true,
          gameState: "answer" as const,
          inputMode: "none" as const,
        };
      }
    }
    // 질문이 없는 상태
    else if (!currentQuestion) {
      if (isMyTurn) {
        // 내 턴이고 질문이 없는 경우 - 질문 입력 모드
        return {
          message: "질문을 입력해주세요!",
          showTimer: true,
          gameState: "question" as const,
          inputMode: "question" as const,
        };
      } else {
        // 질문이 없고 내 턴이 아닌 경우
        return {
          message: "다른 참가자가 질문하길 기다리는 중입니다...",
          showTimer: true,
          gameState: "waiting" as const,
          inputMode: "none" as const,
        };
      }
    }
    // 기타 상태
    else {
      return {
        message: "게임을 진행 중입니다...",
        showTimer: true,
        gameState: "waiting" as const,
        inputMode: "none" as const,
      };
    }
  }, [isMyTurn, currentQuestion, isHost]);

  const { message, showTimer, gameState, inputMode } = getGameStatusInfo;

  const inputColors = getTimerColors(currentProgress);

  // 응답 대기 상태 확인 (내 턴이고 내 질문에 대한 응답을 기다리는 중)
  const isWaitingForResponse =
    isMyTurn && currentQuestion && currentQuestion.status === "PENDING";

  // 방장 판정 대기 상태 확인 (정답이 제출되어 방장이 판정 중인 상태)
  const isWaitingForJudgment =
    currentQuestion &&
    currentQuestion.type === "GUESS" &&
    currentQuestion.status === "PENDING";

  const handleProgressChange = useCallback((progress: number) => {
    setCurrentProgress(progress);
  }, []);

  // 타이머 시간 초과 시 자동으로 턴 패스
  const handleTimerComplete = useCallback(() => {
    // 내 턴일 때만 자동 턴 패스 실행
    // 단, 방장이 판정 중인 상태에서는 턴을 넘기지 않음
    if (isMyTurn && !isWaitingForResponse && !isWaitingForJudgment) {
      console.log("타이머 시간 초과 - 자동 턴 패스");

      // 참가자 응답없음 1회 Toast 표시
      toast.warning("질문 시간이 초과되었습니다", {
        description: "자동으로 턴이 넘어갑니다.",
        duration: 3000, // 3초간 표시
        dismissible: true,
      });

      // Amplitude 추적
      track("question_turn_passed", {
        pass_type: "timeout", // 자동 타임아웃
        remaining_time_seconds: 0,
        consecutive_passes: 1,
        room_id: roomId,
        timestamp: getKoreanTimestamp(),
      });

      sendTurnOver(roomId, "TIMEOUT");
    } else if (isWaitingForResponse) {
      console.log("질문 응답 대기 중 - 턴 패스 보류");
    } else if (isWaitingForJudgment) {
      console.log("방장 판정 대기 중 - 턴 패스 보류");
    }
  }, [roomId, isMyTurn, isWaitingForResponse, isWaitingForJudgment]);

  // 입력 UI 표시 여부 결정
  const showInputUI = useMemo(() => {
    if (isMyTurn) {
      // 내 턴이면 항상 입력 UI 표시 (질문 대기 상태 포함)
      return true;
    } else if (
      !isMyTurn &&
      currentQuestion &&
      currentQuestion.status === "PENDING" &&
      isHost
    ) {
      // 방장이고 다른 사람의 질문에 답변하는 경우 - 답변 입력 UI 표시
      return true;
    } else if (!isMyTurn && !currentQuestion) {
      // 내 턴이 아니고 질문이 없는 경우 - 질문 입력 UI 표시 (비활성화됨)
      return true;
    } else if (
      !isMyTurn &&
      currentQuestion &&
      currentQuestion.status === "PENDING" &&
      !isHost
    ) {
      // 일반 참가자이고 다른 사람의 질문이 있는 경우 - 질문 입력 UI 표시 (미리 작성용)
      return true;
    }
    return false;
  }, [isMyTurn, currentQuestion, isHost]);

  // 버튼 활성화 여부는 각 버튼 컴포넌트에서 처리

  return (
    <Card className="bg-white rounded-xl border border-white/10 h-full flex flex-col p-6 gap-4">
      <CardHeader className="p-0">
        <CardTitle className="text-pc-title-sm font-semibold text-gray font-ownglyph">
          <Card
            className={`text-pc-title-sm backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 font-ownglyph ${
              isMyTurn ? "bg-point-200/30" : "bg-white/5"
            }`}
          >
            {isMyTurn ? "내 차례!" : `${currentPlayer?.name}의 차례`}
          </Card>
        </CardTitle>
      </CardHeader>

      {/* 게임 상태 메시지 */}
      <div className="text-center">
        <div className="text-pc-body-lg text-gray font-medium">{message}</div>
      </div>

      <CardFooter className="p-0 flex flex-col gap-4">
        {/* 타이머 표시 */}
        {showTimer && (
          <div className="w-full">
            <TimerLeft
              key={`timer-${timerKey}`}
              gameState={gameState}
              onComplete={handleTimerComplete}
              onProgressChange={handleProgressChange}
            />
          </div>
        )}

        {/* 입력 영역 - 원래대로 복원 */}
        {showInputUI && (
          <>
            <Textarea
              placeholder={
                inputMode === "question"
                  ? "내 차례일 때 질문을 해주세요!! (정답 제출은 언제나 3번 가능해요)"
                  : "질문에 답을 입력하세요..."
              }
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              className={`min-h-[100px] resize-none bg-white/5 backdrop-blur-sm text-gray placeholder:text-gray/50 ${
                isMyTurn && !isWaitingForResponse && !isWaitingForJudgment
                  ? "border-2 backdrop-blur-lg animate-pulse"
                  : "border border-white/10"
              }`}
              style={
                isMyTurn && !isWaitingForResponse && !isWaitingForJudgment
                  ? {
                      borderColor: inputColors.borderColor,
                      boxShadow: `0 0 20px ${inputColors.shadowColor}`,
                    }
                  : {}
              }
            />
            <InputThrowButtonGroup
              contentInput={contentInput}
              setContentInput={setContentInput}
              isMyTurn={isMyTurn}
              isWaitingForResponse={
                isWaitingForResponse || isWaitingForJudgment || false
              }
            />
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default InGamePlayerInput;
