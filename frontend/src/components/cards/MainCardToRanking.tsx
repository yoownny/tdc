import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import ranking from "@/assets/ranking.png";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const MainCardToRanking = () => {
  const handleRankingClick = () => {
    track("page_viewed", {
      page_name: "rankings", 
      previous_page: "main",
      access_method: "main_page_card",
      timestamp: getKoreanTimestamp(),
    });
  };

  return (
    <div className="relative group">
      {/* ACTIVE 라벨 */}
      {/* <div className="absolute -top-2 -right-2 z-10">
        <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg animate-pulse">
          ACTIVE
        </div>
      </div> */}

      {/* 폴더 탭 효과 */}
      <div className="bg-yellow-400 h-6 w-20 rounded-t-lg relative mb-0 transition-all duration-300 group-hover:scale-105 group-hover:rotate-1 group-hover:-translate-y-1 transform pointer-events-none">
        <div className="absolute inset-0 bg-yellow-300/50 rounded-t-lg"></div>
      </div>

      <Link to={"/rankings"} className="block" onClick={handleRankingClick}>
        <Card className="w-full min-w-xs text-center border-2 border-yellow-400 shadow-lg group-hover:shadow-xl transition-all duration-300 cursor-pointer -mt-0 rounded-tl-none transform group-hover:scale-105 group-hover:rotate-1 group-hover:-translate-y-1 gap-3">
          <CardHeader>
            <CardTitle className="text-pc-title-sm font-ownglyph">
              인기 사건 랭킹
            </CardTitle>
            <CardDescription>
              지금까지 플레이된 사건의
              <br />
              인기 랭킹을 확인해보세요!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center group-hover:scale-110 transition-transform duration-300">
              <img
                src={ranking}
                alt="ranking"
                className="w-24 h-24 object-cover"
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              variant="default"
              className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold"
              onClick={(e) => e.stopPropagation()}
            >
              🏆 랭킹 보기
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
};

export default MainCardToRanking;
