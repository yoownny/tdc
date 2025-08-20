import { Button } from "@/components/ui/button";
import { useGuestAuth } from "@/hooks/useGuestAuth";

interface GuestLoginButtonProps {
  className?: string;
}

export function GuestLoginButton({ className }: GuestLoginButtonProps) {
  const { isLoading, handleGuestLogin } = useGuestAuth();

  return (
    <Button
      variant="outline"
      onClick={handleGuestLogin}
      disabled={isLoading}
      className={`w-full border-gray text-gray hover:bg-gray/10 ${
        className || ""
      }`}
    >
      {isLoading ? "로그인 중..." : "비회원으로 시작하기"}
    </Button>
  );
}
