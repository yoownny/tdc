import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { Link } from "react-router-dom";
import profile from "@/assets/TDC_image.svg";
import { apiClient } from "@/services/api/apiClient";
import type { User } from "@/types/auth";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const ProfileCard = () => {
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    const userId = authUser?.userId;

    if (!userId || userId <= 0) {
      setError("유효하지 않은 사용자 ID입니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userData = await apiClient.get<User>(`/users/${userId}`);
      setUser(userData);

      track("profile_loaded", {
        user_id: userId,
        total_games: userData.totalGames,
        wins: userData.wins,
        timestamp: getKoreanTimestamp(),
      });
    } catch (err) {
      track("profile_load_failed", {
        user_id: userId,
        error_reason: err instanceof Error ? err.message : "unknown",
        timestamp: getKoreanTimestamp(),
      });

      console.error("프로필 조회 실패:", err);
      setError("프로필 정보를 불러오는데 실패했습니다.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    track("page_viewed", {
      page_name: "profile",
      previous_page: document.referrer
        ? new URL(document.referrer).pathname
        : "direct",
      session_page_count: 1, // 세션 페이지 카운트로 교체 필요
      load_time_ms: 0, // 실제 로드 시간으로 교체 필요
      timestamp: getKoreanTimestamp(),
    });

    fetchUserProfile();
  }, [authUser?.userId]);

  if (!authUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Alert className="mb-4 max-w-md">
          <AlertDescription>로그인이 필요합니다.</AlertDescription>
        </Alert>
        <Link to="/login">
          <Button variant="default">로그인 페이지로 이동</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray">프로필을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Alert className="mb-4 max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button
            onClick={() => {
              track("profile_retry_clicked", {
                timestamp: getKoreanTimestamp(),
              });
              fetchUserProfile();
            }}
            variant="outline"
          >
            다시 시도
          </Button>
          <Link to="/lobby">
            <Button variant="default">로비로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 사용자 데이터가 없는 경우
  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center mb-4 text-gray">
          프로필 정보를 찾을 수 없습니다.
        </div>
        <Link to="/lobby">
          <Button variant="default">로비로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  // 승률
  const winRate =
    user.totalGames > 0
      ? ((user.wins / user.totalGames) * 100).toFixed(1)
      : "0.0";

  const joinDate = new Date(user.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="h-full flex">
      {/* 왼쪽 프로필 이미지 및 기본 정보 */}
      <div className="flex-1 flex flex-col items-center justify-center border-r border-gray/20 pr-8">
        <div className="text-center">
          <img src={profile} alt="프로필" className="w-50 h-50 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray font-ownglyph mb-2">
            {user.nickname ||
              authUser.nickname ||
              "닉네임을 불러올 수 없습니다."}
          </h2>
          <p className="text-gray/60 text-lg pt-5">
            {joinDate}부터 함께하셨습니다.
          </p>
        </div>
      </div>

      {/* 오른쪽 상세 통계 */}
      <div className="flex-1 flex flex-col justify-center pl-8">
        <h3 className="text-4xl font-bold text-gray font-ownglyph mb-8">
          게임 통계
        </h3>

        <div className="space-y-8">
          <div className="flex items-center justify-between p-6 bg-gray/5 rounded-xl border border-gray/10">
            <div>
              <h4 className="text-sm font-medium text-gray/60 mb-1">
                참여한 사건
              </h4>
              <p className="text-3xl font-bold text-gray">
                {user.totalGames}건
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-gray/5 rounded-xl border border-gray/10">
            <div>
              <h4 className="text-sm font-medium text-gray/60 mb-1 ">
                해결한 사건
              </h4>
              <p className="text-3xl font-bold text-gray ">{user.wins}건</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-gray/5 rounded-xl border border-gray/10">
            <div>
              <h4 className="text-sm font-medium text-gray/60 mb-1">승률</h4>
              <p className="text-3xl font-bold text-gray">{winRate}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
