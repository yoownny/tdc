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

interface ProblemFilterProps {
  selectedProblemTypes: FilterState["problemTypes"];
  onProblemTypeChange: (problemTypes: FilterState["problemTypes"]) => void;
}

const ProblemFilter = ({
  selectedProblemTypes,
  onProblemTypeChange,
}: ProblemFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckboxChange = (
    problemType: "existing" | "custom",
    checked: boolean
  ) => {
    if (checked) {
      onProblemTypeChange([...selectedProblemTypes, problemType]);
    } else {
      onProblemTypeChange(
        selectedProblemTypes.filter((qt) => qt !== problemType)
      );
    }
  };

  const getButtonText = () => {
    if (selectedProblemTypes.length === 0) return "사건 유형";
    if (selectedProblemTypes.length === 1) {
      const problemType = FILTER_OPTIONS.problemTypes.find(
        (qt) => qt.value === selectedProblemTypes[0]
      );
      return problemType?.label;
    }
    return `사건 유형 (${selectedProblemTypes.length})`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-between ${
            selectedProblemTypes.length > 0
              ? "border-green-500 bg-green-50"
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
            {FILTER_OPTIONS.problemTypes.map((problemType) => (
              <div
                key={problemType.value}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={`problem-type-${problemType.value}`}
                  checked={selectedProblemTypes.includes(problemType.value)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(problemType.value, checked as boolean)
                  }
                />
                <label
                  htmlFor={`problem-type-${problemType.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {problemType.label}
                </label>
              </div>
            ))}
          </div>
          {selectedProblemTypes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onProblemTypeChange([])}
              className="w-full"
            >
              선택 해제
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProblemFilter;
