import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Crown } from "lucide-react";
import type { RoomSummary } from "@/types/room/roomSummary";
import policeline from "@/assets/policeline.png";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

interface RoomCardProps {
  room: RoomSummary;
  onClick: (roomId: number) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  const current_players_count = room.currentPlayers;
  const max_players = room.maxPlayers;

  // [대기중] 상태이면서, 최대 인원 미달인 방만 클릭하도록 제어
  const isJoinable = room.gameState === "WAITING" && current_players_count < max_players;

  const handleClick = () => {
    onClick(room.roomId);
  };

  // 난이도 구분
  const difficultyConfig = {
    EASY: {
      icon: "🌱",
      color: "bg-green-100 text-green-800",
      label: "🌱 쉬움",
      tabColor: "bg-green-400",
    },
    NORMAL: {
      icon: "⚡",
      color: "bg-yellow-100 text-yellow-800",
      label: "⚡ 보통",
      tabColor: "bg-yellow-400",
    },
    HARD: {
      icon: "🔥",
      color: "bg-orange-100 text-orange-800",
      label: "🔥 어려움",
      tabColor: "bg-red-400",
    },
  };

  const isWaiting = room.gameState === "WAITING";

  return (
    <div className="relative group">
      {/* 상태 라벨 */}
      {/* <div className="absolute -top-2 -right-2 z-10">
        <div
          className={`${
            gameStateConfig[room.gameState].color
          } text-xs px-3 py-1 rounded-full font-semibold shadow-lg ${
            isWaiting ? "animate-pulse" : ""
          }`}
        >
          {gameStateConfig[room.gameState].label}
        </div>
      </div> */}

      {/* 폴더 탭 효과 - 난이도에 따른 색상 */}
      <div
        className={`${
          difficultyConfig[room.difficulty].tabColor
        } h-6 w-20 rounded-t-lg relative mb-0 transition-all duration-300 hover:scale-100 group-hover:scale-105 group-hover:rotate-1 group-hover:-translate-y-1 transform pointer-events-none`}
      >
        <div className="absolute inset-0 bg-white/20 rounded-t-lg"></div>
      </div>

      <Card
        className={`w-full h-60 max-w-sm shadow-lg transition-all duration-300 -mt-0 rounded-tl-none border-2 border-border flex flex-col pb-60 relative overflow-hidden ${
          isJoinable
            ? "cursor-pointer hover:shadow-xl transform hover:scale-105 hover:rotate-1 bg-white"
            : "cursor-not-allowed bg-gray-200"
        }`}
        onClick={handleClick}
      >
        {/* 폴리스 라인들 - 수사 중일 때만 표시 */}
        {!isWaiting && (
          <div className="absolute inset-0 z-20">
            {/* 왼쪽 대각선 위 폴리스 라인 */}
            <img
              src={policeline}
              alt="police line"
              className="absolute top-1 -left-20 w-54 h-12 object-cover transform -rotate-45 opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-300 filter brightness-110 group-hover:brightness-125"
            />

            {/* 오른쪽 대각선 아래 폴리스 라인 */}
            <img
              src={policeline}
              alt="police line"
              className="absolute -bottom-2 -right-15 w-54 h-12 object-cover transform -rotate-60 opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-300 filter brightness-110 group-hover:brightness-125"
            />
          </div>
        )}
        <CardHeader className="pb-3 flex-shrink-0">
          <CardDescription className="text-xs text-muted-foreground mb-2">
            사건번호 #{room.roomId}
          </CardDescription>

          {/* 제목과 장르 */}
          <div className="flex justify-between items-start gap-2 mb-3 h-12 overflow-hidden">
            <div
              className="text-xl font-bold font-ownglyph flex-1 overflow-hidden"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {room.title}
            </div>
            {room.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                {room.genres.slice(0, 2).map((genre, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
                {room.genres.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{room.genres.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>
                {room.currentPlayers}/{room.maxPlayers}명
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{room.timeLimit}분</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {room.problemType === "ORIGINAL" ? "기존 사건" : "새로운 사건"}
            </Badge>
            <Badge
              variant="secondary"
              className={difficultyConfig[room.difficulty].color}
            >
              {difficultyConfig[room.difficulty].label}
            </Badge>
          </div>

          {/* 방장 닉네임 */}
          <div className="flex items-center gap-1">
            <Crown className="w-3 h-3 text-yellow-600" />
            <CardDescription className="text-xs text-muted-foreground font-medium">
              {room.host.nickname}
            </CardDescription>
          </div>
        </CardHeader>

        <CardFooter className="mt-auto pt-2 pb-2 ">
          <Button
            className={`w-full h-10 ${
              isJoinable
                ? "bg-secondary hover:bg-border text-gray-800"
                : "bg-gray-500 text-white cursor-not-allowed"
            }`}
            disabled={!isJoinable}
            onClick={(e) => {
              e.stopPropagation();
              if (isJoinable) {
                // 수사하기 버튼 클릭 추적
                track("join_room_button_clicked", {
                  room_id: room.roomId,
                  room_status: room.gameState.toLowerCase(),
                  current_players_count: room.currentPlayers,
                  max_players: room.maxPlayers,
                  host_id: room.host.id,
                  timestamp: getKoreanTimestamp(),
                });

                handleClick();
              }
            }}
          >
            {isWaiting 
              ? (current_players_count < max_players ? "수사하기" : "입장 마감")
              : "수사 중"
            }
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RoomCard;
