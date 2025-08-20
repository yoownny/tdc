import { ScrollArea } from "../ui/scroll-area";
import HistoryItem from "./HistoryItem";
import useGameStore from "@/stores/gameStore";
import { useEffect, useRef } from "react";

const HistoryList = () => {
  const history = useGameStore((state) => state.gameHistory);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 히스토리가 새로 추가될 때마다 아래로 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  return (
    <ScrollArea className="h-full w-full h-[280px] rounded-md scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 overflow-y-auto">
      <div className="flex flex-col gap-4 min-h-0">
        {history.map((question) => (
          <HistoryItem key={question.id} History={question} />
        ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
};

export default HistoryList;
