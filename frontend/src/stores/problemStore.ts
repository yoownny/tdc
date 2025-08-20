import type { SelectedProblem } from "@/types/problem/problem";
import type { ProblemStoreType } from "./types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// 방 입장 초기 문제 정보 설정
function applyProblem(problem: SelectedProblem, isHost: boolean) {
  return {
    problemId: problem.problemId,
    title: problem.title,
    content: problem.content,
    answer: isHost ? problem.answer : "",
    difficulty: problem.difficulty,
    genres: problem.genres,
    creator: {
      id: problem.creator.id,
      nickname: problem.creator.nickname,
    },
    problemType: problem.problemType,
  };
}

const useProblemStore = create<ProblemStoreType>()(
  persist(
    (set) => ({
      problemId: "",
      title: "",
      content: "",
      answer: "",
      difficulty: "NORMAL",
      genres: [],
      creator: {
        id: 0,
        nickname: "",
      },
      problemType: "ORIGINAL",

      // 방장 입장 관련, 정답 있음
      joinAsHost: (problem) => set(() => applyProblem(problem, true)),

      // 참가자 입장 관련, 정답 없음
      joinAsPlayer: (problem) => set(() => applyProblem(problem, false)),

      // 게임 종료 후, 문제 내용 초기화
      resetProblem: () =>
        set(() => ({
          problemId: "",
          title: "",
          content: "",
          answer: "",
          difficulty: "NORMAL",
          genres: [],
          creator: {
            id: 0,
            nickname: "",
          },
          problemType: "ORIGINAL",
        })),

      openAnswer: (answerContent) => set(() => ({ answer: answerContent })),
    }),
    {
      name: "problem-storage",
      partialize: (state) => ({
        problemId: state.problemId,
        title: state.title,
        content: state.content,
        answer: state.answer,
        difficulty: state.difficulty,
        genres: state.genres,
        creator: state.creator,
        problemType: state.problemType,
        // 답안은 이미 host를 통한 처리 작업 끝
      }),
    }
  )
);

export default useProblemStore;
