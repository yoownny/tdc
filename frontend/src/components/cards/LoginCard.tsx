import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import GoogleLoginButton from "@/components/buttons/GoogleLoginButton";
import { GuestLoginButton } from "@/components/buttons/GuestLoginButton";

const LoginCard = () => {
  return (
    <Card className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border-2 border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl md:text-4xl font-bold text-point-500 mb-2 font-ownglyph">
          소셜 로그인
        </CardTitle>
        <CardDescription className="text-point-400">
          게임을 시작하려면 로그인하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <GoogleLoginButton />
        <GuestLoginButton />
      </CardContent>
    </Card>
  );
};

export default LoginCard;