import SingleGameInputBar from "@/components/chat/SingleGameInputBar";
import TodaySingleGameLog from "@/components/layout/TodaySingleGameLog";
import type { AnswerHistory } from "@/services/api/today/answerCheckApi";
import type { QuestionHistory } from "@/services/api/today/questionApi";
import {
  todayProblem,
  type TodayProblem,
} from "@/services/api/today/todayProblemApi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { EyeOff, Search } from "lucide-react";
import { toast } from "sonner";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import useUserStore from "@/stores/userStore";

function TodayTemplate() {
  const [questions, setQuestions] = useState<QuestionHistory[]>([]);
  const [answers, setAnswers] = useState<AnswerHistory[]>([]);
  const [problem, setProblem] = useState<TodayProblem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const userId = useUserStore((s) => s.userId);

  // Question 추가
  const onAddQuestion = (newItem: QuestionHistory) => {
    setQuestions((prev) => [...prev, newItem]);

    // AI 오늘의 바거슾 Question 시도 추적
    track("ai_today_question", {
      userId,
      problemId: problem?.problemId,
      attemptIndex: questions.length, // 시도 횟수
      contentLength: newItem.userQuestion.length, // 질문 길이 평가
      isRelevant: newItem.response !== "상관없음", // 질문 연관성 평가
      timestamp: getKoreanTimestamp(),
    });
  };

  // Answer 추가
  const onAddAnswer = (newItem: AnswerHistory) => {
    setAnswers((prev) => [...prev, newItem]);

    // AI 오늘의 바거슾 Answer 시도 추적
    track("ai_today_answer", {
      userId,
      problemId: problem?.problemId,
      attemptIndex: answers.length, // 시도 횟수
      isCorrect: newItem.isCorrect, // 정답 비율 평가
      score: newItem.score, // 유사도 점수 평가
      timestamp: getKoreanTimestamp(),
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await todayProblem();
        setProblem(data.problem);
        setQuestions(data.questionHistory ?? []);
        setAnswers(data.guessHistory ?? []);

        // 페이지 조회 추적
        track("today_ai_problem_viewed", {
          problemId: problem?.problemId,
          useId,
          view_source: "direct_access",
          timestamp: getKoreanTimestamp(),
        });
      } catch {
        toast.error("문제 정보를 불러오는 데 실패하였습니다.");
      }
    })();
  }, []);

  return (
    <div className="max-w-[960px] mx-auto">
      <div className="flex flex-col justify-center relative z-10">
        <h3 className="text-pc-title-md font-semibold text-gray mb-2 text-center font-ownglyph">
          {problem?.title ?? ""}
        </h3>

        <ScrollArea className="bg-white/5 rounded-lg p-2 border border-white/10 max-w-[600px] mx-auto relative overflow-hidden h-[100px] text-pc-body-sm">
          <p className="text-base text-pc-body-md text-gray-800 text-center leading-relaxed whitespace-pre-wrap break-words relative z-10 tracking-wide">
            {problem?.content ?? ""}
          </p>
        </ScrollArea>

        {problem?.answer && (
          <div className="h-[100px]">
            {showAnswer ? (
              <div className="rounded-lg border border-white/10 h-full relative overflow-hidden p-4">
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h4 className="text-pc-body-lg font-medium text-gray font-ownglyph">
                    정답
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnswer(false)}
                    className="p-2 h-8 w-8 hover:bg-white/20 rounded-full text-gray hover:text-point-300 transition-all duration-200 border border-white/20 hover:border-white/30"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                </div>
                <ScrollArea
                  className="h-[calc(100%-32px)] pr-2 relative z-10"
                  type="always"
                >
                  <p className="text-pc-body-md text-gray leading-relaxed whitespace-pre-wrap break-words">
                    {problem.answer}
                  </p>
                </ScrollArea>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 h-full flex items-center justify-center relative overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnswer(true)}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-gray hover:bg-white/30 hover:text-point-300 transition-all duration-200 px-6 py-3 rounded-xl relative z-10 shadow-lg hover:shadow-xl font-ownglyph text-pc-body-lg"
                >
                  <Search className="w-5 h-5" />
                  정답 보기
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="gap-4">
        {/* problem이 준비된 뒤에만 입력 바 렌더링하여 problemId undefined 방지 */}
        {problem && (
          <SingleGameInputBar
            problemId={problem.problemId}
            onAddQuestion={onAddQuestion}
            onAddAnswer={onAddAnswer}
          />
        )}

        <TodaySingleGameLog questions={questions} answers={answers} />
      </div>
    </div>
  );
}

export default TodayTemplate;
