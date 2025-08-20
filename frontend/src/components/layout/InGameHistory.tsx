import { Card, CardTitle, CardContent } from "@/components/ui/card";
import HistoryList from "../chat/HistoryList";
import useProblemStore from "@/stores/problemStore";
import { useMemo } from "react";
import TDCImage from "@/assets/TDC_image.svg";

const InGameHistory = () => {
  // 문제 정보 가져오기 (개별 구독으로 무한 루프 방지)
  const problemTitle = useProblemStore((state) => state.title);
  const problemContent = useProblemStore((state) => state.content);
  const problemDifficulty = useProblemStore((state) => state.difficulty);
  const problemGenres = useProblemStore((state) => state.genres);

  const problemInfo = useMemo(
    () => ({
      title: problemTitle,
      content: problemContent,
      difficulty: problemDifficulty,
      genres: problemGenres,
    }),
    [problemTitle, problemContent, problemDifficulty, problemGenres]
  );

  return (
    <Card className="bg-white rounded-xl border border-white/10 h-[500px] px-6">
      <CardTitle className="flex-1 min-h-0">
        <div className="flex gap-4">
          {/* 왼쪽 1/2: 질문 Record */}
          <div className="w-1/2 px-4 flex flex-col h-full">
            <div className="text-pc-title-sm font-semibold text-gray font-ownglyph">
              질문 Record
            </div>
            <CardContent className="pt-4 px-0 flex-1 min-h-0">
              <HistoryList />
            </CardContent>
          </div>

          {/* 오른쪽 1/2: 문제 정보 - 출제자 UI와 동일한 스타일 */}
          <div className="w-1/2 px-4 relative overflow-hidden">
            {/* TDC 이미지 배경 */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url(${TDCImage})`,
                backgroundSize: "250px",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />

            {/* 문제 정보 내용 */}
            <div className="relative z-10 h-full flex flex-col justify-center">
              <div className="text-pc-title-sm font-semibold text-gray font-ownglyph mb-4 text-center">
                사건 내용
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 max-w-[400px] mx-auto relative overflow-hidden">
                <p className="text-pc-body-lg text-black text-center leading-loose whitespace-pre-wrap break-words font-normal">
                  {problemInfo.content || "문제 내용을 불러오는 중..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardTitle>
    </Card>
  );
};

export default InGameHistory;
