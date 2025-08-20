package com.ssafy.backend.room.dto.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AllReadyTimerEvent {
    private Long roomId;
    private Long HostId;
}
