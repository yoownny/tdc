package com.ssafy.backend.game.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassTurnRequestDto {
    private String passTurnReason; // "TIMEOUT" || "MANUAL"
}
