package com.ssafy.backend.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AnswerCheckRequestDto {

    @NotNull(message = "문제 번호는 필수입니다.")
    private Long problemId;

    @NotBlank(message = "사용자 답변은 필수입니다.")
    private String userAnswer;

    private String comment; // 선택적 코멘트

    public AnswerCheckRequestDto(Long problemId, String userAnswer) {
        this.problemId = problemId;
        this.userAnswer = userAnswer;
    }

    public AnswerCheckRequestDto(Long problemId, String userAnswer, String comment) {
        this.problemId = problemId;
        this.userAnswer = userAnswer;
        this.comment = comment;
    }
}