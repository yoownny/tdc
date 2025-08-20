import { Alert, AlertTitle } from "@/components/ui/alert";
import { AnswerStatus, type Interaction } from "@/types/game/game";
import {
  MessageCircleQuestionMark,
  CircleCheck,
  CircleX,
  CircleMinus,
  MessageCircleWarning,
  Star,
  X,
} from "lucide-react";

interface HistoryItemProps {
  History: Interaction;
}

// 질문에 따른 스타일이 별도로 적용됩니다. 각 질문의 타입(질문, 답변),
// 응답 종류(예, 아니오, 응답 없음, 상관 없음, 대기 중)에 따라 결정됩니다.
const messageStyle = (msg: Interaction) => {
  const isQuestion = msg.type === "QUESTION";

  switch (msg.status) {
    case AnswerStatus.CORRECT:
      return {
        icon: isQuestion ? (
          <CircleCheck className="stroke-green-600" />
        ) : (
          <Star className="stroke-yellow-500" strokeWidth={3} />
        ),
        className: isQuestion
          ? "bg-green-50 border-green-300"
          : "bg-yellow-50 border-yellow-300",
      };

    case AnswerStatus.INCORRECT:
      return {
        icon: isQuestion ? (
          <CircleX className="stroke-red-400" />
        ) : (
          <X className="stroke-orange-600" strokeWidth={3} />
        ),
        className: isQuestion
          ? "bg-red-50 border-red-300"
          : "bg-orange-50 border-orange-300",
        extraText: isQuestion ? null : "오답!",
      };

    case AnswerStatus.IRRELEVANT:
      return {
        icon: <CircleMinus className="stroke-gray-500" />,
        className: "bg-gray-50 border-gray-300",
      };

    case AnswerStatus.PENDING:
      return {
        icon: isQuestion ? (
          <MessageCircleQuestionMark className="stroke-blue-500" />
        ) : (
          <MessageCircleWarning className="stroke-orange-500" />
        ),
        className: isQuestion
          ? "bg-blue-50 border-blue-300"
          : "bg-orange-50 border-orange-300",
      };

    default:
      return {
        icon: <MessageCircleQuestionMark className="stroke-gray-400" />,
        className: "bg-slate-50 border-slate-300",
      };
  }
};

const HistoryItem = ({ History }: HistoryItemProps) => {
  const { icon, className, extraText } = messageStyle(History);
  const isAnswer = History.type !== "QUESTION";

  return (
    <Alert className={`p-4 ${className}`}>
      {icon}
      {isAnswer && extraText ? (
        // 정답 제출일 때: 아이콘과 extraText를 첫 줄에, 내용을 두 번째 줄에
        <>
          <div className="flex items-center gap-2">
            {extraText && (
              <span className="text-orange-600 text-sm font-medium whitespace-nowrap">
                {extraText}
              </span>
            )}
          </div>
          <AlertTitle className="text-base leading-relaxed line-clamp-none whitespace-pre-wrap break-words min-w-0 [overflow-wrap:anywhere] [word-break:break-word] col-start-2">
            {History.content}
          </AlertTitle>
        </>
      ) : (
        // 일반 질문일 때: 기존처럼 아이콘과 내용이 같은 줄에
        <AlertTitle className="text-base leading-relaxed line-clamp-none whitespace-pre-wrap break-words min-w-0 [overflow-wrap:anywhere] [word-break:break-word]">
          {History.content}
        </AlertTitle>
      )}
    </Alert>
  );
};

export default HistoryItem;
