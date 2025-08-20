import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ChatList from "../chat/ChatList";
import ChatInputBar from "../chat/ChatInputBar";
import { TurnIndicator } from "./TurnIndicator";
import useGameStore from "@/stores/gameStore";

interface GameRoomChatSectionProps {
  isWaiting?: boolean;
}

const GameRoomChatSection = ({
  isWaiting = false,
}: GameRoomChatSectionProps) => {
  const { players, currentPlayer } = useGameStore();

  // 채팅 영역의 높이를 고정하여 전체 페이지 스크롤 방지
  return (
    <Card className="h-[700px] p-4 flex flex-col">
      {!isWaiting && (
        <CardHeader className="h-24 flex items-center justify-center flex-shrink-0 border-b border-gray-200 !pb-2">
          {players.length > 0 && currentPlayer ? (
            <TurnIndicator players={players} currentPlayer={currentPlayer} />
          ) : (
            <CardTitle className="text-lg font-medium text-gray-600">
              게임 진행 중
            </CardTitle>
          )}
        </CardHeader>
      )}
      <CardContent className="p-0 flex-1 overflow-y-auto">
        <ChatList />
      </CardContent>
      <CardFooter className="p-0 flex-shrink-0">
        <ChatInputBar />
      </CardFooter>
    </Card>
  );
};

export default GameRoomChatSection;
