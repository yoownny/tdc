import { apiClient } from '@/services/api/apiClient';
import type { LoginRequest, LoginResponse } from '@/types/auth';
import { ApiError } from '@/types/api/response';

/**
 * 로그인 API 응답 (헤더의 토큰 포함)
 */
export interface LoginResult {
  user: LoginResponse;
  accessToken: string;
}

/**
 * 로그인 API 호출
 * POST /api/auth/login
 * 
 * @param request - 로그인 요청 데이터 (provider, socialId)
 * @returns 로그인 결과 (사용자 정보 + 액세스 토큰)
 */
export const login = async (request: LoginRequest): Promise<LoginResult> => {
  try {
    console.log('🚀 로그인 API 호출:', request);
    
    // apiClient.post()는 헤더를 반환하지 않으므로 axios 인스턴스에 직접 접근
    const axiosInstance = (apiClient as any).instance;
    const response = await axiosInstance.post('/auth/login', request);
    
    console.log('✅ 로그인 성공:', response);
    
    // 응답 헤더에서 accessToken 추출
    const accessToken = response.headers['authorization'] || response.headers['Authorization'];
    
    return {
      user: response.data.data,
      accessToken: accessToken?.replace('Bearer ', '') || ''
    };
    
  } catch (error: unknown) {
    console.error('❌ 로그인 실패:', error);
    
    const apiError = error as ApiError;
    
    // 404는 신규 사용자 (특별 처리)
    if (apiError.statusCode === 404) {
      throw apiError;
    }
    
    throw apiError;
  }
};