package com.ssafy.backend.game.dto.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class HostWarningEvent {
    private Long hostId;
    private Long roomId;
    private String nickname;
}
