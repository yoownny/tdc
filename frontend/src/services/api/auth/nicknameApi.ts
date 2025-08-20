import { apiClient } from '@/services/api/apiClient';
import { ApiError, type ApiSuccessResponse } from '@/types/api/response';

/**
 * 닉네임 중복확인 API 응답 타입
 */

/**
 * 닉네임 중복확인 API 호출
 * GET /api/auth/check-nickname?nickname={nickname}
 * 
 * @param nickname - 확인할 닉네임
 * @returns 사용 가능 여부 (true: 사용가능, false: 중복)
 */
export const checkNicknameDuplicate = async (nickname: string): Promise<boolean> => {
  try {
    console.log('🔍 닉네임 중복 확인 API 호출:', nickname);
    
    const response = await apiClient.get<ApiSuccessResponse>(
      `/auth/check-nickname?nickname=${nickname}`
    );
    
    console.log('✅ 닉네임 중복 확인 완료:', response);
    return response.statusCode === 200;
    
  } catch (error: unknown) {
    console.error('❌ 닉네임 중복 확인 실패:', error);
    throw error as ApiError;
  }
};