import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FILTER_OPTIONS } from "@/constants/filterOptions";

interface GenreSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  selectedGenres?: string[]; // 다른 Select에서 이미 선택된 장르들
  selectIndex?: number; // 몇 번째 Select인지 (0, 1, 2)
}

const GenreSelect = ({
  value,
  onValueChange,
  placeholder = "장르",
  selectedGenres = [],
  selectIndex = 0,
}: GenreSelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[120px] hover:bg-gray-100">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* 1번째는 필수 선택, 2번째&3번째는 필수 아님 */}
        {selectIndex > 0 && (
          <SelectItem value="none" className="hover:bg-gray-100">
            선택 안함
          </SelectItem>
        )}
        {FILTER_OPTIONS.genres.map((genre, index) => (
          <SelectItem
            key={index}
            value={genre.value}
            disabled={selectedGenres.includes(genre.value)} // 이미 선택된 장르는 비활성화
            className="hover:bg-gray-100"
          >
            {genre.value}
            {selectedGenres.includes(genre.value) && " (선택됨)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default GenreSelect;
