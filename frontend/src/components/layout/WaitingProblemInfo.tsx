import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import useProblemStore from "@/stores/problemStore";
import { useState } from "react";
import { Button } from "../ui/button";
import { Search, EyeOff } from "lucide-react";
import TDCImage from "@/assets/TDC_image.svg";
import { useTypingEffect } from "@/hooks/useTypingEffect";

interface WaitingProblemInfoProps {
  isHost: boolean;
}

const WaitingProblemInfo = ({ isHost }: WaitingProblemInfoProps) => {
  const problemContent = useProblemStore((state) => state.content);
  const problemAnswer = useProblemStore((state) => state.answer);

  const [showAnswer, setShowAnswer] = useState(false);
  
  // 타자 효과 적용 (참가자가 방에 들어올 때 사건내용이 타이핑됨)
  const { displayText: typedContent, isComplete } = useTypingEffect(problemContent || "", 100);

  // 예상 : 기본값 false, 방장 문제 선택 시 참가자 false, 정답 공개 후 true, 방장은 선택 이후 모두 true
  const isNew: boolean = true;

  const layers: number[] = [1, 2, 3, 4, 5];

  return (
    <Card className="bg-white rounded-xl border border-white/10 p-6 relative  ">
      {/* TDC 이미지 배경 - 참가자일 때도 표시 */}
      <div
        className="absolute inset-0 opacity-10 "
        style={{
          backgroundImage: `url(${TDCImage})`,
          backgroundSize: "30%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* 문제 내용 - 참가자일 때는 더 많은 공간 차지 */}
      <div className={isHost ? "" : "h-[248px] flex flex-col justify-center"}>
        <h3 className="text-pc-title-sm font-semibold text-gray mb-2 text-center font-ownglyph">
          사건 내용
        </h3>
        <ScrollArea
          className={`rounded-lg p-2 border border-white/10 max-w-[480px] mx-auto relative overflow-hidden ${
            isHost ? "h-[80px]" : "h-[120px]"
          }`}
          type="always"
        >
          <p className="text-pc-body-md text-gray text-center leading-relaxed whitespace-pre-wrap break-words relative z-10">
            {typedContent}
            {!isComplete && (
              <span className="inline-block w-1 h-4 bg-gray/80 ml-1 animate-pulse"></span>
            )}
          </p>
        </ScrollArea>
      </div>

      {/* 정답 영역 - 호스트일 때만 표시 */}
      {isHost && (
        <div className="h-[100px]">
          {isNew ? (
            <div className="h-full relative">
              {/* 정답 영역 - 높이 고정하고 내용만 표시/숨김 */}
              <div className="h-full overflow-hidden">
                {showAnswer ? (
                  <div className=" rounded-lg border border-white/10 h-full relative overflow-hidden">
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
                        {problemAnswer}
                      </p>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 h-full flex items-center justify-center relative overflow-hidden">
                    {/* TDC 이미지 배경
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: `url(${TDCImage})`,
                        backgroundSize: "contain",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    /> */}
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
            </div>
          ) : (
            <div className="space-y-4">
              {layers.map((index) => (
                <Skeleton
                  key={index}
                  className="h-10 w-full rounded-full bg-white/20"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default WaitingProblemInfo;
