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

interface DifficultyFilterProps {
  selectedDifficulties: FilterState["difficulties"];
  onDifficultyChange: (difficulties: FilterState["difficulties"]) => void;
}

const DifficultyFilter = ({
  selectedDifficulties,
  onDifficultyChange,
}: DifficultyFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckboxChange = (
    difficulty: "EASY" | "NORMAL" | "HARD",
    checked: boolean
  ) => {
    if (checked) {
      onDifficultyChange([...selectedDifficulties, difficulty]);
    } else {
      onDifficultyChange(selectedDifficulties.filter((d) => d !== difficulty));
    }
  };

  const getButtonText = () => {
    if (selectedDifficulties.length === 0) return "난이도";

    if (selectedDifficulties.length === 1) {
      const difficulty = FILTER_OPTIONS.difficulties.find(
        (d) => d.value === selectedDifficulties[0]
      );
      return `${difficulty?.icon} ${difficulty?.label}`;
    }
    return `난이도 (${selectedDifficulties.length})`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-between hover:bg-point-200/50
            ${
              selectedDifficulties.length > 0
                ? "border-blue-500 bg-blue-50"
                : ""
            }`}
        >
          {getButtonText()}
          <span className="ml-2">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-2">
          <div className="grid grid-cols-1 gap-3">
            {FILTER_OPTIONS.difficulties.map((difficulty) => (
              <div
                key={difficulty.value}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={`difficulty-${difficulty.value}`}
                  checked={selectedDifficulties.includes(difficulty.value)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(difficulty.value, checked as boolean)
                  }
                />
                <label
                  htmlFor={`difficulty-${difficulty.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {difficulty.icon} {difficulty.label}
                </label>
              </div>
            ))}
          </div>
          {selectedDifficulties.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDifficultyChange([])}
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

export default DifficultyFilter;
