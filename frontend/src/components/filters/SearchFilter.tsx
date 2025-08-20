// 검색어를 입력하면 해당 키워드가 포함된 내용을 반환하는 필터입니다.

import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

const SearchFilter = ({
  searchQuery,
  onSearchChange,
  placeholder = "사건 검색...",
}: SearchFilterProps) => {
  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="bg-white text-black placeholder-gray-400 border-border rounded-md px-3 py-1"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSearchChange("")}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 focus:outline-none focus:ring-0 hover:bg-point-200/50"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default SearchFilter;
