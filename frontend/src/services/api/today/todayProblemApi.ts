import { apiClient } from "@/services/api/apiClient";
import { ApiError } from "@/types/api/response";
import type { QuestionHistory } from "./questionApi";
import type { AnswerHistory } from "./answerCheckApi";

// 오늘의 문제 타입
export interface TodayProblem {
  problemId: string;
  title: string;
  content: string;
  answer: string | null;
  genres: string[];
  createdAt: string;
}

// Today 문제 응답 타입
export interface TodayProblemResponse {
  problem: TodayProblem;
  questionHistory: QuestionHistory[] | null;
  guessHistory: AnswerHistory[] | null;
  questionCount: number;
  guessCount: number;
}

/**
 * 오늘 문제 API 호출
 * GET /api/ai/problem/today
 *
 * @returns 오늘 문제 및 질문 / 답변 현황
 */
export const todayProblem = async (): Promise<TodayProblemResponse> => {
  try {
    // apiClient.post()는 헤더를 반환하지 않으므로 axios 인스턴스에 직접 접근
    const axiosInstance = (apiClient as any).instance;
    const response = await axiosInstance.get("/ai/problem/today");
    const payload: TodayProblemResponse = response.data.data;

    return payload;
  } catch (error: unknown) {
    console.error("❌ 오늘의 문제를 불러오는 데 실패하였습니다.", error);
    throw error as ApiError;
  }
};
