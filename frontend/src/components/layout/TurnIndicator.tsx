import type { User } from "@/types/user";
import { cn } from "@/lib/shadcn/utils";

interface TurnIndicatorProps {
  players: User[];
  currentPlayer: User;
}

export const TurnIndicator = ({
  players,
  currentPlayer,
}: TurnIndicatorProps) => {
  // 방장을 제외한 참가자들만 필터링
  const participants = players.filter((player) => !player.isHost);

  if (participants.length === 0) return null;

  // UI 순서는 턴 번호 순서로 고정 (사람이 나가도 순서 유지)
  const sortedParticipants = [...participants].sort((a, b) => {
    const aTurnNumber = a.turnNumber || 999;
    const bTurnNumber = b.turnNumber || 999;
    return aTurnNumber - bTurnNumber;
  });

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 max-w-full">
      {sortedParticipants.map((player, index) => (
        <div
          key={player.id}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200 flex-shrink-0",
            player.id === currentPlayer.id
              ? "bg-point-300/20 border-point-300 text-point-300"
              : "bg-gray-50 border-gray-200 text-gray-500"
          )}
        >
          <span className="text-xs font-medium">
            {player.turnNumber || index + 1}
          </span>
          <span className="text-sm font-medium max-w-[80px] truncate">
            {player.name}
          </span>
          {player.id === currentPlayer.id && (
            <div className="w-2 h-2 bg-point-300 rounded-full animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
};
