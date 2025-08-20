package com.ssafy.backend.problem.dto.Request;

import com.ssafy.backend.memory.type.Difficulty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProblemSearchRequestDto {

    private List<String> genre = List.of();
    private Difficulty difficulty;
    private String source;
    private String sort = "latest";
    private String keyword;
    private Long cursor;
    private Integer size = 10;
    private Long problemId;
}
