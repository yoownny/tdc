import { AxiosError } from "axios";

/**
 * 백엔드 API의 성공 응답 구조
 */
export interface ApiSuccessResponse<T = null> {
  //<T = null> -> unknown 대신 null 사용
  statusCode: 200 | 201;
  message: string;
  data: T;
}

/**
 * 백엔드 API의 에러 응답 구조
 */
export interface ApiErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
}

/**
 * API 응답 타입 (성공 또는 에러)
 */
export type ApiResponse<T = null> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * API 에러 클래스
 * Axios 에러를 감싸서 프로젝트에서 사용하기 쉽게 변환
 */
export class ApiError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public originalError: AxiosError;

  constructor(axiosError: AxiosError) {
    const response = axiosError.response?.data as ApiErrorResponse;
    const message =
      response?.message ||
      axiosError.message ||
      "API 요청 중 오류가 발생했습니다.";

    super(message);
    this.name = "ApiError";
    this.statusCode = response?.statusCode || axiosError.response?.status || 0;
    this.errorCode = response?.errorCode;
    this.originalError = axiosError;
  }

  /**
   * 특정 상태 코드인지 확인
   */
  isStatus(statusCode: number): boolean {
    return this.statusCode === statusCode;
  }

  /**
   * 특정 에러 코드인지 확인
   */
  isErrorCode(errorCode: string): boolean {
    return this.errorCode === errorCode;
  }

  /**
   * 네트워크 에러인지 확인
   */
  isNetworkError(): boolean {
    return this.originalError.code === "NETWORK_ERROR" || !this.statusCode;
  }

  /**
   * 타임아웃 에러인지 확인
   */
  isTimeoutError(): boolean {
    return this.originalError.code === "ECONNABORTED";
  }
}
