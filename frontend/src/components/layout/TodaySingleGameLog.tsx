import { Card, CardTitle, CardContent } from "@/components/ui/card";
import QuestionList from "../chat/QuestionList";
import AnswerList from "../chat/AnswerList";
import type { AnswerHistory } from "@/services/api/today/answerCheckApi";
import type { QuestionHistory } from "@/services/api/today/questionApi";

interface TodaySingleGameLogProps {
  questions: QuestionHistory[];
  answers: AnswerHistory[];
}

const TodaySingleGameLog = ({
  questions,
  answers,
}: TodaySingleGameLogProps) => {
  return (
    <Card className="bg-white rounded-xl border border-white/10 h-[400px] px-6">
      <CardTitle className="flex-1 min-h-0">
        <div className="flex gap-4">
          {/* 왼쪽 1/2: 질문 Record */}
          <div className="w-1/2 px-4 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <span className="text-pc-title-sm font-semibold text-gray font-ownglyph">
                질문 Record
              </span>
              <span className="text-pc-title-xs font-semibold text-gray font-ownglyph">
                {questions.length} 개
              </span>
            </div>
            <CardContent className="pt-4 px-0 flex-1 min-h-0">
              <QuestionList questions={questions} />
            </CardContent>
          </div>
          {/* 왼쪽 1/2: 답변 Record */}
          <div className="w-1/2 px-4 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <div className="text-pc-title-sm font-semibold text-gray font-ownglyph">
                답변 Record
              </div>
              <span className="text-pc-title-xs font-semibold text-gray font-ownglyph">
                {answers.length} 개
              </span>
            </div>
            <CardContent className="pt-4 px-0 flex-1 min-h-0">
              <AnswerList answers={answers} />
            </CardContent>
          </div>
        </div>
      </CardTitle>
    </Card>
  );
};

export default TodaySingleGameLog;
