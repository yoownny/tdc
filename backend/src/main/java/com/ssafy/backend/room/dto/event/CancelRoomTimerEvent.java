package com.ssafy.backend.room.dto.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CancelRoomTimerEvent {
    private Long roomId;
}
