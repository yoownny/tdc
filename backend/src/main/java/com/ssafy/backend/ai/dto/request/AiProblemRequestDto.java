package com.ssafy.backend.ai.dto.request;

import java.util.List;
import lombok.AllArgsConstructor;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiProblemRequestDto {
    private List<String> genres;
}
