import { Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { openConnect } from "@/websocket/webSocketConnection";
import useUserStore from "@/stores/userStore";
import BaseLayout from "@/layouts/BaseLayout";
import { useAuthStore } from "@/stores/authStore";

// Lazy-loaded pages
const IndexPage = lazy(() => import("@/pages/index"));
const RoomPage = lazy(() => import("@/pages/room"));
const LobbyPage = lazy(() => import("@/pages/lobby"));
const LoginPage = lazy(() => import("@/pages/login"));
const SignupPage = lazy(() => import("@/pages/signup"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const RankingPage = lazy(() => import("@/pages/ranking"));
const UserRankingPage = lazy(() => import("@/pages/userRanking"));
const TutorialPage = lazy(() => import("@/pages/tutorial"));
const TodayPage = lazy(() =>  import("@/pages/today"));

function Router() {
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const token = useAuthStore((s) => s.accessToken);


  useEffect(() => {
    if (hydrated && token) {
      useUserStore.getState().setUserFromStorage();
      openConnect(); // 앱 시작 시 WebSocket 연결 시도
    }
  }, [hydrated, token]);

  // 보호된 라우트 정의
  const protectedRoutes = [
    { path: "/lobby", element: <LobbyPage />, showHeader: true },
    { path: "/room/:id", element: <RoomPage />, showHeader: false },
    { path: "/profile", element: <ProfilePage />, showHeader: true },
    { path: "/users/:userId", element: <ProfilePage />, showHeader: true },
    { path: "/rankings", element: <RankingPage />, showHeader: true },
    { path: "/rankings/users", element: <UserRankingPage />, showHeader: true },
    { path: "/tutorial", element: <TutorialPage />, showHeader: true },
    { path: "/today", element: <TodayPage />, showHeader: true },
  ];

  // 공개 라우트 정의 (index는 BaseLayout 적용 안함)
  const publicRoutes = [
    { path: "/login", element: <LoginPage />, showHeader: false },
    { path: "/signup", element: <SignupPage />, showHeader: false },
  ];

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        </div>
      }
    >
      <Routes>
        {/* Index 페이지 (BaseLayout 적용 안함) */}
        <Route path="/" element={<IndexPage />} />

        {/* 공개 라우트 */}
        {publicRoutes.map(({ path, element, showHeader }) => (
          <Route
            key={path}
            path={path}
            element={<BaseLayout showHeader={showHeader}>{element}</BaseLayout>}
          />
        ))}

        {/* 보호된 라우트 */}
        {protectedRoutes.map(({ path, element, showHeader }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <BaseLayout showHeader={showHeader}>{element}</BaseLayout>
              </ProtectedRoute>
            }
          />
        ))}

        {/* Fallback */}
        <Route
          path="*"
          element={
            <BaseLayout showHeader={false}>
              <NotFoundPage />
            </BaseLayout>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default Router;
