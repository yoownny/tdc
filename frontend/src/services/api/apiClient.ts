import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { ApiError, type ApiSuccessResponse } from "@/types/api/response";
import { useAuthStore } from "@/stores/authStore";
import { refreshToken } from "./auth/refreshApi";

/**
 * API 클라이언트 클래스
 *
 * 애플리케이션의 모든 HTTP 요청을 처리하는 중앙화된 API 클라이언트입니다.
 * Axios를 기반으로 하며 인증, 에러 처리, 응답 변환, 토큰 자동 갱신을 처리합니다.
 */
class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  /**
   * API 클라이언트 생성자
   *
   * @param baseURL - API의 기본 URL (기본값: 환경변수 또는 localhost)
   */
  constructor(baseURL = import.meta.env.VITE_API_BASE_URL) {
    const finalBaseURL = baseURL || "http://localhost:8080";

    this.instance = axios.create({
      baseURL: `${finalBaseURL}`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // 쿠키 포함
    });

    this.setupInterceptors();
  }

  /**
   * 대기 중인 요청들을 처리하는 헬퍼 함수
   */
  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * 토큰 갱신 요청
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      console.log("🔄 토큰 갱신 시도...");

      const newToken = await refreshToken();

      if (newToken) {
        console.log("✅ 새로운 토큰 받음:", newToken.substring(0, 20) + "...");
        return newToken;
      } else {
        console.error("❌ 토큰 갱신 실패 - 토큰이 null입니다");
        throw new Error("No access token received");
      }
    } catch (error) {
      console.error("❌ 토큰 갱신 실패:", error);
      throw error;
    }
  }

  /**
   * Axios 인터셉터 설정
   */
  private setupInterceptors() {
    // Request interceptor - 토큰 자동 추가
    this.instance.interceptors.request.use(
      (config) => {
        try {
          let accessToken = null;
          try {
            const state = useAuthStore.getState();
            accessToken = state.accessToken;
          } catch (storeError) {
            console.warn(
              "Failed to get token from store, trying sessionStorage:",
              storeError
            );
            // fallback: sessionStorage에서 직접 가져오기
            const authStorage = sessionStorage.getItem("auth-storage");
            if (authStorage) {
              const parsed = JSON.parse(authStorage);
              accessToken = parsed.state?.accessToken;
            }
          }

          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        } catch (error) {
          console.error("Error getting access token:", error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - 에러 변환 및 토큰 자동 갱신
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiSuccessResponse<unknown>>) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // 401 에러이고 토큰 갱신 요청이 아닌 경우 자동 갱신 시도
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes("/api/auth/refresh") &&
          !originalRequest.url?.includes("/api/auth/logout")
        ) {
          console.log("🔑 401 에러 감지 - 토큰 갱신 시도");

          if (this.isRefreshing) {
            // 이미 토큰 갱신 중이면 대기열에 추가
            console.log("⏳ 토큰 갱신 중... 대기열에 추가");
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.instance(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);

            // 원래 요청에 새 토큰 적용하고 재시도
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            console.log("🔄 원래 요청 재시도");
            return this.instance(originalRequest);
          } catch (refreshError) {
            console.error("❌ 토큰 갱신 실패 - 로그아웃 처리");
            this.processQueue(refreshError, null);

            // 토큰 갱신 실패 시 로그아웃 처리
            const { clear } = useAuthStore.getState();
            clear();

            // 로그인 페이지로 리다이렉트
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }

            throw new ApiError(error);
          } finally {
            this.isRefreshing = false;
          }
        }

        if (error.isAxiosError) {
          throw new ApiError(error);
        }
        throw error;
      }
    );
  }

  /**
   * GET 요청 수행
   */
  async get<T>(url: string, params?: object): Promise<T> {
    const response = await this.instance.get(url, {
      params,
    });
    return response.data.data ?? response.data;
  }

  /**
   * POST 요청 수행
   */
  async post<T>(url: string, data?: object): Promise<T> {
    const response = await this.instance.post<ApiSuccessResponse<T>>(url, data);
    return response.data.data;
  }

  /**
   * PUT 요청 수행
   */
  async put<T>(url: string, data?: object): Promise<T> {
    const response = await this.instance.put<ApiSuccessResponse<T>>(url, data);
    return response.data.data;
  }

  /**
   * DELETE 요청 수행
   */
  async delete<T>(url: string): Promise<T> {
    const response = await this.instance.delete<ApiSuccessResponse<T>>(url);
    return response.data.data;
  }

  /**
   * Axios 인스턴스에 직접 접근 (헤더 정보가 필요한 경우 사용)
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

/**
 * 전역 API 클라이언트 인스턴스
 */
export const apiClient = new ApiClient();
