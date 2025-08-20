import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import mail from "@/assets/mail.png";
import { Link } from "react-router-dom";

const MainCardToToday = () => {

  return (
    <div className="relative group">
      {/* 폴더 탭 효과 */}
      <div className="bg-yellow-400 h-6 w-20 rounded-t-lg relative mb-0 transition-all duration-300 group-hover:scale-105 group-hover:rotate-1 group-hover:-translate-y-1 transform pointer-events-none">
        <div className="absolute inset-0 bg-yellow-300/50 rounded-t-lg"></div>
      </div>

      <Link to={"/today"} className="block">
        <Card className="w-full min-w-xs text-center border-2 border-yellow-400 shadow-lg group-hover:shadow-xl transition-all duration-300 cursor-pointer -mt-0 rounded-tl-none transform group-hover:scale-105 group-hover:rotate-1 group-hover:-translate-y-1 gap-3">
          <CardHeader>
            <CardTitle className="text-pc-title-sm font-ownglyph">
              오늘의 사건 의뢰
            </CardTitle>
            <CardDescription>
              매일 변경되는 사건을 조사해보세요!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center group-hover:scale-110 transition-transform duration-300">
              <img src={mail} alt="mail" className="w-24 h-24 object-cover" />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 mt-6">
            <Button
              variant="default"
              className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold"
              onClick={(e) => e.stopPropagation()}
            >
              📮 의뢰 확인하기
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
};

export default MainCardToToday;
