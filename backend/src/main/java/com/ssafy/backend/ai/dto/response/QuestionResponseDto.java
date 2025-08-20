package com.ssafy.backend.ai.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class QuestionResponseDto {

    private String response; // "예", "아니오", "상관없음"
    private String comment;

    public QuestionResponseDto(String response) {
        this.response = response;
        this.comment = null;
    }

    public QuestionResponseDto(String response, String comment) {
        this.response = response;
        this.comment = comment;
    }
}