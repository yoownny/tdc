import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ExistingProblemList from "@/components/problem/ExistingProblemList";
import ProblemDetail from "@/components/problem/ProblemDetail";
import CustomProblemForm from "@/components/problem/CustomProblemForm";
import type { Problem, SelectedProblem } from "@/types/problem/problem";
import { apiClient } from "@/services/api/apiClient";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

interface ProblemDialogProps {
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

const ProblemDialog = ({
  onProblemSelect,
  triggerText = "사건 선택하기",
  triggerVariant = "outline",
  triggerClassName = "",
  dialogTitle = "사건 선택하기",
}: ProblemDialogProps) => {
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className={`${triggerClassName} hover:bg-point-200/50`}
        >
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="px-6 py-4">
        <DialogHeader className="flex flex-row justify-between text-center">
          <DialogTitle className="text-xl">{dialogTitle}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="ORIGINAL" className="mt-4 w-full h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ORIGINAL" className="hover:bg-point-200/50">
              기존 사건근
            </TabsTrigger>
            <TabsTrigger value="CUSTOM" className="hover:bg-point-200/50">
              새로운 사건
            </TabsTrigger>
          </TabsList>

          {/* 기존 사건 탭 */}
          <TabsContent value="ORIGINAL" className="h-full mt-4">
            <div className="flex h-full gap-4">
              <ExistingProblemList onSelect={handleSelect} />
              <ProblemDetail
                problem={selectedProblem}
                onConfirm={handleConfirmExistingSelection}
              />
            </div>
          </TabsContent>

          {/* 새로운 사건 탭 */}
          <TabsContent
            value="CUSTOM"
            className="pt-4 space-y-4 h-full overflow-y-auto"
          >
            <CustomProblemForm onSubmit={handleCustomSubmit} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProblemDialog;
