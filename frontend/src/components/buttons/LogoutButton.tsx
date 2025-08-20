import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { logout } from "@/services/api/auth/logoutApi";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * 로그아웃 버튼 컴포넌트
 * 
 * 사용법:
 * <LogoutButton />
 * <LogoutButton variant="outline" size="sm">나가기</LogoutButton>
 */
export function LogoutButton({
  variant = "outline",
  size = "default",
  showIcon = true,
  children = "로그아웃",
  className,
  ...props
}: LogoutButtonProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    track("user_logout_attempted", {
      timestamp: getKoreanTimestamp(),
    });

    try {
      await logout();

      track("user_logged_out", {
        logout_method: "manual",
        timestamp: getKoreanTimestamp(),
      });

      navigate("/");
    } catch (error) {
      track("user_logout_failed", {
        error_reason: error instanceof Error ? error.message : 'unknown',
        timestamp: getKoreanTimestamp(),
      });

      console.error("로그아웃 처리 중 오류 발생:", error);
      // 에러가 발생해도 메인 페이지로 이동
      navigate("/");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={false}
      className={className}
      {...props}
    >
      {showIcon && <LogOut className="w-4 h-4 mr-2" />}
      {children}
    </Button>
  );
}