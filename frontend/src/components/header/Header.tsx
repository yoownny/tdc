// src/components/Header.tsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import useUserStore from "@/stores/userStore";
import { useEffect, useState } from "react";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import TDC_logo from "@/assets/TDC_logo.svg";
import TDC_image from "@/assets/TDC_image.svg";
import ComingSoonDialog from "../dialogs/ComingSoonDialog";
import { useAuthStore } from "@/stores/authStore";
import { isGuestUser } from "@/types/auth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userName, setUserFromStorage, setUser } = useUserStore();
  const { user } = useAuthStore();
  const { isLoading: isGoogleLoading, handleGoogleLogin } = useGoogleAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setUserFromStorage();
  }, [setUserFromStorage]);

  const handleLogout = () => {
    track("user_logged_out", {
      logout_method: "header_button",
      timestamp: getKoreanTimestamp(),
    });

    sessionStorage.removeItem("auth-storage");
    setUser(0, "");
    navigate("/");
    window.location.reload();
  };

  const handleNavigateToRankings = () => {
    // 랭킹 페이지 접근 추적
    track("page_viewed", {
      page_name: "rankings",
      previous_page: location.pathname.replace("/", "") || "main",
      access_method: "header_navigation",
      timestamp: getKoreanTimestamp(),
    });

    navigate("/rankings");
  };

  const handleNavigateToLobby = () => {
    track("page_navigation", {
      from_page: location.pathname.replace("/", "") || "main",
      to_page: "profile",
      navigation_method: "header_link",
      timestamp: getKoreanTimestamp(),
    });

    navigate("/lobby");
  };

  const handleNavigateToProfile = () => {
    // 프로필 페이지 접근 추적
    track("page_viewed", {
      page_name: "profile",
      previous_page: location.pathname.replace("/", "") || "main",
      access_method: "header_navigation",
      timestamp: getKoreanTimestamp(),
    });

    navigate("/profile");
  };

  const handleNavigateToTutorial = () => {
    // 튜토리얼 페이지 접근 추적
    track("page_viewed", {
      page_name: "tutorial",
      previous_page: location.pathname.replace("/", "") || "main",
      access_method: "header_navigation",
      timestamp: getKoreanTimestamp(),
    });

    navigate("/tutorial");
  };

    const handleNavigateToToday = () => {
    // 오늘의 바거슾 페이지 접근 추적
    track("page_viewed", {
      page_name: "today",
      previous_page: location.pathname.replace("/", "") || "main",
      access_method: "header_navigation",
      timestamp: getKoreanTimestamp(),
    });

    navigate("/today");
  };

  const handleMigration = async () => {
    // 정회원 되기 버튼 클릭 추적
    track("guest_migration_requested", {
      from_page: location.pathname.replace("/", "") || "main",
      source: "header_button",
      timestamp: getKoreanTimestamp(),
    });

    // 구글 로그인을 통해 마이그레이션 모드로 진행
    sessionStorage.setItem("migrationMode", "true");

    try {
      await handleGoogleLogin();
    } catch (error) {
      // 에러 발생 시 플래그 제거
      sessionStorage.removeItem("migrationMode");
    }
  };

  return (
    <div className="relative flex items-center justify-between px-12 py-6 bg-primary">
      <div className="flex items-center">
        <Link to="/" className="flex items-center">
          <img
            src={TDC_logo}
            style={{
              width: "80px",
              height: "40px",
              padding: "4px",
            }}
            alt="Logo"
          />
        </Link>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-10 text-gray font-ownglyph text-xl font-bold">
        <button
          onClick={handleNavigateToRankings}
          className={`${location.pathname === "/rankings" ? "text-3xl" : ""}`}
        >
          인기 사건 랭킹
        </button>
        <span>|</span>
        <button
          onClick={handleNavigateToLobby}
          className={`${location.pathname === "/lobby" ? "text-3xl" : ""}`}
        >
          사건 파일 목록
        </button>
        <span>|</span>
        <button
          // onClick={() => setIsDialogOpen(true)}
          onClick={handleNavigateToToday}          
          className={`${location.pathname === "/today" ? "text-3xl" : ""}`}
        >
          오늘의 사건 의뢰
        </button>
        <span>|</span>
        <button
          onClick={handleNavigateToTutorial}
          className={`${location.pathname === "/tutorial" ? "text-3xl" : ""}`}
        >
          게임 방법
        </button>
      </div>

      <ComingSoonDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="🚧 오늘의 사건 의뢰"
        description="이 기능은 준비 중입니다. 곧 만나보실 수 있어요! 🔧"
      />

      <div className="flex items-center gap-10">
        {userId !== 0 ? (
          <>
            <button
              onClick={handleNavigateToProfile}
              className="hover:underline"
            >
              <div className="flex items-center gap-1">
                <img
                  src={TDC_image}
                  style={{
                    width: "40px",
                    height: "40px",
                    padding: "4px",
                  }}
                  alt="Logo"
                />
                <span className="text-gray">{userName}</span>
              </div>
            </button>

            {isGuestUser(user) ? (
              <button
                onClick={handleMigration}
                disabled={isGoogleLoading}
                className="text-gray disabled:text-gray-400"
              >
                {isGoogleLoading ? "연동 중..." : "정회원 되기"}
              </button>
            ) : (
              <button onClick={handleLogout} className="text-gray">
                로그아웃
              </button>
            )}
          </>
        ) : (
          <button onClick={() => navigate("/signup")} className="text-gray">
            회원가입
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
