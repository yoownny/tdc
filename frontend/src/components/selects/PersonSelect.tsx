import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PersonSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

// 방 만들기 - 최대 인원 선택
const PersonSelect = ({
  value,
  onValueChange,
  placeholder = "최대 인원",
  readOnly = false,
}: PersonSelectProps) => {
  const personOptions = [
    { value: "2", label: "2명" },
    { value: "3", label: "3명" },
    { value: "4", label: "4명" },
    { value: "5", label: "5명" },
    { value: "6", label: "6명" },
  ];
  return (
    <>
      <Select
        value={value}
        onValueChange={readOnly ? undefined : onValueChange}
        disabled={readOnly}
      >
        <SelectTrigger
          className={`w-[150px] hover:bg-point-200/50 ${
            readOnly ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
          }`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        {!readOnly && (
          <SelectContent>
            {personOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="hover:bg-point-200/50 !hover:bg-point-200/50"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        )}
      </Select>
    </>
  );
};

export default PersonSelect;
