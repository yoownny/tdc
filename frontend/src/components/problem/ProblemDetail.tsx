import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Problem } from "@/types/problem/problem";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const difficultyConfig = {
  easy: { icon: "🌱", label: "쉬움" },
  normal: { icon: "⚡", label: "보통" },
  hard: { icon: "🔥", label: "어려움" },
};

interface ProblemDetailProps {
  problem: Problem | null;
  onConfirm: () => void;
}

const ProblemDetail = ({ problem, onConfirm }: ProblemDetailProps) => {
  const [showAnswer, setShowAnswer] = useState(false);

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 w-1/2">
        <div className="text-center">
          <div className="text-xl mb-4">사건을 선택하세요</div>
        </div>
      </div>
    );
  }

  const difficultyKey =
    problem.difficulty.toLowerCase() as keyof typeof difficultyConfig;

  return (
    <div className="w-1/2 overflow-y-auto space-y-4 my-3">
      <h2 className="text-3xl font-bold font-ownglyph">{problem.title}</h2>
      <div className="flex gap-2">
        {[...new Set(problem.genres)].map((g, i) => (
          <Badge key={i} variant="outline">
            {g}
          </Badge>
        ))}
      </div>
      <p className="bg-gray-50 p-3 rounded">
        {problem.content}
      </p>

      {/* Toggle 버튼으로 정답 보기/가리기 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAnswer(!showAnswer)}
        className="flex items-center gap-2 hover:bg-point-200/50"
      >
        {showAnswer ? (
          <>
            <EyeOff className="w-4 h-4" />
            정답 숨기기
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            정답 보기
          </>
        )}
      </Button>
      {showAnswer && (
        <div className="bg-point-100 p-3 rounded border border-point-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold">정답</span>
          </div>
          <p>{problem.answer}</p>
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t">
        <span>
          {difficultyConfig[difficultyKey].icon}{" "}
          {difficultyConfig[difficultyKey].label}
        </span>
        <span>작성자: {problem.creator.nickname}</span>
      </div>

      <Button
        className="w-full mt-6 bg-primary "
        size="lg"
        onClick={onConfirm}
        variant="secondary"
      >
        이 사건 선택
      </Button>
    </div>
  );
};

export default ProblemDetail;
