import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sendGameStart } from "@/websocket/sender";
import useRoomStore from "@/stores/roomStore";
import useProblemStore from "@/stores/problemStore";
import ChangeRoomSettingDialog from "@/components/dialogs/ChangeRoomSettingDialog";
import ChangeProblemDrawer from "@/components/drawers/ChangeProblemDrawer";
import { Info } from "lucide-react";
import HowToDialog from "@/components/dialogs/HowToDialog";
import { useState } from "react";
import GameStartInfoDialog from "@/components/dialogs/GameStartInfoDialog";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const HostButtonSet = () => {
  const roomId = useRoomStore((s) => s.roomId);
  const players = useRoomStore((s) => s.players);
  const maxPlayers = useRoomStore((s) => s.maxPlayers);
  const timeLimit = useRoomStore((s) => s.timeLimit);
  const selectedProblem = useProblemStore((s) => s);

  const [isHowToOpen, setIsHowToOpen] = useState(false);

  const isNotAlone = useRoomStore((s) => s.isNotAlone);
  const areAllPlayersReady = useRoomStore((s) => s.areAllPlayersReady);

  const [isAloneDialogOpen, setisAloneDialogOpen] = useState(false);
  const [allReadyDialogOpen, setAllReadyDialogOpen] = useState(false);

  // 이 함수에서는 게임 시작 Logic이 들어가며, 방 상태를 바꿉니다.
  const onGameStart = () => {
    // 게임 시작 시도 추적 (함수 맨 윗부분)
    const readyPlayersCount = players.filter(p => p.status === "READY").length;
    const totalPlayersCount = players.filter(p => p.name !== "").length;
    const allReady = areAllPlayersReady();

    track("game_start_attempted", {
      ready_players_count: readyPlayersCount,
      total_players_count: totalPlayersCount,
      problem_selected: !!selectedProblem,
      attempt_successful: allReady,
      problem_type: selectedProblem.problemType,
      time_limit_minutes: timeLimit,
      timestamp: getKoreanTimestamp(),
    });

    // 모든 참가자가 준비 상태인지 확인
    if (!allReady) {
      // 게임 시작 실패 추적
      track("game_start_failed", {
        failure_reason: "insufficient_ready_players",
        ready_players_count: readyPlayersCount,
        total_players_count: totalPlayersCount,
        problem_type: selectedProblem.problemType,
        time_limit_minutes: timeLimit,
        timestamp: getKoreanTimestamp(),
      });
      setAllReadyDialogOpen(true);
      return;
    }

    if (!isNotAlone()) {
      // 게임 시작 실패 추적
      track("game_start_failed", {
        failure_reason: "only_one_player",
        ready_players_count: readyPlayersCount,
        total_players_count: totalPlayersCount,
        problem_type: selectedProblem.problemType,
        time_limit_minutes: timeLimit,
        timestamp: getKoreanTimestamp(),
      });
      setisAloneDialogOpen(true);
      return;
    }

    // 게임 시작 성공 추적 - 실제 방 설정 사용
    track("game_started", {
      players_count: totalPlayersCount,
      problem_type: selectedProblem.problemType,
      time_limit_minutes: timeLimit,
      turn_order_method: "random", // 또는 실제 턴 순서 방식
      max_players: maxPlayers, // 최대 플레이어 수
      problem_id: selectedProblem?.problemId, // 문제 ID (있다면)
      problem_difficulty: selectedProblem?.difficulty, // 문제 난이도 (있다면)
      timestamp: getKoreanTimestamp(),
    });

    // API 요청 및 WS
    sendGameStart(roomId);
  };

  const handleHowToOpen = () => {
    // 가이드 버튼 클릭 추적
    track("host_guide_opened", {
      room_id: roomId,
      timestamp: getKoreanTimestamp(),
    });
    
    setIsHowToOpen(true);
  };

  return (
    <>
      <Card className="p-6 grid grid-rows-[auto_1fr_1fr_1fr] gap-6 relative h-full">
        {/* 도움말 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 p-2 hover:bg-point-200/20 rounded-lg flex items-center justify-start gap-2 font-ownglyph text-sm"
          onClick={handleHowToOpen}
        >
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-600 leading-none">출제자 가이드</span>
        </Button>

        {/* 방 설정 변경 */}
        <ChangeRoomSettingDialog />

        {/* 문제 변경 */}
        <ChangeProblemDrawer />

        {/* 게임 시작 버튼 */}
        <Button
          variant="outline"
          className="h-full text-lg cursor-pointer font-ownglyph text-pc-title-sm font-bold hover:bg-point-200/50"
          onClick={onGameStart}
        >
          게임 시작
        </Button>

        {/* 방장용 게임방법 Dialog */}
        <HowToDialog
          isOpen={isHowToOpen}
          onOpenChange={setIsHowToOpen}
          type="host"
        />
      </Card>

      {/* 게임 시작 안내 - 모든 준비 완료 */}
      <GameStartInfoDialog
        isOpen={allReadyDialogOpen}
        onOpenChange={setAllReadyDialogOpen}
        title="게임 시작 안내"
        message="준비되지 않은 참가자가 있어 게임을 시작할 수 없습니다."
      />

      {/* 게임 시작 안내 - 방 인원 2명 이상 */}
      <GameStartInfoDialog
        isOpen={isAloneDialogOpen}
        onOpenChange={setisAloneDialogOpen}
        title="게임 시작 안내"
        message="방 인원이 최소 2명 이상이어야 합니다."
      />
    </>
  );
};

export default HostButtonSet;