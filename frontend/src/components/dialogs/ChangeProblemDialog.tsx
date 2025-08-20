import { useMemo } from "react";
import ProblemDialog from "./ProblemDialog";
import type { SelectedProblem } from "@/types/problem/problem";
import useProblemStore from "@/stores/problemStore";
import { sendChangeProblem } from "@/websocket/sender";

const ChangeProblemDialog = () => {
  // problemStore 정보 스냅샷
  const currentProblemId = useProblemStore((s) => s.problemId);
  const currentTitle = useProblemStore((s) => s.title);
  const currentContent = useProblemStore((s) => s.content);
  const currentAnswer = useProblemStore((s) => s.answer);
  const currentDifficulty = useProblemStore((s) => s.difficulty);
  const currentGenres = useProblemStore((s) => s.genres);
  const currentCreatedBy = useProblemStore((s) => s.createdBy);
  const currentProblemType = useProblemStore((s) => s.problemType);

  // 기존 문제 (Store에서 가져오기)
  const originProblem = useMemo<SelectedProblem | null>(() => {
    if (!currentProblemId) return null;
    return {
      problemId: currentProblemId,
      title: currentTitle,
      content: currentContent,
      answer: currentAnswer,
      difficulty: currentDifficulty,
      genres: currentGenres,
      createdBy: currentCreatedBy,
      problemType: currentProblemType,
    };
  }, [
    currentProblemId,
    currentTitle,
    currentContent,
    currentAnswer,
    currentDifficulty,
    currentGenres,
    currentCreatedBy,
    currentProblemType,
  ]);

  const handleProblemSelect = (selectedProblem: SelectedProblem) => {
    // 기존 문제와 비교하여 변경된 경우만 처리
    const isProblemChanged =
      selectedProblem.problemId !== originProblem?.problemId ||
      selectedProblem.title !== originProblem?.title ||
      selectedProblem.content !== originProblem?.content ||
      selectedProblem.answer !== originProblem?.answer ||
      selectedProblem.difficulty !== originProblem?.difficulty ||
      (selectedProblem.genres ?? []).join("|") !==
        (originProblem?.genres ?? []).join("|") ||
      selectedProblem.createdBy !== originProblem?.createdBy ||
      selectedProblem.problemType !== originProblem?.problemType;

    if (isProblemChanged) {
      sendChangeProblem(selectedProblem.problemId!, selectedProblem.problemType!);
    }
  };

  return (
    <ProblemDialog
      onProblemSelect={handleProblemSelect}
      triggerText="사건 변경"
      triggerVariant="outline"
      triggerClassName="h-full text-[24px] cursor-pointer"
      dialogTitle="사건 변경"
    />
  );
};

export default ChangeProblemDialog;