package com.ssafy.backend.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class QuestionRequestDto {

    @NotNull(message = "문제 번호는 필수입니다.")
    private Long problemId;

    @NotBlank(message = "사용자 질문은 필수입니다.")
    private String userQuestion;

    private String comment; // 선택적 코멘트

    public QuestionRequestDto(Long problemId, String userQuestion) {
        this.problemId = problemId;
        this.userQuestion = userQuestion;
    }

    public QuestionRequestDto(Long problemId, String userQuestion, String comment) {
        this.problemId = problemId;
        this.userQuestion = userQuestion;
        this.comment = comment;
    }
}