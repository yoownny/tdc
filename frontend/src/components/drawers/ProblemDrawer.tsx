import { useState } from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ExistingProblemList from "../problem/ExistingProblemList";
import ProblemDetail from "../problem/ProblemDetail";
import CustomProblemForm from "../problem/CustomProblemForm";
import type { Problem, SelectedProblem } from "@/types/problem/problem";
import { apiClient } from "@/services/api/apiClient";
import { X } from "lucide-react";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

interface ProblemDrawerProps {
  onProblemSelect: (problem: SelectedProblem) => void;
  triggerText?: string;
  triggerVariant?:
    | "default"
    | "outline"
    | "ghost"
    | "destructive"
    | "secondary";
  triggerClassName?: string;
  dialogTitle?: string;
}

const ProblemDrawer = ({
  onProblemSelect,
  triggerText = "사건 선택하기",
  triggerVariant = "outline",
  triggerClassName = "",
  dialogTitle = "사건 선택하기",
}: ProblemDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  const handleSelect = async (problemId: string) => {
    // 🎯 문제 검색/선택 추적
    track("problem_selected", {
      problem_type: "existing",
      problem_id: problemId,
      selection_method: "browse",
      timestamp: getKoreanTimestamp(),
    });

    try {
      const data = await apiClient.get<Problem>(`/problems/${problemId}`);
      setSelectedProblem(data);
    } catch (err) {
      track("problem_selection_failed", {
        problem_id: problemId,
        error_reason: "api_error",
        timestamp: getKoreanTimestamp(),
      });
      console.error("문제 상세 조회 실패:", err);
    }
  };

  const handleConfirmExistingSelection = () => {
    if (!selectedProblem) return;

    // 🎯 문제 확정 선택 추적
    track("problem_confirmed", {
      problem_type: "existing",
      problem_id: selectedProblem.problemId,
      problem_difficulty: selectedProblem.difficulty?.toLowerCase(),
      problem_genres: selectedProblem.genres,
      timestamp: getKoreanTimestamp(),
    });

    onProblemSelect({
      ...selectedProblem,
      problemType: "ORIGINAL",
    });
    setIsOpen(false);
    setSelectedProblem(null);
  };

  const handleCustomSubmit = (customData: SelectedProblem) => {
    onProblemSelect(customData);
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant={triggerVariant}
          className={`${triggerClassName} hover:bg-point-200/50`}
        >
          {triggerText}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[80vh] px-0 sm:px-6 flex flex-col">
        <DrawerHeader className="flex flex-row items-center justify-between pb-2 shrink-0 px-6">
          <DrawerTitle className="text-xl">{dialogTitle}</DrawerTitle>
          <DrawerClose>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-point-200/50 transition-colors duration-200"
            >
              <X size={50} />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 min-h-0 flex flex-col px-6">
          <Tabs defaultValue="ORIGINAL" className="flex-1 min-h-0 flex flex-col w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 shrink-0">
              <TabsTrigger value="ORIGINAL">기존 사건</TabsTrigger>
              <TabsTrigger value="CUSTOM">새로운 사건</TabsTrigger>
            </TabsList>

            {/* 기존 사건 탭 */}
            <TabsContent value="ORIGINAL" className="flex-1 min-h-0 overflow-hidden">
              <div className="flex h-full gap-4">
                <ExistingProblemList onSelect={handleSelect} />
                <ProblemDetail
                  problem={selectedProblem}
                  onConfirm={handleConfirmExistingSelection}
                />
              </div>
            </TabsContent>

            {/* 새로운 사건 탭 */}
            <TabsContent value="CUSTOM" className="flex-1 min-h-0 overflow-hidden">
              <CustomProblemForm onSubmit={handleCustomSubmit} />
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ProblemDrawer;
