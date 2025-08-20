import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { Badge } from "../ui/badge";

import PersonSelect from "../selects/PersonSelect";
import TimeSelect from "../selects/TimeSelect";

// import type { SelectedProblem } from "@/types/problem/problem";
// import useProblemStore from "@/stores/problemStore";
import useRoomStore from "@/stores/roomStore";
import { sendChangeSettings } from "@/websocket/sender";

const ChangeRoomSettingDialog = () => {
  // roomStore 정보 스냅샷
  const roomId = useRoomStore((s) => s.roomId);
  const storeMaxPlayers = useRoomStore((s) => s.maxPlayers);
  const storeTimeLimit = useRoomStore((s) => s.timeLimit);

  // problemStore 정보 스냅샷 (읽기 전용)
  // const currentProblemId = useProblemStore((s) => s.problemId);
  // const currentTitle = useProblemStore((s) => s.title);
  // const currentContent = useProblemStore((s) => s.content);
  // const currentAnswer = useProblemStore((s) => s.answer);
  // const currentDifficulty = useProblemStore((s) => s.difficulty);
  // const currentGenres = useProblemStore((s) => s.genres);
  // const currentCreatedBy = useProblemStore((s) => s.createdBy);
  // const currentProblemType = useProblemStore((s) => s.problemType);

  // 현재 문제 정보 (Store에서 가져오기)
  // const currentProblem = useMemo<SelectedProblem | null>(() => {
  //   if (!currentProblemId) return null;
  //   return {
  //     problemId: currentProblemId,
  //     title: currentTitle,
  //     content: currentContent,
  //     answer: currentAnswer,
  //     difficulty: currentDifficulty,
  //     genres: currentGenres,
  //     createdBy: currentCreatedBy,
  //     problemType: currentProblemType,
  //   };
  // }, [
  //   currentProblemId,
  //   currentTitle,
  //   currentContent,
  //   currentAnswer,
  //   currentDifficulty,
  //   currentGenres,
  //   currentCreatedBy,
  //   currentProblemType,
  // ]);

  // 로컬 임시 상태
  const [maxPlayers, setMaxPlayers] = useState<string>(
    storeMaxPlayers.toString()
  );
  const [timeLimit, setTimeLimit] = useState<string>(storeTimeLimit.toString());
  const [isOpen, setIsOpen] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

  // 버튼 활성화 Boolean
  const isSettingsChanged =
    Number(timeLimit) !== storeTimeLimit ||
    Number(maxPlayers) !== storeMaxPlayers;

  // 난이도 분류
  // const difficultyConfig = {
  //   EASY: { icon: "🌱", label: "쉬움" },
  //   NORMAL: { icon: "⚡", label: "보통" },
  //   HARD: { icon: "🔥", label: "어려움" },
  // };

  // store 값이 변경되면 로컬 상태 동기화
  useEffect(() => {
    setMaxPlayers(storeMaxPlayers.toString());
    setTimeLimit(storeTimeLimit.toString());
  }, [storeMaxPlayers, storeTimeLimit]);

  // 인원수 검증
  useEffect(() => {
    const newMaxPlayers = Number(maxPlayers);
    if (Number.isFinite(newMaxPlayers) && newMaxPlayers < storeMaxPlayers) {
      setValidationError(
        `최대 인원수는 파일 생성 시 선택한 인원수(${storeMaxPlayers}명) 이상이어야 합니다.`
      );
    } else {
      setValidationError("");
    }
  }, [maxPlayers, storeMaxPlayers]);

  const isUpdateButtonEnabled = !validationError;

  // 다이얼로그 닫기 및 상태 초기화
  const handleCloseDialog = () => {
    setIsOpen(false);
    setMaxPlayers(storeMaxPlayers.toString());
    setTimeLimit(storeTimeLimit.toString());
    setValidationError("");
  };

  // 설정 완료 (인원수 오류 검증)
  const handleUpdateRoom = () => {
    if (validationError) {
      alert(validationError);
      return;
    }

    if (isSettingsChanged) {
      const nextMax = Number(maxPlayers);
      const nextTime = Number(timeLimit);
      sendChangeSettings(
        roomId,
        Number.isFinite(nextMax) ? nextMax : storeMaxPlayers,
        Number.isFinite(nextTime) ? nextTime : storeTimeLimit
      );
    }
    // joinAsHost(selectedProblem);
    handleCloseDialog();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-full text-lg cursor-pointer font-ownglyph hover:bg-point-200/50"
        >
          <div className="text-center">
            <div className="font-ownglyph font-bold text-pc-title-sm">
              방 설정 변경
            </div>
            <div className="text-xs text-gray-500 mt-1">
              인원: {storeMaxPlayers}명 | 시간: {storeTimeLimit}분
            </div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>파일 설정 변경</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <PersonSelect
              value={maxPlayers.toString()}
              onValueChange={setMaxPlayers}
            />
            <TimeSelect
              value={timeLimit.toString()}
              onValueChange={setTimeLimit}
            />
          </div>
        </div>

        {/* 인원수 오류 발생 시 표시 */}
        {validationError && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
            {validationError}
          </div>
        )}

        {/* 현재 방에 설정된 문제 정보 (읽기 전용) */}
        {/* <div className="bg-muted rounded-md p-4 text-sm">
          <div className="mb-2 text-xs text-gray-500 font-medium">
            현재 선택된 사건
          </div>
          {currentProblem ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-base">
                {currentProblem.title}
              </h4>

              <p className="text-xs text-gray-600 line-clamp-2">
                {currentProblem.content}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {difficultyConfig[currentProblem.difficulty].icon}{" "}
                    {difficultyConfig[currentProblem.difficulty].label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentProblem.problemType === "ORIGINAL"
                      ? "기존 사건"
                      : "새로운 사건"}
                  </Badge>
                </div>

                {currentProblem.likes && (
                  <div className="text-xs text-gray-500">
                    👍 {currentProblem.likes}
                  </div>
                )}
              </div>

              <div className="flex gap-1 flex-wrap">
                {currentProblem.genres.map((genre, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs px-1 py-0"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <p>선택된 사건이 없습니다.</p>
            </div>
          )}
        </div> */}

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="ghost"
            onClick={handleCloseDialog}
            className="hover:bg-point-200/50"
          >
            취소
          </Button>
          <Button
            variant="outline"
            onClick={handleUpdateRoom}
            disabled={!isUpdateButtonEnabled}
            className={
              !isUpdateButtonEnabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-point-200/50"
            }
          >
            설정 완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeRoomSettingDialog;
