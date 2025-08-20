import { apiClient } from "@/services/api/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { ApiError } from "@/types/api/response";

/**
 * 토큰 갱신 API
 * 
 * 기능:
 * - Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.
 * - 새 토큰을 자동으로 authStore에 저장합니다.
 * - Refresh Token은 쿠키로 자동 전송됩니다.
 */
export async function refreshToken(): Promise<string> {
    try {
      console.log('🔄 토큰 갱신 API 호출');
      
      // apiClient.post()는 헤더를 반환하지 않으므로 axios 인스턴스에 직접 접근
      const axiosInstance = (apiClient as any).instance;
      const response = await axiosInstance.post("/auth/refresh");
      
      console.log('✅ 토큰 갱신 성공:', response);
      
      // 응답 헤더에서 새로운 access token 추출
      const newAccessToken = response.headers['authorization'] || response.headers['Authorization'];
      
      if (!newAccessToken) {
        throw new Error('새로운 access token을 받지 못했습니다.');
      }
      
      // Bearer 접두사 제거
      const token = newAccessToken.replace('Bearer ', '');
      
      // authStore에 새로운 토큰 저장
      const { setAccessToken } = useAuthStore.getState();
      setAccessToken(token);
      
      console.log("✅ 토큰 갱신 및 저장 완료");
      
      return token;
      
    } catch (error: unknown) {
      console.error("❌ 토큰 갱신 실패:", error);
      
      // 토큰 갱신 실패 시 로그아웃 처리
      const { clear } = useAuthStore.getState();
      clear();
      
      throw error as ApiError;
    }
  }