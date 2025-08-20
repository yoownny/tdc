import { Button } from "@/components/ui/button";
import useRoomStore from "@/stores/roomStore";
import useGameStore from "@/stores/gameStore";
import useUserStore from "@/stores/userStore";
import type { PlayAction } from "@/types/game/game";
import { sendAnswer, sendQuestion, sendTurnOver } from "@/websocket/sender";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface InputThrowButtonGroupProps {
  contentInput: string;
  setContentInput: (value: string) => void;
  isMyTurn: boolean;
  isWaitingForResponse?: boolean;
}

const InputThrowButtonGroup = ({
  contentInput,
  setContentInput,
  isMyTurn,
  isWaitingForResponse = false,
}: InputThrowButtonGroupProps) => {
  const roomId = useRoomStore((state) => state.roomId);
  const addInteraction = useGameStore((state) => state.addInteraction);
  const myId = useUserStore((state) => state.userId);
  const gameHistory = useGameStore((state) => state.gameHistory);
  const currentTimer = useGameStore((state) => state.currentTimer);
  const { remainingQuestions, totalQuestions, players } = useGameStore();
  const updatePlayerAnswerAttempts = useGameStore(
    (state) => state.updatePlayerAnswerAttempts
  );

  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
  const [maxTurnTime] = useState<number>(30);

  // 현재 사용자의 정보 찾기
  const currentPlayer = players.find((player) => player.id === myId);
  // 스토어에는 '남은 시도 수'를 저장 (3 → 0 차감)
  const remainingAnswerAttempts = currentPlayer?.answerAttempts ?? 3; // 초기값 3

  useEffect(() => {
    if (currentTimer > 0 && turnStartTime === null) {
      setTurnStartTime(Date.now());
    }
  }, [currentTimer, turnStartTime]);

  // remainingQuestions 변경 시 강제 리렌더링
  useEffect(() => {
    // remainingQuestions가 변경될 때마다 컴포넌트 리렌더링
    console.log(
      "InputThrowButtonGroup - remainingQuestions 변경됨:",
      remainingQuestions
    );
  }, [remainingQuestions]);

  // 채팅 추가 시 Logic
  // 채팅 추가 시 Logic
  const onAddHistory = useCallback(
    (handlerAction: (contentInput: string) => void) => {
      const content = contentInput.trim();
      if (content !== "") {
        setContentInput("");
        handlerAction(content);
      }
    },
    [setContentInput, contentInput]
  );

  const canAct = isMyTurn && !isWaitingForResponse; // ✅ 내 턴에서만 질문/패스 허용
  const isContentEmpty = contentInput.trim().length === 0;

  const guardNotMyTurn = () => {
    toast.error("지금은 당신의 차례가 아닙니다.", {
      description: "자신의 차례가 와야 질문/차례 넘기기를 사용할 수 있어요.",
    });
  };

  const handleQuestionSubmit = useCallback(() => {
    if (!canAct) {
      // ✅ 가드
      guardNotMyTurn();
      return;
    }

    const responseTime = turnStartTime
      ? Math.round((Date.now() - turnStartTime) / 1000)
      : 0;

    // 🎯 질문 제출 추적 (핵심 게임 플레이 지표)
    track("question_asked", {
      question_number:
        gameHistory.filter((h) => h.type === "QUESTION").length + 1,
      question_length: contentInput.trim().length,
      response_time_seconds: responseTime,
      turn_time_limit_seconds: maxTurnTime,
      timestamp: getKoreanTimestamp(),
    });

    onAddHistory((content) => {
      sendQuestion(roomId, content);
      addInteraction("QUESTION", myId, content);
      // remainingQuestions 차감은 QUESTION 이벤트 수신 시에서 처리
    });

    setTurnStartTime(null);
  }, [
    canAct,
    contentInput,
    roomId,
    gameHistory,
    maxTurnTime,
    myId,
    addInteraction,
    turnStartTime,
    onAddHistory,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;

      if (e.key === "Enter") {
        const active = document.activeElement as HTMLElement | null;
        const tag = active?.tagName?.toLowerCase();

        if (tag === "textarea" || tag === "input") {
          const trimmed = contentInput.trim();

          if (isMyTurn && !isWaitingForResponse && trimmed.length > 0) {
            e.preventDefault();
            handleQuestionSubmit();
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMyTurn, isWaitingForResponse, contentInput, handleQuestionSubmit]);

  const handleGuessSubmit = () => {
    if (remainingAnswerAttempts <= 0) {
      toast.error("정답 시도 횟수가 모두 소진되었습니다.", {
        description: "더 이상 정답을 제출할 수 없습니다.",
      });
      return;
    }

    // 현재 플레이어의 정답 시도 '남은 수' 차감 (최소 0으로 캡)
    if (currentPlayer) {
      const nextAttempts = Math.max(0, remainingAnswerAttempts - 1);
      updatePlayerAnswerAttempts(myId, nextAttempts);
    }

    // 🎯 정답 제출 추적 (핵심 게임 완주 지표)
    const answerAttempts = gameHistory.filter((h) => h.type === "GUESS").length;
    const questionsAsked = gameHistory.filter(
      (h) => h.type === "QUESTION"
    ).length;

    track("answer_submitted", {
      submission_number: answerAttempts + 1,
      answer_length: contentInput.trim().length,
      submission_timing: "during_question_turn",
      questions_asked_so_far: questionsAsked,
      timestamp: getKoreanTimestamp(),
    });

    onAddHistory((content) => sendAnswer(roomId, content));
    toast.success("정답을 제출하였습니다!", {
      description: "시니어 탐정이 검토할 때까지 대기해 주세요.",
    });
  };

  const handleTurnPass = () => {
    if (!canAct) {
      // ✅ 가드
      guardNotMyTurn();
      return;
    }

    // 🎯 질문 턴 패스 추적 (게임 플레이 패턴 분석)
    track("question_turn_passed", {
      pass_type: "manual",
      remaining_time_seconds: currentTimer,
      consecutive_passes: 1,
      timestamp: getKoreanTimestamp(),
    });

    sendTurnOver(roomId, "MANUAL");
    setTurnStartTime(null);
  };

  const buttons: PlayAction[] = [
    {
      buttonLabel: "차례 넘기기",
      onClick: handleTurnPass,
    },
    {
      buttonLabel: (
        <>
          질문하기 (
          <span className="text-yellow-600 font-ownglyph">
            {remainingQuestions || 0}
          </span>
          / {totalQuestions || 0} )
        </>
      ),
      onClick: handleQuestionSubmit,
    },
    {
      buttonLabel: (
        <>
          정답 제출 (
          <span className="text-point-400 font-ownglyph">
            {remainingAnswerAttempts}
          </span>
          /{"  "}3 )
        </>
      ),
      onClick: handleGuessSubmit,
    },
  ];

  const buttonStyles = [
    "bg-gray-500/30 border-gray-400/50 hover:bg-gray-500/50 hover:border-gray-400/70 text-black",
    "bg-yellow-500/30 border-yellow-400/50 hover:bg-yellow-500/50 hover:border-yellow-400/70 text-black",
    "bg-green-500/30 border-green-400/50 hover:bg-green-500/50 hover:border-green-400/70 text-black",
  ];

  return (
    <div className="flex w-full gap-3" role="group">
      {buttons.map((keys, index) => {
        const isQuestionOrPass = index !== 2;
        const visuallyDisabled = isQuestionOrPass && !canAct;
        const isPass = index === 0; // 차례 넘기기
        const isQuestion = index === 1; // 질문하기
        const isGuess = index === 2; // 정답제출

        const disabled =
          (isPass && !canAct) ||
          (isQuestion && (!canAct || isContentEmpty)) ||
          (isGuess && (isContentEmpty || remainingAnswerAttempts <= 0));

        return (
          <Button
            key={index}
            variant="outline"
            disabled={disabled}
            aria-disabled={visuallyDisabled}
            onClick={keys.onClick}
            className={[
              "flex-1 h-12 text-xl text-gray font-ownglyph font-semibold transition-all duration-200 border backdrop-blur-sm",
              buttonStyles[index],
              visuallyDisabled ? "opacity-50 cursor-not-allowed" : "",
              isQuestion && isMyTurn ? "animate-bounce" : "",
            ].join(" ")}
          >
            {keys.buttonLabel}
          </Button>
        );
      })}
    </div>
  );
};

export default InputThrowButtonGroup;
