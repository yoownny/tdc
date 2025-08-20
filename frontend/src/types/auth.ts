export interface User {
  // = LoginResponse
  userId: number;
  socialId: string;
  provider: "google" | "guest";
  nickname: string;
  createdAt: string;
  totalGames: number;
  wins: number;
  deleted: boolean;
  role: "USER" | "ADMIN";
  expiresAt?: string | null;
  expired?: boolean;
  guest?: boolean;
}

export interface LoginRequest {
  provider: "google" | "guest";
  socialId: string;
}

export interface LoginResponse {
  // = User
  userId: number;
  socialId: string;
  provider: "google" | "guest";
  nickname: string;
  createdAt: string;
  totalGames: number;
  wins: number;
  deleted: boolean;
  role: "USER" | "ADMIN";
  expiresAt?: string | null;
  expired?: boolean;
  guest?: boolean;
}

export interface MigrationRequest {
  guestUserId: number;
  socialId: string;
  newNickname: string;
}

// Google OAuth 관련 타입 정의
export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}

export interface GoogleTokenClient {
  requestAccessToken: () => void;
}

// 게스트 여부 확인 헬퍼 함수
export const isGuestUser = (user: User | null): boolean => {
  return user?.provider === "guest" || user?.guest === true;
};

// 만료된 게스트 확인 헬퍼 함수
export const isExpiredGuest = (user: User | null): boolean => {
  if (!isGuestUser(user)) return false;
  return user?.expired === true;
};

// 게스트 만료 임박 확인 헬퍼 함수 (2시간 전)
export const isGuestExpiringSoon = (user: User | null): boolean => {
  if (!isGuestUser(user) || !user?.expiresAt) return false;

  const expiresAt = new Date(user.expiresAt);
  const now = new Date();
  const twoHoursInMs = 2 * 60 * 60 * 1000; // 2시간

  // 만료 시간까지 2시간 이하 남았으면 true
  return (
    expiresAt.getTime() - now.getTime() <= twoHoursInMs &&
    expiresAt.getTime() - now.getTime() > 0
  );
};

// 구글 API 전역 타입 확장
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}
