import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
// import { Link } from "react-router-dom";

const MainCardToAI = () => {
  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <CardTitle>AI 사건 파일</CardTitle>
        <CardDescription>
          <p>AI가 의뢰한 사건을 조사합니다.</p>
          </CardDescription>
      </CardHeader>
      <CardContent>
        <p>🚧</p>
        <p>(공사 중)</p>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {/* <Link to={"/lobby"}> */}
          <Button variant="default" className="w-full">
            조사하러 가기
          </Button>
        {/* </Link> */}
      </CardFooter>
    </Card>
  );
};

export default MainCardToAI;
