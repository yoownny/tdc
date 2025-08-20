import type { SelectedProblem } from "@/types/problem/problem";

export interface ProblemStoreType {
  problemId: string;
  title: string;
  content: string;
  answer: string;
  difficulty: "EASY" | "NORMAL" | "HARD";
  genres: string[]; // 1~3개
  creator: {
    id: number;
    nickname: string;
  };
  problemType: "ORIGINAL" | "CUSTOM";

  joinAsHost: (problem: SelectedProblem) => void;
  joinAsPlayer: (problem: SelectedProblem) => void;
  resetProblem: () => void;
  openAnswer: (answerContent: string) => void;
}
