import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useRoomStore from "@/stores/roomStore";
import useUserStore from "@/stores/userStore";
import { sendReady } from "@/websocket/sender";
import { useState } from "react";
import { Info } from "lucide-react";
import HowToDialog from "../dialogs/HowToDialog";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const PlayerButtonSet = () => {
  const players = useRoomStore((state) => state.players);
  const myUserId = useUserStore((state) => state.userId);
  const roomId = useRoomStore((state) => state.roomId);

  const isReady =
    players.find((player) => player.id === myUserId)?.status === "READY";

  const [isHowToOpen, setIsHowToOpen] = useState(false);

  const onToggleReady = () => {
    // 🎯 준비 상태 변경 추적 (함수 맨 윗부분)
    const readyPlayersCount = players.filter(p => p.status === "READY").length;
    const totalPlayersCount = players.filter(p => p.name !== "").length;

    track("game_player_ready_toggled", {
      is_ready: !isReady, // 토글 후 상태
      ready_players_count: !isReady ? readyPlayersCount + 1 : readyPlayersCount - 1,
      total_players_count: totalPlayersCount,
      timestamp: getKoreanTimestamp(),
    });

    console.log("sended");
    sendReady(roomId, !isReady);
  };

  const handleHowToOpen = () => {
    // 가이드 버튼 클릭 추적
    track("player_guide_opened", {
      room_id: roomId,
      timestamp: getKoreanTimestamp(),
    });
    
    setIsHowToOpen(true);
  };

  return (
    <Card className="p-6 grid grid-rows-[auto_1fr_1fr] gap-6 h-full">
      {/* 도움말 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-8 p-2 hover:bg-gray-100 rounded-lg flex items-center justify-start gap-2"
        onClick={handleHowToOpen}
      >
        <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="text-sm text-gray-600 leading-none">참가자 가이드</span>
      </Button>

      {/* 안내 텍스트 */}
      <span className="text-[20px] text-center self-center font-ownglyph">
        모든 플레이어가 준비해야
        <br /> 게임을 시작할 수 있습니다.
      </span>

      {/* 준비 버튼 */}
      <Button
        variant="outline"
        className="h-full text-pc-title-md hover:bg-point-200/50 hover:border-point-200/50 transition-colors duration-200 font-ownglyph font-bold "
        onClick={onToggleReady}
      >
        {isReady ? "준비 취소" : "게임 준비"}
      </Button>

      {/* 참가자용 게임방법 Dialog */}
      <HowToDialog
        isOpen={isHowToOpen}
        onOpenChange={setIsHowToOpen}
        type="player"
      />
    </Card>
  );
};

export default PlayerButtonSet;
