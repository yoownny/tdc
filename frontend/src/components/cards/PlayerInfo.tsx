import { Card } from "@/components/ui/card";
import type { User } from "@/types/user";
import { Crown, User as UserIcon, CircleCheckBig } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { sendTransferHost } from "@/websocket/sender";
import useRoomStore from "@/stores/roomStore";
import useUserStore from "@/stores/userStore";
import barrierIcon from "@/assets/barrier.png";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

interface PlayerInfoProps {
  user: User;
}

const PlayerInfo = ({ user }: PlayerInfoProps) => {
  const roomId = useRoomStore((s) => s.roomId);
  const targetUserId = user.id

  const myUserId = useUserStore((s) => s.userId);
  const participants = useRoomStore((s) => s.players);
  const me = participants.find((p) => p.id === myUserId);

  // Host 판정 및 버튼 활성화 여부 조건 설정
  const isMeHost = !!me?.isHost;
  const disabled = !isMeHost || user.id === myUserId || user.isHost;

  // 방장 넘기기 Logic 작성
  const onTransferRequest = async () => {
    if (disabled) return;

    // 🎯 방장 권한 위임 추적
    track("game_host_transferred", {
      transfer_reason: "manual",
      new_host_ready_status: user.status === "READY",
      target_user_id: targetUserId,
      room_id: roomId,
      timestamp: getKoreanTimestamp(),
    });

    sendTransferHost(roomId, targetUserId);
  };

  // Player의 현 상태에 따른 Icon 표시
  const playerStatusIcon = (user: User) => {
    if (user.name !== "") {
      if (user.isHost) {
        return <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" />;
      } else if (user.status === "READY") {
        return <CircleCheckBig className="w-5 h-5 text-green-500" />;
      }
    }
    return null;
  };

  if (user.name === "") {
    // 빈 자리 표시 - isActive 속성에 따라 스타일 구분
    const isActive = user.isActive ?? true; // 기본값은 true로 설정
    return (
      <Card
        className={`p-3 min-h-[60px] flex rounded-xl transition-all duration-300 ${
          isActive
            ? "flex-row justify-center items-center bg-white/5 border border-white/10" // 활성화된 빈 자리
            : "justify-center items-center bg-gray-400/30 border border-gray-600/30" // 비활성화된 빈 자리
        }`}
      >
        {isActive ? (
          <>
            <UserIcon className="w-5 h-5 mr-2 text-white/30" />
            <span className="text-pc-body-sm font-medium text-white/40">
              빈 자리
            </span>
          </>
        ) : (
          <img src={barrierIcon} alt="사용 불가" className="w-5 h-5" />
        )}
      </Card>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card
          className={`p-3 min-h-[60px] flex flex-row justify-between items-center transition-all duration-300 cursor-pointer group ${
            user.isHost
              ? "bg-point-500/10 border border-point-400/30"
              : "border border-white/10"
          }`}
        >
          {/* 플레이어 이름 */}
          <span
            className={`text-pc-body-sm font-semibold truncate max-w-[120px] text-point-500`}
          >
            {user.name}
          </span>

          {/* 상태 아이콘 */}
          <div className="flex items-center gap-2">
            {playerStatusIcon(user)}
          </div>
        </Card>
      </ContextMenuTrigger>

      <ContextMenuContent className="bg-gray-900/95 border border-white/20">
        <ContextMenuItem
          disabled={disabled}
          onClick={onTransferRequest}
          className="text-gray-100 hover:text-white hover:bg-white/10 disabled:text-gray-500 disabled:hover:bg-transparent"
        >
          방장 넘기기
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default PlayerInfo;
