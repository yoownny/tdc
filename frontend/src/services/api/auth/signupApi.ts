import { apiClient } from "@/services/api/apiClient";
import { ApiError } from "@/types/api/response";

/**
 * 회원가입 API 요청 타입
 */
export interface SignupRequest {
  socialId: string;
  nickname: string;
}

/**
 * 회원가입 API 응답 타입
 */
export interface SignupResponse {
  userId: number;
  socialId: string;
  provider: "google";
  nickname: string;
  createdAt: string;
  totalGames: number;
  wins: number;
  deleted: boolean;
  role: "USER" | "ADMIN";
}

/**
 * 회원가입 API 응답 (헤더의 토큰 포함)
 */
export interface SignupResult {
  user: SignupResponse;
  accessToken: string;
}

/**
 * 회원가입 API 호출
 * POST /api/auth/nickname
 *
 * @param request - 회원가입 요청 데이터 (socialId, nickname)
 * @returns 회원가입 결과 (사용자 정보 + 액세스 토큰)
 */
export const signup = async (request: SignupRequest): Promise<SignupResult> => {
  try {
    console.log("🚀 회원가입 API 호출:", request);

    // apiClient.post()는 헤더를 반환하지 않으므로 axios 인스턴스에 직접 접근
    const axiosInstance = (apiClient as any).instance;
    const response = await axiosInstance.post("/auth/nickname", request);

    console.log("✅ 회원가입 성공:", response);

    // 응답 헤더에서 accessToken 추출
    const accessToken =
      response.headers["authorization"] || response.headers["Authorization"];

    return {
      user: response.data.data,
      accessToken: accessToken?.replace("Bearer ", "") || "",
    };
  } catch (error: unknown) {
    console.error("❌ 회원가입 실패:", error);
    throw error as ApiError;
  }
};
