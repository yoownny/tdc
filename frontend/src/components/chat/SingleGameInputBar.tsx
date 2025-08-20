import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Textarea } from "../ui/textarea";
import type { PlayAction } from "@/types/game/game";
import {
  question,
  type QuestionHistory,
} from "@/services/api/today/questionApi";
import {
  answerCheck,
  type AnswerHistory,
} from "@/services/api/today/answerCheckApi";

interface SingleGameInputBarProps {
  problemId: number; // 부모에서 problem 존재할 때만 렌더링
  onAddQuestion: (newItem: QuestionHistory) => void;
  onAddAnswer: (newItem: AnswerHistory) => void;
}

const SingleGameInputBar = ({
  problemId,
  onAddQuestion,
  onAddAnswer,
}: SingleGameInputBarProps) => {
  const [contentInput, setContentInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetInput = () => setContentInput("");

  // 질문 제출
  const handleQuestion = async () => {
    const content = contentInput.trim();
    if (!content || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const data = await question({ problemId, userQuestion: content });
      onAddQuestion(data);
      resetInput();
    } catch (e) {
      // TODO: toast/error 처리
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 답변 제출
  const handleAnswer = async () => {
    const content = contentInput.trim();
    if (!content || isSubmitting) return;

    try {
      console.log(content);
      setIsSubmitting(true);
      const data = await answerCheck({ problemId, userAnswer: content });
      onAddAnswer(data);
      resetInput();
    } catch (e) {
      // TODO: toast/error 처리
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 버튼 라벨 및 기능 정의
  const actions: PlayAction[] = [
    { buttonLabel: "질문하기", onClick: handleQuestion },
    { buttonLabel: "정답 제출", onClick: handleAnswer },
  ];

  // 버튼 스타일 정의
  const buttonStyles = [
    "bg-yellow-500/30 border-yellow-400/50 hover:bg-yellow-500/50 hover:border-yellow-400/70 text-black",
    "bg-green-500/30 border-green-400/50 hover:bg-green-500/50 hover:border-green-400/70 text-black",
  ];

  // 키 매핑 추가
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME 합성 중에는 Submit 금지
    if (e.nativeEvent.isComposing || isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Enter: 질문, Ctrl/Cmd+Enter: 정답 제출 (정책 예시)
      if (e.ctrlKey || e.metaKey) {
        void handleAnswer();
      } else {
        void handleQuestion();
      }
    }
  };

  const isDisabled = !contentInput.trim() || isSubmitting;

  return (
    <div className="flex flex-row gap-3 w-full p-3 border-t border-gray-200">
      <Textarea
        value={contentInput}
        onChange={(e) => setContentInput(e.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyDown={onKeyDown}
        placeholder="질문을 입력하세요..."
        className="flex-1 resize-none min-h-[100px]"
        disabled={isSubmitting}
      />

      <div className="flex flex-col gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            disabled={isDisabled}
            onClick={action.onClick}
            className={[
              "flex-1 h-12 text-xl text-gray font-ownglyph font-semibold transition-all duration-200 border backdrop-blur-sm",
              buttonStyles[index],
              isDisabled ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {action.buttonLabel}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SingleGameInputBar;
