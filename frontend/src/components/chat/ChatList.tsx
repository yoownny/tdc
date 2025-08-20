import ChatItem from "./ChatItem";
import { ScrollArea } from "../ui/scroll-area";
import useRoomStore from "@/stores/roomStore";
import { useEffect, useRef } from "react";

const ChatList = () => {
  const chatLogs = useRoomStore((state) => state.chattings);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // chatLogs가 변경될 때마다 스크롤을 가장 아래로 이동
    if (scrollRef.current) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLogs]);
  
  return (
    <ScrollArea className="h-full w-full p-4 rounded-md scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
      <div className="flex flex-col gap-4">
        {chatLogs.map((log) => (
          <ChatItem key={log.id} log={log} />
        ))}
        <div ref={scrollRef} />
      </div >
    </ScrollArea>
  );
};

export default ChatList;
