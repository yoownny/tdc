package com.ssafy.backend.game.dto;

import com.ssafy.backend.memory.Problem;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EndResponseDto {
    private Long roomId;
    private String endReason; // "CORRECT_ANSWER" or "TIMEOUT" or "EXHAUSTED_ATTEMPTS"
    private WinnerInfoDto winnerInfo;
    private ProblemDto problem;
    private int totalQuestionCount;
    @Setter
    private String playTime;
    private Boolean isForce;
    private Long userId;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WinnerInfoDto {
        private Long winnerId;
        private String nickname;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProblemDto {
        private String title;
        private String content;
        private String guess;
        private String answer;
    }

    // 웹소켓 응답용
    public static EndResponseDto createEndResponseDto(EndResponseDto endResponseDto) {
        return EndResponseDto.builder()
                .endReason(endResponseDto.getEndReason())
                .winnerInfo(endResponseDto.getWinnerInfo())
                .problem(endResponseDto.getProblem())
                .totalQuestionCount(endResponseDto.getTotalQuestionCount())
                .playTime(endResponseDto.getPlayTime())
                .build();
    }

    // 이벤트용 (roomId 포함)
    public static EndResponseDto createEvent(Long roomId, Problem problem, Integer remainingQuestions,
                                             String endReason, Long senderId, String senderNickname, String guess, Boolean isForce, Long userId) {
        return EndResponseDto.builder()
                .roomId(roomId)
                .endReason(endReason)
                .winnerInfo(WinnerInfoDto.builder()
                        .winnerId(senderId)
                        .nickname(senderNickname)
                        .build())
                .problem(ProblemDto.builder()
                        .title(problem.getTitle())
                        .content(problem.getContent())
                        .guess(guess)
                        .answer(problem.getAnswer())
                        .build())
                .totalQuestionCount(30 - remainingQuestions)
                .isForce(isForce)
                .userId(userId)
                .build();
    }
}
