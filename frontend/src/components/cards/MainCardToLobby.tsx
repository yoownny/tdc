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
import file from "@/assets/file.png";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const MainCardToLobby = () => {
  const handleLobbyClick = () => {
    track("page_navigation", {
      from_page: "main",
      to_page: "lobby",
      navigation_method: "main_card_click",
      timestamp: getKoreanTimestamp(),
    });
  };

  return (
    <div className="relative group">
      {/* 진행중 라벨 */}
      <div className="absolute -top-2 -right-2 z-10">
        <div className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg animate-pulse">
          진행중
        </div>
      </div>

      {/* 폴더 탭 효과 */}
      <div className="bg-yellow-400 h-6 w-20 rounded-t-lg relative mb-0 transition-all duration-300 hover:scale-100 group-hover:scale-105 group-hover:rotate-1 group-hover:-translate-y-1 transform pointer-events-none">
        <div className="absolute inset-0 bg-yellow-300/50 rounded-t-lg"></div>
      </div>

      <Link to={"/lobby"} className="block" onClick={handleLobbyClick}>
        <Card className="w-full min-w-xs text-center border-2 border-yellow-400 shadow-lg group-hover:shadow-xl transition-all duration-300 cursor-pointer -mt-0 rounded-tl-none transform group-hover:scale-105 group-hover:rotate-1 group-hover:-translate-y-1 gap-3">
          <CardHeader>
            <CardTitle className="text-pc-title-sm font-ownglyph">
              사건 파일 목록
            </CardTitle>
            <CardDescription>
              다른 탐정들과 함께 사건을 조사해보세요!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center group-hover:scale-110 transition-transform duration-300">
              <img src={file} alt="file" className="w-24 h-24 object-cover" />
            </div>
            <div className="h-6"></div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              variant="default"
              className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold"
              onClick={(e) => e.stopPropagation()}
            >
              🗂️ 방 목록 보기
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
};

export default MainCardToLobby;
