import { Card } from "@/components/ui/card";
import PlayerInfo from "../cards/PlayerInfo";
import type { User } from "@/types/user";
import useRoomStore from "@/stores/roomStore";
import { Users } from "lucide-react";

const PlayerListPanel = () => {
  const players = useRoomStore((state) => state.players);
  const maxPlayers = useRoomStore((state) => state.maxPlayers);

  // 방장을 항상 첫 번째로, 나머지 참가자들을 그 뒤에 배치
  const sortedPlayers = [
    ...players.filter((player) => player.isHost),
    ...players.filter((player) => !player.isHost),
  ];

  const paddedList: User[] = [
    ...sortedPlayers,
    ...Array(6 - players.length)
      .fill(null)
      .map((_, index) => ({
        id: -index - 1, // 음수로 임시 고유 id
        name: "",
        isHost: false,
        status: "READY" as const,
        isActive: players.length + index < maxPlayers, // 방 설정에 따라 활성화 여부 결정
      })),
  ];

  return (
    <Card className="bg-white/5 rounded-xl border border-white/10 p-6 h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-center gap-3">
        <div className="p-2 bg-white/10 rounded-full">
          <Users className="w-5 h-5 text-point-500" />
        </div>
        <h3 className="text-pc-title-sm font-semibold text-point-500 font-ownglyph">
          참가자 목록
        </h3>
        <div className="p-2 bg-white/10 rounded-full">
          <Users className="w-5 h-5 text-gray-100" />
        </div>
      </div>

      {/* 참가자 수 표시 - 컴팩트하게 */}
      <div className="text-center">
        <span className="text-xs text-gray font-medium bg-white/5 px-3 py-1 rounded-full border border-white/10">
          {players.length} / {maxPlayers}
        </span>
      </div>

      {/* 참가자 그리드 */}
      <div className="flex-1 grid grid-flow-row-dense grid-cols-2 auto-rows-auto gap-3">
        {paddedList.map((user) => (
          <PlayerInfo key={user.id} user={user} />
        ))}
      </div>
    </Card>
  );
};

export default PlayerListPanel;
