import { apiClient } from "@/services/api/apiClient";
import { useAuthStore } from "@/stores/authStore";
import useUserStore from "@/stores/userStore";

/**
 * 로그아웃 API
 *
 * 기능:
 * - 백엔드에 로그아웃 요청을 보냅니다.
 * - 성공 시 로컬스토리지의 auth-storage를 완전히 삭제합니다.
 * - Refresh Token을 무효화합니다.
 *
 * 확장성 고려사항:
 * - auth-storage 완전 삭제로 비회원 로그인 등 새로운 인증 방식과 충돌 방지
 * - 새로운 세션 시작을 위한 완전한 초기화
 */
export async function logout(): Promise<void> {
  try {
    // 1. 백엔드에 로그아웃 요청
    await apiClient.post("/auth/logout");

    // 2. 로컬 상태 정리 - auth-storage 완전 삭제
    const { clear } = useAuthStore.getState();
    clear(); // authStore 상태 초기화

    // 3. userStore도 초기화
    const { setUser: setUserStore } = useUserStore.getState();
    setUserStore(-1, ""); // userStore 상태 초기화

    // 4. sessionStorage에서 auth-storage 키 완전 삭제
    sessionStorage.removeItem("auth-storage");

    console.log(
      "✅ 로그아웃 완료 - auth-storage와 userStore가 완전히 삭제되었습니다."
    );
  } catch (error) {
    console.error("로그아웃 요청 실패:", error);

    // 백엔드 요청이 실패해도 로컬 상태는 정리
    const { clear } = useAuthStore.getState();
    clear();

    const { setUser: setUserStore } = useUserStore.getState();
    setUserStore(-1, "");

    sessionStorage.removeItem("auth-storage");

    throw error;
  }
}
