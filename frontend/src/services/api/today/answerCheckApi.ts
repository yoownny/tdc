import { apiClient } from "@/services/api/apiClient";
import { ApiError } from "@/types/api/response";
import { toast } from "sonner";

// AI 정답 제출 요청 타입
export interface AnswerRequest {
  problemId: number;
  userAnswer: string;
}

// AI 정답 제출 응답 타입
export interface AnswerResponse {
  status: number;
  message: string;
  data: {
    score: number;
    isCorrect: true;
    message: string;
    comment: string;
  };
}

// AI 정답 리스트 Format
export interface AnswerHistory {
  userAnswer: string;
  score: number;
  isCorrect: boolean;
  message: string;
}

/**
 * 회원가입 API 호출
 * POST /api/ai/answer/check
 *
 * @param request - 질문 요청 데이터
 * @returns 답변 판정 (점수, 정답 여부, 메시지)
 */
export const answerCheck = async (
  request: AnswerRequest
): Promise<AnswerHistory> => {
  try {
    // apiClient.post()는 헤더를 반환하지 않으므로 axios 인스턴스에 직접 접근
    const axiosInstance = (apiClient as any).instance;
    const response = await axiosInstance.post("/ai/answer/check", request);
    const payload: AnswerResponse = response.data;
    console.log(payload);

    if (payload.data.score >= 80) {
      toast.success("정답입니다!", {
        description: "사건의 진실에 가까워졌습니다!",
      });
    } else {
      toast.error("아닙니다.", {
        description: "숨겨진 사실이 더 있을 수도 있어요.",
      });
    }

    return {
      userAnswer: request.userAnswer,
      score: payload.data.score,
      isCorrect: payload.data.isCorrect,
      message: payload.data.message,
    };
  } catch (error: unknown) {
    console.error("❌ 정답 판정 중 오류 발생:", error);
    throw error as ApiError;
  }
};
