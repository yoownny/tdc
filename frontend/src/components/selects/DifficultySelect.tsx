import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FILTER_OPTIONS } from "@/constants/filterOptions";

interface DifficultySelectProps {
  value?: string;
  onValueChange?: (value: 'EASY' | 'NORMAL' | 'HARD') => void;
  placeholder?: string;
}

const DifficultySelect = ({ 
  value, 
  onValueChange, 
  placeholder = "난이도" 
}: DifficultySelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {FILTER_OPTIONS.difficulties.map((difficulty, index) => (
          <SelectItem key={index} value={difficulty.value}>
            {difficulty.icon} {difficulty.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DifficultySelect;
