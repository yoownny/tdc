package com.ssafy.backend.game.dto.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CancelHostWarningEvent {
    private Long roomId;
}
