package com.ssafy.backend.game.dto;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Setter
public class NextTurnResultDto {
    private Boolean isWarn;
    private NextTurnDto nextTurnDto;
}
