import MainTemplate from "@/layouts/MainTemplate";
import TDCImage from "@/assets/TDC_image.svg";
import { GoogleLoginButton, GuestLoginButton } from "@/components/buttons";
import ComingSoonDialog from "@/components/dialogs/ComingSoonDialog";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useTypingEffect } from "@/hooks/useTypingEffect";
import { useEffect } from "react";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import { isGuestUser } from "@/types/auth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const IndexPage = () => {
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const { user, accessToken } = useAuthStore();
  const { isLoading: isGoogleLoading, handleGoogleLogin } = useGoogleAuth();
  const isLoggedIn = !!(user && accessToken);

  useEffect(() => {
    track("page_viewed", {
      page_name: "main",
      previous_page: "unknown",
      view_source: "direct_access",
      is_logged_in: isLoggedIn,
      timestamp: getKoreanTimestamp(),
    });
  }, [isLoggedIn]);

  const handleMigration = async () => {
    track("guest_migration_requested", {
      from_page: "main",
      source: "main_button",
      timestamp: getKoreanTimestamp(),
    });

    // 구글 로그인을 통해 마이그레이션 모드로 진행
    sessionStorage.setItem("migrationMode", "true");

    try {
      await handleGoogleLogin();
    } catch {
      // 에러 발생 시 플래그 제거
      sessionStorage.removeItem("migrationMode");
    }
  };

  // 타이핑할 텍스트 (전체 환영 메시지)
  const welcomeText = `어서와요, ${
    user?.nickname || "사용자"
  }님! 오늘은 어떤 추리를 풀어볼까요?`;
  const { displayText, isComplete } = useTypingEffect(welcomeText, 80);

  return (
    <div className="min-h-screen bg-primary">
      {/* 헤더 섹션 */}
      <div className="text-center py-8 px-4">
        <div className="flex justify-center items-center">
          <img src={TDCImage} alt="TDC" className="w-28 h-28" />
        </div>
        {/* <div className="space-y-2"> */}
        <h1 className="text-gray text-pc-title-lg md:text-6xl font-bold font-ownglyph leading-tight">
          거북 탐정과 사건파일
        </h1>
        <p className="text-gray/80 text-pc-title-sm md:text-2xl font-light font-ownglyph">
          진실을 찾아가는 추리 게임의 세계
        </p>
        {/* </div> */}
      </div>

      {/* 로그인 상태에 따른 조건부 렌더링 */}
      {isLoggedIn ? (
        // 로그인된 사용자에게 보여줄 UI
        <div className="max-w-[1440px] mx-auto px-4 pb-9">
          <div
            className={`flex flex-col items-center justify-center h-16 md:h-24 ${
              isGuestUser(user) ? "-mt-12" : ""
            }`}
          >
            <div className="text-center">
              <p className="text-gray/80 text-lg font-light font-ownglyph">
                {displayText}
                {isComplete && <span className="ml-1">🕵️‍♂️</span>}
                {!isComplete && (
                  <span className="inline-block w-1 h-6 bg-gray/80 ml-1 animate-pulse"></span>
                )}
              </p>
            </div>
          </div>

          {/* 게스트 유저에게만 정회원 되기 버튼 표시 */}
          {isGuestUser(user) && (
            <div className="flex flex-col items-center justify-center -mt-4 mb-2">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 max-w-md mx-auto text-center">
                <p className="text-yellow-700 mb-3 text-sm">
                  게스트로 즐긴 기록을 그대로 가져가서 정회원이 되어보세요!
                </p>
                <button
                  onClick={handleMigration}
                  disabled={isGoogleLoading}
                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  {isGoogleLoading ? "연동 중..." : "정회원 되기 ✨"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // 로그인되지 않은 사용자에게 보여줄 UI
        <div className="max-w-[1440px] mx-auto px-4 pb-12">
          <div className="flex flex-col items-center justify-center">
            <div className="space-y-3 w-full max-w-xs">
              <GoogleLoginButton />

              <GuestLoginButton />
            </div>
          </div>
        </div>
      )}

      {/* 메인 템플릿 */}
      <div
        className={`max-w-[1440px] mx-auto px-4 pb-8 ${
          isLoggedIn && isGuestUser(user) ? "-mt-8" : ""
        }`}
      >
        <MainTemplate />
      </div>

      {/* 준비중 Dialog */}
      <ComingSoonDialog
        isOpen={isGuestDialogOpen}
        onOpenChange={setIsGuestDialogOpen}
        title="🚧 비회원 모드"
        description="이 기능은 현재 준비 중입니다. 곧 만나보실 수 있어요! 🔧"
      />

    </div>
  );
};

export default IndexPage;
