import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FILTER_OPTIONS } from "@/constants/filterOptions";
import type { FilterState } from "@/types/filter";

interface GenreFilterProps {
  selectedGenres: FilterState["genres"];
  onGenreChange: (genres: FilterState["genres"]) => void;
}

const GenreFilter = ({ selectedGenres, onGenreChange }: GenreFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckboxChange = (genre: string, checked: boolean) => {
    if (checked) {
      onGenreChange([...selectedGenres, genre]);
    } else {
      onGenreChange(selectedGenres.filter((g) => g !== genre));
    }
  };

  const getButtonText = () => {
    if (selectedGenres.length === 0) return "장르";
    if (selectedGenres.length === 1) return selectedGenres[0];
    return `장르 (${selectedGenres.length})`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-between hover:bg-point-200/50
          ${selectedGenres.length > 0 ? "border-purple-500 bg-purple-50" : ""}`}
        >
          {getButtonText()}
          <span className="ml-2">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
            {FILTER_OPTIONS.genres.map((genre) => (
              <div
                key={genre.value}
                className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <Checkbox
                  id={`genre-${genre.value}`}
                  checked={selectedGenres.includes(genre.value)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(genre.value, checked as boolean)
                  }
                />
                <label
                  htmlFor={`genre-${genre.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {genre.label}
                </label>
              </div>
            ))}
          </div>
          {selectedGenres.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGenreChange([])}
              className="w-full hover:bg-point-200/50"
            >
              선택 해제
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GenreFilter;
