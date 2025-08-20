import { Star, X } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { useEffect, useRef } from "react";
import { Alert, AlertTitle } from "../ui/alert";
import type { AnswerHistory } from "@/services/api/today/answerCheckApi";

interface AnswerListProps {
  answers: AnswerHistory[] | null;
}

// answers를 Props로 받기
const AnswerList = ({ answers }: AnswerListProps) => {
  const list = answers ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // chatLogs가 변경될 때마다 스크롤을 가장 아래로 이동
    if (scrollRef.current) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [list]);

  const messageStyle = (msg: AnswerHistory) => {
    if (msg.score >= 80)
      return {
        icon: <Star className="stroke-yellow-500" strokeWidth={3} />,
        className: "bg-yellow-50 border-yellow-300",
      };
    else
      return {
        icon: <X className="stroke-orange-600" strokeWidth={3} />,
        className: "bg-orange-50 border-orange-300",
      };
  };

  return (
    <ScrollArea className="h-full w-full h-[280px] rounded-md scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 overflow-y-auto">
      <div className="flex flex-col gap-4 min-h-0">
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
              {/* 내용 영역 */}
              <div className="flex items-start gap-2">
                {messageStyle(keys).icon}
                <AlertTitle className="text-base leading-relaxed line-clamp-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  {keys.userAnswer}
                </AlertTitle>
              </div>
              {/* 점수 영역 */}
              <div className="self-end">
                <span className="text-sm text-gray-600 font-medium">
                  유사도 {keys.score}%
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

export default AnswerList;
