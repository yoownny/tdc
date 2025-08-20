package com.ssafy.backend.problem.dto.Response;

import com.ssafy.backend.memory.type.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ProblemSummaryDto {

    private String problemId;
    private String title;
    private String content;
    private String answer;
    private List<String> genres;
    private Difficulty difficulty;
    private creatorInfo creator;
    private Integer likes;
    private String source;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class creatorInfo {
        private Long id;
        private String nickname;
    }
}
