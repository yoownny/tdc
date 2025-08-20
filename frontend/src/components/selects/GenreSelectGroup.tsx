// 3개의 장르 Select를 관리하는 그룹 컴포넌트입니다.
// 맨 앞 1개는 필수 선택, 이후 2개는 선택하지 않아도 동작합니다.

import { useState, useEffect, useCallback, useRef } from "react";
import GenreSelect from "../selects/GenreSelect";
// import { Badge } from "@/components/ui/badge";

interface GenreSelectionGroupProps {
  selectedGenres?: string[];
  onGenreChange?: (genres: string[]) => void;
  required?: boolean;
}

const GenreSelectionGroup = ({
  selectedGenres = ["", "", ""],
  onGenreChange,
  required = false,
}: GenreSelectionGroupProps) => {
  const [genres, setGenres] = useState<string[]>(selectedGenres);
  const prevGenresRef = useRef<string[]>([]);

  // 무한루프 방지: 이전 값과 비교하여 실제로 변경되었을 때만 호출
  useEffect(() => {
    const filteredGenres = genres.filter(
      (genre) => genre !== "" && genre !== "none"
    );
    const prevFiltered = prevGenresRef.current;

    // 배열 내용이 실제로 다를 때만 부모에게 알림
    const hasChanged =
      filteredGenres.length !== prevFiltered.length ||
      filteredGenres.some((genre, index) => genre !== prevFiltered[index]);

    if (hasChanged && onGenreChange) {
      prevGenresRef.current = filteredGenres;
      onGenreChange(filteredGenres);
    }
  }, [genres]); // onGenreChange를 의존성에서 제거

  // useCallback으로 함수 재생성 방지
  const handleGenreChange = useCallback((index: number, value: string) => {
    setGenres((prev) => {
      const newGenres = [...prev];
      newGenres[index] = value === "none" ? "" : value;
      return newGenres;
    });
  }, []);

  // 현재 선택된 모든 장르 목록 (중복 선택 방지용)
  const allSelectedGenres = genres.filter(
    (genre) => genre !== "" && genre !== "none"
  );

  // 필수 선택 조건 확인
  const hasRequiredSelection = allSelectedGenres.length > 0;

  return (
    <div>
      

      <div className="flex items-center gap-2">
        <GenreSelect
          value={genres[0]}
          onValueChange={(value) => handleGenreChange(0, value)}
          placeholder="장르 1"
          selectedGenres={allSelectedGenres.filter((_, idx) => idx !== 0)}
          selectIndex={0}
        />

        <GenreSelect
          value={genres[1]}
          onValueChange={(value) => handleGenreChange(1, value)}
          placeholder="장르 2"
          selectedGenres={allSelectedGenres.filter((_, idx) => idx !== 1)}
          selectIndex={1}
        />

        <GenreSelect
          value={genres[2]}
          onValueChange={(value) => handleGenreChange(2, value)}
          placeholder="장르 3"
          selectedGenres={allSelectedGenres.filter((_, idx) => idx !== 2)}
          selectIndex={2}
        />
      </div>

      {/* 선택된 장르들 표시 */}
      {/* {allSelectedGenres.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {allSelectedGenres.map((genre, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {genre}
            </Badge>
          ))}
        </div>
      )} */}

      {/* 검증 상태 표시 */}
      {required && (
        <div
          className={`text-xs ${
            hasRequiredSelection ? "text-gray-600" : "text-red-500"
          } font-ownglyph`}
        >
          
        </div>
      )}
    </div>
  );
};

export default GenreSelectionGroup;
