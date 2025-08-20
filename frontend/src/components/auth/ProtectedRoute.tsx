import { Navigate } from "react-router-dom";
import type { JSX } from "react/jsx-runtime";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "@/stores/authStore";

interface JwtPayload {
  exp?: number; // 토큰 만료 시간 (초 단위)
}

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { accessToken, clear } = useAuthStore();

  // authStore에서 토큰 가져오기, 없으면 sessionStorage에서 fallback
  let token = accessToken;

  if (!token) {
    try {
      const authStorage = sessionStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        token = parsed.state?.accessToken;
      }
    } catch (error) {
      console.error("Error parsing auth storage:", error);
    }
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    // Bearer 접두사 제거 (있다면)
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    const decoded = jwtDecode<JwtPayload>(cleanToken);

    // exp가 존재하고 현재 시간이 만료 시간 이후면 만료 처리
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      // 만료된 토큰 제거
      clear(); // authStore 정리
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.error("Invalid token:", error);
    // 잘못된 토큰 제거
    clear(); // authStore 정리
    return <Navigate to="/login" replace />;
  }

  return children;
}
