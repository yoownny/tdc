package com.ssafy.backend.ai.dto.response;

import com.ssafy.backend.memory.type.Difficulty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiProblemResponseDto {
        private String title;
        private String content;
        private String answer;
        private List<String> genres;
        private Difficulty difficulty;
}
