import useUserStore from "@/stores/userStore";
import type { ChatLog } from "@/types/chat";
import { Card, CardContent } from "../ui/card";
import {
  MessageCircleQuestionMark,
  CircleCheck,
  CircleX,
  CircleMinus,
  MessageCircleWarning,
  Star,
  X,
  MessageCircle,
} from "lucide-react";

interface ChatItemProps {
  log: ChatLog;
}

// 게임 메시지에 따른 스타일 결정 (HistoryItem과 동일한 로직)
const getGameMessageStyle = (log: ChatLog) => {
  if (!log.type || !log.status) return null;
  
  const isQuestion = log.type === "QUESTION";

  switch (log.status) {
    case "CORRECT":
      return {
        icon: isQuestion ? (
          <CircleCheck className="stroke-green-600 w-4 h-4" />
        ) : (
          <Star className="stroke-yellow-500 w-4 h-4" strokeWidth={3} />
        ),
        bgColor: isQuestion ? "bg-green-50" : "bg-yellow-50",
        borderColor: isQuestion ? "border-green-300" : "border-yellow-300",
        badge: isQuestion ? "예" : "정답",
        badgeColor: isQuestion ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800",
      };

    case "INCORRECT":
      return {
        icon: isQuestion ? (
          <CircleX className="stroke-red-400 w-4 h-4" />
        ) : (
          <X className="stroke-orange-600 w-4 h-4" strokeWidth={3} />
        ),
        bgColor: isQuestion ? "bg-red-50" : "bg-orange-50",
        borderColor: isQuestion ? "border-red-300" : "border-orange-300",
        badge: isQuestion ? "아니오" : "오답",
        badgeColor: isQuestion ? "bg-red-50 text-red-500" : "bg-orange-100 text-orange-800",
      };

    case "IRRELEVANT":
      return {
        icon: <CircleMinus className="stroke-gray-500 w-4 h-4" />,
        bgColor: "bg-gray-50",
        borderColor: "border-gray-300",
        badge: "상관없음",
        badgeColor: "bg-gray-100 text-gray-800",
      };

    case "PENDING":
      return {
        icon: isQuestion ? (
          <MessageCircleQuestionMark className="stroke-blue-500 w-4 h-4" />
        ) : (
          <MessageCircleWarning className="stroke-orange-500 w-4 h-4" />
        ),
        bgColor: isQuestion ? "bg-blue-50" : "bg-orange-50",
        borderColor: isQuestion ? "border-blue-300" : "border-orange-300",
        badge: "대기중",
        badgeColor: isQuestion ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800",
      };

    default:
      return {
        icon: <MessageCircle className="stroke-gray-400 w-4 h-4" />,
        bgColor: "bg-slate-50",
        borderColor: "border-slate-300",
        badge: log.type === "QUESTION" ? "질문" : "답변",
        badgeColor: "bg-slate-100 text-slate-800",
      };
  }
};

const ChatItem = ({ log }: ChatItemProps) => {
  const myName = useUserStore((state) => state.userName);

  // --- 메시지 유형 판별 ---
  const isSystem = log.user === "system";
  const isMine = log.user === myName;
  const gameStyle = getGameMessageStyle(log);

  // --- 시간 포맷(KST) ---
  const ts = log.timestamp.replace(/(\.\d{3})\d+/, "$1");
  const timeStr = new Date(ts).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });

  // 공통 스타일
  const bubbleTextClass =
    "whitespace-pre-wrap break-words min-w-0 " +
    "[overflow-wrap:anywhere] [word-break:break-word]";

  if (isSystem) {
    return (
      <div className="w-full flex justify-center my-1 min-w-0">
        <span className="text-xs text-gray-500 font-medium">
          {log.content}
        </span>
      </div>
    );
  }

  if (isMine) {
    return (
      <div className="w-full flex flex-col items-end gap-0.5 my-1 min-w-0">
        <div className="flex items-end justify-end gap-1 max-w-[75%] min-w-0">
          <span className="text-[10px] leading-none text-muted-foreground select-none pb-1">
            {timeStr}
          </span>
          <div className="flex flex-col items-end gap-1">
            {gameStyle && (
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-1 rounded-full ${gameStyle.badgeColor}`}>
                  {gameStyle.badge}
                </span>
                {gameStyle.icon}
              </div>
            )}
            <Card className={`py-2 px-3 rounded-2xl ml-auto min-w-0 shrink max-w-full ${gameStyle ? `${gameStyle.bgColor} ${gameStyle.borderColor} border-2` : ''}`}>
              <CardContent className={`p-0 ${bubbleTextClass} max-w-full`}>
                {log.content}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-start gap-0.5 my-1 min-w-0">
      <span className="text-[10px] leading-none">{log.user}</span>
      <div className="flex items-end justify-start gap-1 max-w-[75%] min-w-0">
        <div className="flex flex-col items-start gap-1">
          {gameStyle && (
            <div className="flex items-center gap-1">
              {gameStyle.icon}
              <span className={`text-xs px-2 py-1 rounded-full ${gameStyle.badgeColor}`}>
                {gameStyle.badge}
              </span>
            </div>
          )}
          <Card className={`px-3 py-2 rounded-2xl mr-auto min-w-0 shrink max-w-full ${gameStyle ? `${gameStyle.bgColor} ${gameStyle.borderColor} border-2` : ''}`}>
            <CardContent className={`p-0 ${bubbleTextClass} max-w-full`}>
              {log.content}
            </CardContent>
          </Card>
        </div>
        <span className="text-[10px] leading-none text-muted-foreground select-none pb-1">
          {timeStr}
        </span>
      </div>
    </div>
  );
};

export default ChatItem;
