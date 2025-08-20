import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import useUserStore from "@/stores/userStore";
import { login } from "@/services/api/auth/loginApi";
import { ApiError } from "@/types/api/response";
import type {
  GoogleUserInfo,
  GoogleTokenResponse,
  GoogleTokenClient,
  LoginRequest,
} from "@/types/auth";
import { track } from "@amplitude/analytics-browser";
import { getDeviceType } from "@/utils/deviceType";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import { clearGuestData } from "@/utils/guestUtils";

export function useGoogleAuth() {
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();
  const { setUser: setUserStore } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // 팝업이 닫힐 때를 감지하는 useEffect
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isLoading) {
        // 페이지가 숨겨졌을 때 (팝업이 닫혔을 때) isLoading 상태 초기화
        setIsLoading(false);
      }
    };

    const handleFocus = () => {
      if (isLoading) {
        // 페이지에 포커스가 돌아왔을 때 isLoading 상태 초기화
        setIsLoading(false);
      }
    };

    const handleBeforeUnload = () => {
      if (isLoading) {
        setIsLoading(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLoading]);

  /**
   * Google 로그인 처리 - 기본 apiClient 사용
   */
  async function handleGoogleLogin(): Promise<void> {
    // 🎯 로그인 시도 추적 (함수 맨 윗부분)
    track("user_login_attempted", {
      login_method: "google",
      timestamp: getKoreanTimestamp(),
    });

    if (isLoading) return;
    let userInfo: GoogleUserInfo | undefined;

    try {
      setIsLoading(true);

      // 1. Google 서비스 확인
      if (!window.google?.accounts?.oauth2) {
        // 🎯 Google OAuth 서비스 오류
        track("user_login_failed", {
          login_method: "google",
          error_reason: "google_oauth_service_not_loaded",
          timestamp: getKoreanTimestamp(),
        });

        throw new Error("Google OAuth 서비스가 로드되지 않았습니다.");
      }

      // 2. Google 팝업 로그인
      userInfo = await new Promise<GoogleUserInfo>((resolve, reject) => {
        const tokenClient: GoogleTokenClient =
          window.google!.accounts!.oauth2!.initTokenClient({
            client_id: googleClientId,
            scope: "openid email profile",
            callback: async (response: GoogleTokenResponse) => {
              try {
                if (response.error) {
                  // 🎯 Google 팝업 오류 (사용자 취소, 팝업 차단 등)
                  track("user_login_failed", {
                    login_method: "google",
                    error_reason: `google_popup_error_${response.error}`,
                    timestamp: getKoreanTimestamp(),
                  });

                  reject(new Error(`Google login error: ${response.error}`));
                  return;
                }

                if (!response.access_token) {
                  // 🎯 액세스 토큰 없음
                  track("user_login_failed", {
                    login_method: "google",
                    error_reason: "no_access_token",
                    timestamp: getKoreanTimestamp(),
                  });

                  reject(new Error("No access token received"));
                  return;
                }

                // 사용자 정보 가져오기
                const userResponse = await fetch(
                  "https://www.googleapis.com/oauth2/v2/userinfo",
                  {
                    headers: {
                      Authorization: `Bearer ${response.access_token}`,
                    },
                  }
                );

                if (!userResponse.ok) {
                  // 🎯 Google 사용자 정보 가져오기 실패
                  track("user_login_failed", {
                    login_method: "google",
                    error_reason: "failed_to_fetch_user_info",
                    timestamp: getKoreanTimestamp(),
                  });

                  throw new Error("Failed to fetch user info");
                }

                const userInfo = await userResponse.json();

                // 🎯 Google 로그인 성공 (토큰 받기 성공)
                track("google_auth_success", {
                  login_method: "google",
                  has_user_info: true,
                  timestamp: getKoreanTimestamp(),
                });

                resolve(userInfo);
              } catch (error) {
                // 🎯 Google 사용자 정보 처리 오류
                track("user_login_failed", {
                  login_method: "google",
                  error_reason: "google_userinfo_processing_error",
                  timestamp: getKoreanTimestamp(),
                });

                reject(error);
              }
            },
          });

        tokenClient.requestAccessToken();
      });

      // 3. 백엔드 로그인 - loginApi 사용
      const loginData: LoginRequest = {
        provider: "google",
        socialId: userInfo.id,
      };

      console.log("=== 백엔드 로그인 요청 ===");
      console.log("요청 데이터:", loginData);

      const response = await login(loginData);

      // 🎯 최종 로그인 성공 (설계서의 user_signed_in)
      track("user_signed_in", {
        login_method: "google",
        is_new_user: false, // 기존 사용자 (404가 아니므로)
        device_type: getDeviceType(),
        timestamp: getKoreanTimestamp(),
      });

      console.log("✅ 로그인 성공:", response);

      // 4. 사용자 정보 및 accessToken 저장
      setUser(response.user);
      setAccessToken(response.accessToken);

      // userStore도 동기화
      setUserStore(response.user.userId, response.user.nickname);

      // 5. 게스트 데이터 정리 (기존 정회원이 게스트로 로그인했다가 다시 로그인하는 경우)
      clearGuestData();
      console.log("게스트 데이터 정리 완료");

      // 6. 성공 시 메인으로 이동 이동
      console.log("✅ 메인으로 이동");
      navigate("/");
    } catch (error: Error | unknown) {
      console.error("Google 로그인 오류:", error);

      // 404는 신규 사용자
      if (error instanceof ApiError && error.statusCode === 404) {        
        // 신규 사용자 감지 이벤트
        const isMigrationMode = sessionStorage.getItem("migrationMode") === "true";
        
        track("new_user_detected", {
          login_method: "google",
          redirect_to: "signup",
          is_migration: isMigrationMode,
          timestamp: getKoreanTimestamp(),
        });
        
        console.log("신규 사용자 - 회원가입 페이지로 이동");
        sessionStorage.setItem("tempGoogleId", userInfo!.id);
        
        // 마이그레이션 모드일 때는 migration=true 파라미터 추가
        if (isMigrationMode) {
          sessionStorage.removeItem("migrationMode"); // 사용 후 제거
          navigate("/signup?migration=true");
        } else {
          navigate("/signup");
        }
        return;
      }

      let errorReason = "unknown_error";
      let errorMessage = "로그인 처리 중 오류가 발생했습니다.";
      if (error instanceof Error) {
        if (error.message.includes("popup_blocked")) {
          errorMessage =
            "팝업이 차단되었습니다. 팝업을 허용한 후 다시 시도해주세요.";
          errorReason = "popup_blocked";
        } else if (error.message.includes("access_denied")) {
          errorMessage = "로그인이 취소되었습니다.";
          errorReason = "access_denied";
        } else if (error.message.includes("No access token received")) {
          errorMessage =
            "서버에서 인증 토큰을 받지 못했습니다. 잠시 후 다시 시도해주세요.";
          errorReason = "no_access_token";
        } else {
          errorMessage = error.message;
          errorReason = "general_error";
        }

        track("user_login_failed", {
          login_method: "google",
          error_reason: errorReason,
          timestamp: getKoreanTimestamp(),
        });
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    handleGoogleLogin,
  };
}
