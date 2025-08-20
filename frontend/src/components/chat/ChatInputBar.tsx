import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Send } from "lucide-react";
import useRoomStore from "@/stores/roomStore";
import { sendChat } from "@/websocket/sender";

const ChatInputBar = () => {
  const roomId = useRoomStore((state) => state.roomId);
  const [chatInput, setChatInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const onContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  };

  const onAddChat = () => {
    if (!chatInput.trim()) return;

    const chatContent = chatInput.trim();
    if (chatContent !== "") {
      setChatInput("");
      sendChat(roomId, chatContent);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      onAddChat();
    }
  };

  const onCompositionStart = () => setIsComposing(true);
  const onCompositionEnd = () => setIsComposing(false);

  return (
    <div className="flex flex-row gap-3 w-full p-3 border-t border-gray-200">
      <Input
        value={chatInput}
        onChange={onContentChange}
        onKeyDown={onKeyDown}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        placeholder="메시지를 입력하세요..."
        className="flex-1"
      />
      <Button
        variant="default"
        size="sm"
        className="cursor-pointer bg-[#226b1c] hover:bg-[#1d5717] text-white px-4 py-2 transition-colors duration-200 rounded-lg font-medium font-ownglyph"
        onClick={onAddChat}
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ChatInputBar;
