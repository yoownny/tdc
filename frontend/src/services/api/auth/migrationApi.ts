import { apiClient } from "@/services/api/apiClient";
import { ApiError } from "@/types/api/response";
import type { User } from "@/types/auth";

export interface MigrationRequest {
  guestUserId: number;
  socialId: string;
  newNickname: string;
}

export interface MigrationResult {
  user: User;
  accessToken: string;
}

export const migrateGuestToMember = async (
  request: MigrationRequest
): Promise<MigrationResult> => {
  try {
    console.log("🔄 마이그레이션 API 호출:", request);

    const axiosInstance = (apiClient as any).instance;
    const response = await axiosInstance.post("/auth/migrate-guest", request);

    console.log("✅ 마이그레이션 성공:", response);

    // 응답 헤더에서 accessToken 추출
    const accessToken =
      response.headers["authorization"] || response.headers["Authorization"];

    return {
      user: response.data.data, // 실제 API 응답 구조에 맞춰 수정
      accessToken: accessToken?.replace("Bearer ", "") || "",
    };
  } catch (error: unknown) {
    console.error("❌ 마이그레이션 실패:", error);
    throw error as ApiError;
  }
};
