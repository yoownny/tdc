import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/services/api/apiClient";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { cn } from "@/lib/shadcn/utils";
import TDC_image from "@/assets/TDC_image.svg";
import { track } from "@amplitude/analytics-browser";
import type { UserRank, UserRankingResponse } from "@/types/user";

const getRowStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-yellow-400/30";
    case 2:
      return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30";
    case 3:
      return "bg-gradient-to-r from-amber-400/20 to-amber-500/20 border-amber-400/30";
    default:
      return "bg-white/5 border-white/10";
  }
};

export default function UserRanking({
  limit = 10,
  autoRefresh = true,
  refreshInterval = 60_000,
}: {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  const [ranks, setRanks] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchUserRanking = async (source: "manual" | "auto" = "manual") => {
    if (source === "manual" && !loading) {
      track("user_ranking_refreshed", {
        refresh_method: "manual_button",
        current_user_count: ranks.length,
        ts: new Date().toISOString(),
      });
    }
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<UserRankingResponse>("/rankings/users", {
        limit,
      });

      const payload: any =
        (res as any)?.data?.data ?? (res as any)?.data ?? (res as any);

      const raw: UserRank[] = payload?.ranking ?? [];
      const updatedISO: string | undefined = payload?.lastUpdated;

      const computed = raw
        .sort(
          (a: UserRank, b: UserRank) => (b.totalGame ?? 0) - (a.totalGame ?? 0)
        )
        .map((u, i) => ({ ...u, rank: i + 1 }))
        .slice(0, limit);

      setRanks(computed);
      setLastUpdated(updatedISO ? new Date(updatedISO) : new Date());
    } catch (e: any) {
      console.error("유저 랭킹 조회 실패:", e);
      const serverMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        null;
      setError(
        serverMsg
          ? `유저 랭킹을 불러오는데 실패했습니다: ${serverMsg}`
          : "유저 랭킹을 불러오는데 실패했습니다."
      );
      setRanks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRanking("auto");
    if (autoRefresh) {
      const id = setInterval(() => fetchUserRanking("auto"), refreshInterval);
      return () => clearInterval(id);
    }
  }, [autoRefresh, refreshInterval, limit]);

  const best = useMemo(() => ranks[0], [ranks]);

  if (loading && ranks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-gray" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-gray-500" size={20} />
          </div>
        </div>
        <h3 className="text-lg font-medium mb-2 font-ownglyph">
          유저 랭킹 불러오는 중...
        </h3>
        <p className="text-sm text-white/50 text-center font-ownglyph">
          누가 가장 많이 플레이했는지 확인 중
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray">
        <h3 className="text-lg font-medium mb-2 font-ownglyph">
          오류가 발생했습니다
        </h3>
        <p className="text-gray/60 mb-4 font-ownglyph">{error}</p>
        <button
          onClick={() => fetchUserRanking("manual")}
          className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/20 text-gray hover:bg-white/10 transition-colors rounded-lg font-ownglyph"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!loading && !error && ranks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray">
        <img src={TDC_image} alt="no user ranking" className="w-40 h-40" />
        <h3 className="text-2xl font-medium mb-3 font-ownglyph">
          아직 유저 랭킹이 없습니다
        </h3>
        <p className="text-lg text-center text-gray mb-6 max-w-md font-ownglyph">
          첫 번째 탐정이 되어 기록을 남겨보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <button
          onClick={() => fetchUserRanking("manual")}
          disabled={loading}
          className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/20 text-gray hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg flex items-center gap-2 font-ownglyph"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "업데이트 중..." : "새로고침"}
        </button>

        <div className="flex items-center gap-4">
          {best && (
            <div className="hidden md:flex items-center gap-2 text-sm text-gray/80 font-ownglyph px-3 py-1 rounded-lg bg-white/5 border border-white/10"></div>
          )}
          <div className="text-sm text-gray/60">
            마지막 업데이트 :
            {new Date().toLocaleTimeString("ko-KR", { hour12: true })}
          </div>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent hover:scrollbar-thumb-blue-300">
        <div className="space-y-3 pb-4">
          {ranks.map((u) => (
            <div
              key={`${u.nickname}-${u.rank}`}
              className={cn(
                "flex items-center p-4 rounded-lg border transition-all duration-200 hover:shadow-md bg-white/5 backdrop-blur-sm border-white/10",
                getRowStyle(u.rank ?? 999)
              )}
            >
              {/* 순위 */}
              <div className="flex items-center justify-center w-12 h-12 mr-4">
                <span
                  className={cn(
                    "text-lg font-bold",
                    (u.rank ?? 0) === 1
                      ? "text-yellow-400"
                      : (u.rank ?? 0) === 2
                      ? "text-gray-300"
                      : (u.rank ?? 0) === 3
                      ? "text-amber-500"
                      : "text-gray/60"
                  )}
                >
                  {u.rank}
                </span>
              </div>

              {/* 유저 정보 */}
              <div className="flex-1">
                <div className="font-semibold text-2xl text-gray font-ownglyph">
                  {u.nickname}
                </div>
                <div className="text-sm text-gray/60 font-ownglyph">
                  플레이어
                </div>
              </div>

              {/* 통계 */}
              <div className="text-right">
                <div className="text-xl font-bold text-gray font-ownglyph">
                  {u.totalGame.toLocaleString()}회 플레이
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
