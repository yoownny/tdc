package com.ssafy.backend.ai.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AnswerCheckResponseDto {

    private int score; // 0-100 유사도 점수
    private boolean isCorrect; // 80점 이상이면 true
    private String message; // "맞습니다" 또는 "틀렸습니다"
    private String comment; // AI 코멘트

    public AnswerCheckResponseDto(int score, boolean isCorrect, String message) {
        this.score = score;
        this.isCorrect = isCorrect;
        this.message = message;
        this.comment = null;
    }

    public AnswerCheckResponseDto(int score, boolean isCorrect, String message, String comment) {
        this.score = score;
        this.isCorrect = isCorrect;
        this.message = message;
        this.comment = comment;
    }
}