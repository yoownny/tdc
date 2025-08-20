import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import useUserStore from "@/stores/userStore";
import { login } from "@/services/api/auth/loginApi";
import type { LoginRequest } from "@/types/auth";
import { generateGuestId } from "@/utils/guestUtils";
import { track } from "@amplitude/analytics-browser";
import { getDeviceType } from "@/utils/deviceType";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

export function useGuestAuth() {
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();
  const { setUser: setUserStore } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = async (): Promise<void> => {
    // 🎯 게스트 로그인 시도 추적
    track("user_login_attempted", {
      login_method: "guest",
      timestamp: getKoreanTimestamp(),
    });

    if (isLoading) return;

    try {
      setIsLoading(true);

      // 1. 게스트 ID 가져오기 또는 새로 생성
      let guestId = sessionStorage.getItem("guestId");
      if (!guestId) {
        guestId = generateGuestId();
        sessionStorage.setItem("guestId", guestId);
      }

      console.log("게스트 로그인 시작:", { guestId });

      // 2. 게스트 로그인 API 호출
      const loginData: LoginRequest = {
        provider: "guest",
        socialId: guestId,
      };

      console.log("=== 게스트 로그인 요청 ===");
      console.log("요청 데이터:", loginData);

      const response = await login(loginData);

      // 🎯 게스트 로그인 성공
      track("user_signed_in", {
        login_method: "guest",
        is_new_user: true, // 게스트는 항상 새 사용자로 간주
        device_type: getDeviceType(),
        timestamp: getKoreanTimestamp(),
      });

      console.log("✅ 게스트 로그인 성공:", response);

      // 3. 사용자 정보 및 accessToken 저장
      setUser(response.user);
      setAccessToken(response.accessToken);

      // userStore도 동기화
      setUserStore(response.user.userId, response.user.nickname);

      // 4. sessionStorage의 guestId를 실제 응답받은 socialId로 동기화
      // (백엔드에서 새 게스트를 생성했을 수 있으므로)
      if (response.user.socialId !== guestId) {
        console.log(`게스트 ID 동기화: ${guestId} → ${response.user.socialId}`);
        sessionStorage.setItem("guestId", response.user.socialId);
      }

      // 5. 메인으로 이동
      console.log("✅ 메인으로 이동");
      navigate("/");
    } catch (error) {
      console.error("게스트 로그인 오류:", error);

      track("user_login_failed", {
        login_method: "guest",
        error_reason: "guest_login_failed",
        timestamp: getKoreanTimestamp(),
      });

      alert("게스트 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleGuestLogin,
  };
}
