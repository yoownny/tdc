import { apiClient } from "@/services/api/apiClient";
import { ApiError } from "@/types/api/response";
import { toast } from "sonner";

// AI 질문 제출 요청 타입
export interface QuestionRequest {
  problemId: number;
  userQuestion: string;
}

// AI 질문 제출 응답 타입
export interface QuestionResponse {
  status: number;
  message: string;
  data: {
    response: "예" | "아니오" | "상관없음";
    comment: string;
  };
}

// AI 질문 리스트 Format
export interface QuestionHistory {
  userQuestion: string;
  response: "예" | "아니오" | "상관없음";
  comment: string;
}

/**
 * 오늘의 바거슾 질문 처리
 * POST /api/ai/question
 *
 * @param request - 질문 요청 데이터
 * @returns 질문 응답 (예, 아니오, 상관없음)
 */
export const question = async (
  request: QuestionRequest
): Promise<QuestionHistory> => {
  try {
    // apiClient.post()는 헤더를 반환하지 않으므로 axios 인스턴스에 직접 접근
    const axiosInstance = (apiClient as any).instance;
    const response = await axiosInstance.post("/ai/question", request);
    const payload: QuestionResponse = response.data;

    console.log(payload);
    switch (payload.data.response) {
      case "예":
        toast.info("맞습니다.", {
          description: payload.data.comment,
        });
        break;

      case "아니오":
        toast.info("아닙니다.", {
          description: payload.data.comment,
        });
        break;

      case "상관없음":
        toast.info("상관 없습니다.", {
          description: payload.data.comment,
        });
        break;
    }

    return {
      userQuestion: request.userQuestion,
      response: payload.data.response,
      comment: payload.data.comment,
    };
  } catch (error: unknown) {
    console.error("❌ 질문 답변 중 오류 발생:", error);
    throw error as ApiError;
  }
};
