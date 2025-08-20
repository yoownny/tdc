import { useEffect, useState } from "react";
import { apiClient } from "@/services/api/apiClient";
import type { ProblemRank, RankingResponse } from "@/types/problem/ranking";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/shadcn/utils";
import TDC_image from "@/assets/TDC_image.svg";
import { useNavigate } from "react-router-dom";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

interface RealTimeRankingProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const RealTimeRanking = ({
  limit = 10,
  autoRefresh = true,
  refreshInterval = 30000,
}: RealTimeRankingProps) => {
  const [ranks, setRanks] = useState<ProblemRank[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const navigate = useNavigate();

  const fetchRanking = async () => {
    // 초기 로딩이 아닌 경우만 새로고침 추적
    if (!loading) {
      track("ranking_refreshed", {
        refresh_method: "manual_button",
        current_rankings_count: ranks.length,
        timestamp: getKoreanTimestamp(),
      });
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<RankingResponse>(`/rankings`, {
        limit,
      });

      setRanks(response.ranking);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("랭킹 조회 실패:", err);
      setError("랭킹 정보를 불러오는데 실패했습니다.");
      setRanks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProblemClick = (problemId: number) => {
    console.log(`문제 ${problemId}번 클릭 - 로비로 이동`);
    navigate("/lobby");
  };

  useEffect(() => {
    fetchRanking();

    if (autoRefresh) {
      const interval = setInterval(fetchRanking, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getRankColor = (rank: number) => {
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

  if (loading && ranks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-gray"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-gray-500" size={20} />
          </div>
        </div>
        <h3 className="text-lg font-medium mb-2 font-ownglyph">
          랭킹을 불러오는 중...
        </h3>
        <p className="text-sm text-white/50 text-center font-ownglyph">
          최고의 문제를 찾고 있습니다
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
          onClick={fetchRanking}
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
        <img src={TDC_image} alt="TDC_image" className="w-40 h-40" />
        <h3 className="text-2xl font-medium mb-3 font-ownglyph">
          아직 랭킹이 없습니다
        </h3>
        <p className="text-lg text-center text-gray mb-6 max-w-md font-ownglyph">
          첫 번째 탐정이 되어 랭킹에 도전해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* 헤더*/}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <button
          onClick={fetchRanking}
          disabled={loading}
          className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/20 text-gray hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg flex items-center gap-2 font-ownglyph"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "업데이트 중..." : "새로고침"}
        </button>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray/60">
            마지막 업데이트: {lastUpdated.toLocaleTimeString("ko-KR")}
          </div>
        </div>
      </div>

      {/* 랭킹 리스트  */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent hover:scrollbar-thumb-blue-300">
        <div className="space-y-3 pb-4">
          {ranks.map((rank) => (
            <div
              key={`${rank.problemId}-${rank.rank}`}
              onClick={() => handleProblemClick(rank.problemId)}
              className={cn(
                "flex items-center p-4 rounded-lg border transition-all duration-200 hover:shadow-md bg-white/5 backdrop-blur-sm border-white/10 cursor-pointer",
                getRankColor(rank.rank)
              )}
            >
              {/* 순위 */}
              <div className="flex items-center justify-center w-12 h-12 mr-4">
                <span
                  className={cn(
                    "text-lg font-bold text-gray",
                    rank.rank === 1
                      ? "text-yellow-400"
                      : rank.rank === 2
                      ? "text-gray-300"
                      : rank.rank === 3
                      ? "text-amber-500"
                      : "text-gray/60"
                  )}
                >
                  {rank.rank}
                </span>
              </div>

              {/* 문제 정보 */}
              <div className="flex-1">
                <div className="font-semibold text-2xl text-gray font-ownglyph">
                  {rank.title || `문제 #${rank.problemId}`}
                </div>
                <div className="text-sm text-gray/60 font-ownglyph">
                  문제 #{rank.problemId}
                </div>
              </div>

              {/* 통계 정보 */}
              <div className="text-right">
                <div className="text-xl font-bold text-gray font-ownglyph">
                  {rank.playCount?.toLocaleString() || 0}회 플레이
                </div>
                <div className="text-sm text-gray/60 font-ownglyph">
                  좋아요 {rank.likes?.toLocaleString() || 0}개
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealTimeRanking;
