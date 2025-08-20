import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DifficultyFilter from "@/components/filters/DifficultyFilter";
import GenreFilter from "@/components/filters/GenreFilter";
import SearchFilter from "@/components/filters/SearchFilter";
import type { ProblemSearchParams } from "@/types/problem/search";
import type { Problem } from "@/types/problem/problem";
import { apiClient } from "@/services/api/apiClient";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

interface ExistingProblemListProps {
  onSelect: (problemId: string) => void;
}

const ExistingProblemList = ({ onSelect }: ExistingProblemListProps) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filters, setFilters] = useState({
    searchQuery: "",
    difficulties: [] as ("EASY" | "NORMAL" | "HARD")[],
    genres: [] as string[],
    source: "" as "" | "CUSTOM" | "ORIGINAL",
  });
  const [loading, setLoading] = useState(false);

  const fetchAllProblems = async (filterParams: typeof filters) => {
    try {
      setLoading(true);
      let allProblems: Problem[] = [];
      let cursor: number | null = null;
      let hasNext = true;
      let requestCount = 0;
      const maxRequests = 10; // 무한 루프 방지

      while (hasNext && requestCount < maxRequests) {
        requestCount++;

        const params: ProblemSearchParams = {
          size: 50,
          cursor: cursor ?? undefined,
          keyword: filterParams.searchQuery || undefined,
          difficulty:
            filterParams.difficulties.length === 1
              ? filterParams.difficulties[0]
              : undefined,
          genre:
            filterParams.genres.length > 0
              ? filterParams.genres.join(",")
              : undefined,
          source: filterParams.source || undefined,
        };

        try {
          const data = await apiClient.get<{
            problemList: Problem[];
            nextCursor: number | null;
            hasNext: boolean;
          }>("/problems/search", params);

          if (data.problemList && Array.isArray(data.problemList)) {
            allProblems = [...allProblems, ...data.problemList];
          }

          cursor = data.nextCursor;
          hasNext = data.hasNext && data.hasNext === true;

          // 데이터가 없으면 루프 종료
          if (!data.problemList || data.problemList.length === 0) {
            hasNext = false;
          }
        } catch (apiError) {
          console.error(`API 요청 #${requestCount} 실패:`, apiError);
          hasNext = false;
          break;
        }
      }

      setProblems(allProblems);
    } catch (err) {
      console.error("문제 목록 불러오기 실패:", err);
      setProblems([]); // 에러 시 빈 배열로 설정
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProblems(filters);
  }, [filters]);

  const handleProblemClick = (problemId: string) => {
    track("problem_searched", {
      search_query: filters.searchQuery || "",
      genre_filters: filters.genres,
      difficulty_filter:
        filters.difficulties.length === 1
          ? filters.difficulties[0].toLowerCase()
          : "all",
      results_count: problems.length,
      selected_problem_id: problemId,
      timestamp: getKoreanTimestamp(),
    });

    onSelect(problemId);
  };

  return (
    <div className="w-1/2 border-r pr-4 overflow-y-auto space-y-4">
      <SearchFilter
        searchQuery={filters.searchQuery}
        onSearchChange={(query) =>
          setFilters((prev) => ({ ...prev, searchQuery: query }))
        }
        placeholder="사건 검색"
      />

      <div className="flex gap-2 items-center flex-wrap">
        <DifficultyFilter
          selectedDifficulties={filters.difficulties}
          onDifficultyChange={(d) =>
            setFilters((prev) => ({ ...prev, difficulties: d }))
          }
        />
        <GenreFilter
          selectedGenres={filters.genres}
          onGenreChange={(g) => setFilters((prev) => ({ ...prev, genres: g }))}
        />
        <select
          value={filters.source}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              source: e.target.value as "CUSTOM" | "ORIGINAL" | "",
            }))
          }
          className="text-xs h-8 border rounded px-2"
        >
          <option value="">전체</option>
          <option value="CUSTOM">창작</option>
          <option value="ORIGINAL">기본</option>
        </select>
        {(filters.searchQuery ||
          filters.difficulties.length > 0 ||
          filters.genres.length > 0 ||
          filters.source) && (
          <Button
            variant="ghost"
            className="text-xs h-8 hover:bg-point-200/50"
            onClick={() =>
              setFilters({
                searchQuery: "",
                difficulties: [],
                genres: [],
                source: "",
              })
            }
          >
            전체 해제
          </Button>
        )}
      </div>

      <ScrollArea className="space-y-2">
        {problems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-ownglyph">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">조건에 맞는 사건이 없습니다</p>
          </div>
        ) : (
          problems.map((problem) => (
            <div
              key={problem.problemId}
              className="p-3 border rounded cursor-pointer hover:bg-point-200/50"
              onClick={() => handleProblemClick(problem.problemId)}
            >
              <div className="flex justify-between items-start mb-1">
                <p className="font-bold text-xl font-ownglyph">
                  {problem.title}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>👍 {problem.likes}</span>
                </div>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{problem.difficulty}</span>
                <span>/</span>
                <span>{problem.genres.join(", ")}</span>
                <span>/</span>
                <span>작성자: {problem.creator.nickname}</span>
              </div>
              <div className="flex gap-1 mt-2">
                {problem.genres.map((genre, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs px-1 py-0"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </ScrollArea>

      {loading && (
        <p className="text-center text-gray-400 text-sm py-2">불러오는 중...</p>
      )}
    </div>
  );
};

export default ExistingProblemList;
