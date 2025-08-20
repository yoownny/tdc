package com.ssafy.backend.ai.controller;

import com.ssafy.backend.ai.dto.request.AiProblemRequestDto;
import com.ssafy.backend.ai.dto.request.AnswerCheckRequestDto;
import com.ssafy.backend.ai.dto.request.QuestionRequestDto;
import com.ssafy.backend.ai.dto.response.AiProblemResponseDto;
import com.ssafy.backend.ai.dto.response.AiTodayProblemResponseDto;
import com.ssafy.backend.ai.dto.response.AnswerCheckResponseDto;
import com.ssafy.backend.ai.dto.response.QuestionResponseDto;
import com.ssafy.backend.ai.service.AiProblemService;
import com.ssafy.backend.common.response.ApiResponse;
import com.ssafy.backend.config.security.CustomUserDetails;
import com.ssafy.backend.exception.ErrorCode;
import com.ssafy.backend.exception.SuccessCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiProblemController {

    private final AiProblemService aiProblemService;

    @PostMapping("/problems/generate")
    public ResponseEntity<?> generateAiProblem(@Valid @RequestBody AiProblemRequestDto request,
                                               @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            AiProblemResponseDto response = aiProblemService.generateAiProblem(request);

            return ApiResponse.success(
                    SuccessCode.AI_PROBLEM_GENERATE_SUCCESS.getStatus(),
                    "AI 문제 생성 완료",
                    response
            );
        } catch (IllegalArgumentException e) {
            log.error("AI 문제 생성 실패: error={}", e.getMessage());
            return ApiResponse.error(ErrorCode.AI_GENERATION_FAILED);
        } catch (Exception e) {
            log.error("AI 문제 생성 중 오류 발생", e);
            return ApiResponse.error(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * AI 오늘의 바거슾 문제와 유저 히스토리 조회
     */
    @GetMapping("/problem/today")
    public ResponseEntity<?> getTodayAiProblemHistory(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userId = userDetails.getUserId();
            AiTodayProblemResponseDto response = aiProblemService.getTodayAiProblemHistory(userId);

            return ApiResponse.success(
                SuccessCode.AI_TODAY_PROBLEM_HISTORY_SUCCESS.getStatus(),
                SuccessCode.AI_TODAY_PROBLEM_HISTORY_SUCCESS.getMessage(),
                response
            );
        } catch (Exception e) {
            log.error("AI 오늘의 문제 조회 중 오류 발생", e);
            return ApiResponse.error(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * AI 오늘의 바거슾 질문 처리
     */
    @PostMapping("/question")
    public ResponseEntity<?> processQuestion(@Valid @RequestBody QuestionRequestDto request,
                                           @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userId = userDetails.getUserId();
            QuestionResponseDto response = aiProblemService.processQuestion(request, userId);

            return ApiResponse.success(
                    SuccessCode.AI_QUESTION_SUCCESS.getStatus(),
                    "질문 처리 완료",
                    response
            );
        } catch (Exception e) {
            log.error("질문 처리 중 오류 발생", e);
            return ApiResponse.error(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * AI 오늘의 바거슾 정답 시도 처리
     */
    @PostMapping("/answer/check")
    public ResponseEntity<?> checkAnswer(@Valid @RequestBody AnswerCheckRequestDto request,
                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long userId = userDetails.getUserId();
            AnswerCheckResponseDto response = aiProblemService.checkAnswer(request, userId);

            return ApiResponse.success(
                    SuccessCode.AI_ANSWER_SUCCESS.getStatus(),
                    "정답 체크 완료",
                    response
            );
        } catch (Exception e) {
            log.error("정답 체크 중 오류 발생", e);
            return ApiResponse.error(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}