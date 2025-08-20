import type { ProblemRank } from "@/types/problem/ranking";

interface RankingDetailProps {
  ranking: ProblemRank;
}

const RankingDetail = ({ ranking }: RankingDetailProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold text-[#94BD8C]">
            {ranking.rank}위
          </span>
          <h2 className="text-lg font-semibold text-gray-800 flex-1">
            {ranking.title}
          </h2>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">좋아요</span>
          <div className="flex items-center gap-1">
            <span>👍</span>
            <span className="font-medium">{ranking.likes}</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">플레이 수</span>
          <div className="flex items-center gap-1">
            <span>▶️</span>
            <span className="font-medium">{ranking.playCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingDetail;
