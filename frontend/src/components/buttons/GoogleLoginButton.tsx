import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

const GoogleLoginButton = () => {
  const { isLoading, handleGoogleLogin } = useGoogleAuth();

  return (
    <Button
      className="w-full flex items-center justify-center gap-3 rounded-md text-lg font-bold py-6 bg-point-200/30 hover:bg-point-200 text-point-700 transition-colors duration-200"
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      <FcGoogle size={24} />
      <span className="text-point-700">
        {isLoading ? "로그인 중..." : "구글 계정으로 로그인"}
      </span>
    </Button>
  );
};

export default GoogleLoginButton;
