import { LogOut } from "lucide-react";
import useProblemStore from "@/stores/problemStore";
import useLeaveRoom from "@/hooks/useLeaveRoom";
import useRoomStore from "@/stores/roomStore";

const GameRoomHeader = () => {
  const roomTitle = useProblemStore((state) => state.title);
  const leave = useLeaveRoom();
  const gameState = useRoomStore((state) => state.gameState);

  const isPlaying = gameState === "PLAYING";

  return (
    <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-[1440px] mx-auto px-8 pt-3">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-pc-title-md font-ownglyph font-semibold text-gray">
            {roomTitle}
          </h1>
          {isPlaying ? <></> : (
            <button
              onClick={leave}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 group bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/30"
            >
              <LogOut
                size={20}
                className="text-gray group-hover:text-point-300 transition-colors"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameRoomHeader;
