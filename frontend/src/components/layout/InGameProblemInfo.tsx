import { Card } from "@/components/ui/card";
import { ScrollArea } from "../ui/scroll-area";
import useProblemStore from "@/stores/problemStore";
import TDCImage from "@/assets/TDC_image.svg";

const InGameProblemInfo = () => {
  const problemContent = useProblemStore((state) => state.content);
  const problemAnswer = useProblemStore((state) => state.answer);

  return (
    <Card className="bg-white rounded-xl border border-white/10 p-6 relative overflow-hidden">
      {/* TDC 이미지 배경 - 전체 카드에 한 번만 적용 */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${TDCImage})`,
          backgroundSize: "200px",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* 문제 내용 */}
      <div className="h-[248px] flex flex-col justify-center relative z-10">
        <h3 className="text-pc-title-sm font-semibold text-gray mb-2 text-center font-ownglyph">
          사건 내용
        </h3>
        <ScrollArea
          className="bg-white/5 rounded-lg p-2 border border-white/10 max-w-[600px] mx-auto relative overflow-hidden h-[120px] text-pc-body-sm"
          type="always"
        >
          <p className="text-base text-pc-body-md text-gray-800 text-center leading-relaxed whitespace-pre-wrap break-words relative z-10 tracking-wide">
            {problemContent}
          </p>
        </ScrollArea>
      </div>

      {/* 정답 영역 */}
      <div className="h-[100px] relative z-10">
        <div className="h-full relative">
          <div className="bg-white/5 rounded-lg border border-white/10 h-full relative overflow-hidden">
            <div className="mb-2 relative z-10">
              <h4 className="text-pc-body-lg font-medium text-gray font-ownglyph">
                정답
              </h4>
            </div>
            <ScrollArea
              className="h-[calc(100%-32px)] pr-2 relative z-10"
              type="always"
            >
              <p className="text-base text-pc-body-md font-bold text-gray-800 leading-relaxed whitespace-pre-wrap break-words tracking-wide">
                {problemAnswer}
              </p>
            </ScrollArea>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InGameProblemInfo;
