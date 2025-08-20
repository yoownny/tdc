import { Progress } from "@/components/ui/progress";
import React, { useEffect, useRef, useState } from "react";
import { getTimerColors } from "@/utils/timerColors";

interface TimerProgressProps {
  gameState: "question" | "answer" | "judge" | "waiting";
  onComplete?: () => void;
  onProgressChange?: (progress: number) => void;
}

export const TimerLeft = React.memo(function TimerLeft({
  gameState,
  onComplete,
  onProgressChange,
}: TimerProgressProps) {
  // 게임 상태에 따른 시간 제한 설정
  const getDuration = () => {
    switch (gameState) {
      case "question":
        return 60; // 질문 60초
      case "answer":
        return 20; // 답변하기 20초
      case "judge":
        return 40; // 정답 채점 (답변 포함 40초 이내)
      case "waiting":
        return 60; // 대기 중 (기본값)
      default:
        return 60;
    }
  };

  const duration = getDuration();
  const [progress, setProgress] = useState(100);
  const [remainingSeconds, setRemainingSeconds] = useState(duration);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const gameStateRef = useRef<string>(gameState);
  
  const currentColors = getTimerColors(progress);

  useEffect(() => {
    // gameState가 실제로 변경되었을 때만 타이머 초기화
    if (gameStateRef.current !== gameState) {
      gameStateRef.current = gameState;

      // 기존 타이머 정리
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // 새 타이머 시작
      startTimeRef.current = Date.now();
      setRemainingSeconds(duration);
      setProgress(100);
    }

    // 타이머가 없을 때만 새로 시작
    if (!timerRef.current) {
      startTimeRef.current = Date.now();
      setRemainingSeconds(duration);
      setProgress(100);
    }

    // 100ms 마다 수행
    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(duration - Math.floor(elapsed / 1000), 0);
      const percentage = Math.max(100 - (elapsed / (duration * 1000)) * 100, 0);

      setProgress(percentage);
      setRemainingSeconds(remaining);
      
      if (onProgressChange) {
        onProgressChange(percentage);
      }

      if (percentage <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        // 시간 초과 시 onComplete 콜백 실행
        if (onComplete) {
          console.log("타이머 시간 초과 - onComplete 실행");
          onComplete();
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, duration, onComplete, onProgressChange]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-full">
        <Progress 
          value={progress} 
          className="w-full"
          style={{
            ['--progress-bg' as any]: currentColors.backgroundColor,
          }}
        />
        <style jsx global>{`
          [data-slot="progress-indicator"] {
            background-color: ${currentColors.backgroundColor} !important;
          }
        `}</style>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-pc-title-sm font-semibold text-black">
            {remainingSeconds}
          </span>
        </div>
      </div>
    </div>
  );
});
