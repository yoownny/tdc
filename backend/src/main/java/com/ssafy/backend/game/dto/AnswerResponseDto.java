package com.ssafy.backend.game.dto;

import com.ssafy.backend.memory.QnA;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResponseDto {
    private QnA qnA;
    private AnswerResultDto.GuessDto nextGuessDto; // 가장 오래된 정답 시도
}


