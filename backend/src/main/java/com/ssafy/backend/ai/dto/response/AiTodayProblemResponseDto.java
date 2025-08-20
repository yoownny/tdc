package com.ssafy.backend.ai.dto.response;

import com.ssafy.backend.entity.Problem;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTodayProblemResponseDto {

    private ProblemDto problem;
    private List<QuestionHistoryDto> questionHistory;
    private List<GuessHistoryDto> guessHistory;
    private int questionCount;
    private int guessCount;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProblemDto {
        private Long problemId;
        private String title;
        private String content;
        private String answer; // null이면 미정답 상태
        private List<String> genres;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionHistoryDto {
        private String userQuestion;
        private String response;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GuessHistoryDto {
        private String userAnswer;
        private int score;
        private boolean isCorrect;
        private String message;
        private String comment;
    }

    public static AiTodayProblemResponseDto from(Problem problem, Map<String, Object> userStats, boolean isWinner) {
        if(userStats != null) {
            return AiTodayProblemResponseDto.builder()
                .problem(ProblemDto.builder()
                    .problemId(problem.getId())
                    .title(problem.getTitle())
                    .content(problem.getContent())
                    .answer(isWinner? problem.getAnswer() : null)
                    .createdAt(problem.getCreatedAt()).build())
                        .questionHistory((List<QuestionHistoryDto>) userStats.get("question_history"))
            .guessHistory((List<GuessHistoryDto>) userStats.get("guess_history"))
            .questionCount((Integer) userStats.getOrDefault("question_count", 0))
            .guessCount((Integer) userStats.getOrDefault("guess_count", 0))
                .build();
        }
        return AiTodayProblemResponseDto.builder()
            .problem(ProblemDto.builder()
                .problemId(problem.getId())
                .title(problem.getTitle())
                .content(problem.getContent())
                .answer(null)
                .createdAt(problem.getCreatedAt()).build())
            .build();
    }
}
