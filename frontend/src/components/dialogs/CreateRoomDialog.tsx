import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import PersonSelect from "../selects/PersonSelect";
import TimeSelect from "../selects/TimeSelect";
import ProblemDrawer from "../drawers/ProblemDrawer";
// import ProblemDialog from "./ProblemDialog";
import type { SelectedProblem } from "@/types/problem/problem";
import type { CreateRoomRequest } from "@/types/room/roomRequest";
import { sendCreateRoom } from "@/websocket/sender";
import { useNavigate } from "react-router-dom";
import useRoomStore from "@/stores/roomStore";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const CreateRoomDialog = () => {
  const [selectedProblem, setSelectedProblem] =
    useState<SelectedProblem | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<string>("");
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const roomId = useRoomStore((state) => state.roomId);
  const [creating, setCreating] = useState(false); // 중복 클릭 방지용

  // ProblemDrawer에서 선택된 사건 정보를 받는 핸들러
  const handleProblemSelect = (problem: SelectedProblem) => {
    setSelectedProblem(problem);
    console.log("선택된 사건:", problem);
  };

  // 방 생성 핸들러
  const handleCreateRoom = () => {
    // 🎯 방 생성 시도 추적
    track("room_create_attempted", {
      max_players: parseInt(maxPlayers),
      time_limit_minutes: parseInt(timeLimit),
      problem_type: selectedProblem?.problemType === "ORIGINAL" ? "existing" : "custom",
      problem_id: selectedProblem?.problemId,
      timestamp: getKoreanTimestamp(),
    });

    if (!selectedProblem || !maxPlayers || !timeLimit) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    const roomData: CreateRoomRequest = {
      title: selectedProblem.title,
      maxPlayers: parseInt(maxPlayers),
      timeLimit: parseInt(timeLimit),
      problemInfo: selectedProblem,
    };

    try {
      console.log("방 생성 데이터:", roomData);
      // 🎯 방 생성 성공 추적
      track("room_created", {
        max_players: parseInt(maxPlayers),
        time_limit_minutes: parseInt(timeLimit),
        problem_type: selectedProblem.problemType === "ORIGINAL" ? "existing" : "custom",
        room_title_length: selectedProblem.title.length,
        creation_duration_seconds: 0, // 필요시 측정
        timestamp: getKoreanTimestamp(),
      });

      setCreating(true);
      sendCreateRoom(Number(maxPlayers), Number(timeLimit), {
        problemId: String(selectedProblem.problemId),
        problemType: selectedProblem.problemType,
      });

      handleCloseDialog();
    } catch (error) {
      track("room_create_failed", {
        failure_reason: "api_error",
        error_message: error.message,
        timestamp: getKoreanTimestamp(),
      });
      
      console.error("사건 파일 생성 실패:", error);
      alert("사건 파일 생성에 실패했습니다.");
    }
  };

  // 다이얼로그 닫기 및 상태 초기화
  const handleCloseDialog = () => {
    setIsOpen(false);
    setSelectedProblem(null);
    setMaxPlayers("");
    setTimeLimit("");
  };

  // 선택된 사건 초기화
  const handleClearProblem = () => {
    setSelectedProblem(null);
  };

  // 난이도 표기
  const difficultyConfig = {
    EASY: { icon: "🌱", label: "쉬움" },
    NORMAL: { icon: "⚡", label: "보통" },
    HARD: { icon: "🔥", label: "어려움" },
  };

  // 버튼 활성화 조건
  const isCreateButtonEnabled =
    selectedProblem && maxPlayers && timeLimit && !creating;

  useEffect(() => {
    if (!isOpen && roomId > 0) {
      navigate(`/room/${roomId}`, { replace: true });
      // 필요 시 다이얼로그 초기화
      setSelectedProblem(null);
      setMaxPlayers("");
      setTimeLimit("");
      setCreating(false);
    }
  }, [roomId, isOpen, navigate]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">사건 파일 만들기</Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-lg">
        <DialogHeader className="text-center">
          <DialogTitle>파일 정보 입력</DialogTitle>
        </DialogHeader>

        {/* 인원, 제한시간 설정 */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <PersonSelect value={maxPlayers} onValueChange={setMaxPlayers} />
            <TimeSelect value={timeLimit} onValueChange={setTimeLimit} />
          </div>
        </div>

        <div className="bg-muted rounded-md p-4 text-sm">
          {selectedProblem ? (
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-base">
                  {selectedProblem.title}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearProblem}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  ✕
                </Button>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2">
                {selectedProblem.content}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {difficultyConfig[selectedProblem.difficulty].icon}{" "}
                    {difficultyConfig[selectedProblem.difficulty].label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedProblem.problemType === "ORIGINAL"
                      ? "기존 사건"
                      : "새로운 사건"}
                  </Badge>
                </div>

                {selectedProblem.likes && (
                  <div className="text-xs text-gray-500">
                    👍 {selectedProblem.likes}
                  </div>
                )}
              </div>

              <div className="flex gap-1 flex-wrap">
                {selectedProblem.genres.map((genre, index) => (
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
              <p>선택된 사건 정보가 여기에 표시됩니다.</p>
            </div>
          )}
        </div>

        {/* 사건 고르기 버튼 */}
        <ProblemDrawer onProblemSelect={handleProblemSelect} />

        {/* 취소, 방 생성 - 조건에 안 맞으면 방을 만들 수 없음 */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="ghost"
            onClick={handleCloseDialog}
            className="hover:bg-point-200/50"
          >
            취소
          </Button>
          <Button
            variant="secondary"
            onClick={handleCreateRoom}
            disabled={!isCreateButtonEnabled}
            className={
              !isCreateButtonEnabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-point-200/50"
            }
          >
            사건 파일 생성
            {!isCreateButtonEnabled && (
              <span className="ml-1 text-xs">
                ({!selectedProblem ? "사건" : !maxPlayers ? "인원" : "시간"}{" "}
                선택 필요)
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
