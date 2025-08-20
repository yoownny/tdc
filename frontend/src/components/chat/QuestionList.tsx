import { CircleCheck, CircleMinus, CircleX } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { useEffect, useRef } from "react";
import { Alert, AlertTitle } from "../ui/alert";
import type { QuestionHistory } from "@/services/api/today/questionApi";

interface QuestionListProps {
  questions: QuestionHistory[] | null;
}

// questions를 Props로 받기
const QuestionList = ({ questions }: QuestionListProps) => {
  const list = questions ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // chatLogs가 변경될 때마다 스크롤을 가장 아래로 이동
    if (scrollRef.current) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [list]);

  const messageStyle = (msg: QuestionHistory) => {
    switch (msg.response) {
      case "예":
        return {
          icon: <CircleCheck className="stroke-green-600" />,
          className: "bg-green-50 border-green-300",
        };
      case "아니오":
        return {
          icon: <CircleX className="stroke-red-400" />,
          className: "bg-red-50 border-red-300",
        };
      case "상관없음":
        return {
          icon: <CircleMinus className="stroke-gray-500" />,
          className: "bg-gray-50 border-gray-300",
        };
    }
  };

  return (
    <ScrollArea className="h-full w-full h-[280px] rounded-md scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 overflow-y-auto">
      <div className="flex flex-col gap-4 min-h-0 mr-2">
        {list.length === 0 ? (
          <Alert className="p-4 bg-gray-50 border-gray-200">
            <AlertTitle className="text-sm text-gray-500">
              아직 등록된 질문이 없습니다.
            </AlertTitle>
          </Alert>
        ) : (
          list.map((keys, index) => (
            <Alert
              key={index}
              className={`p-4 flex flex-col gap-2 ${
                messageStyle(keys).className
              }`}
            >
              <div className="flex items-start gap-2">
                {messageStyle(keys).icon}
                <AlertTitle className="text-base leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  {keys.userQuestion}
                </AlertTitle>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium">
                  {keys.comment}
                </span>
              </div>
            </Alert>
          ))
        )}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
};

export default QuestionList;
