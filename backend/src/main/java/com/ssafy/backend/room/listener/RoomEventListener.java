package com.ssafy.backend.room.listener;

import com.ssafy.backend.room.dto.event.AllReadyTimerEvent;
import com.ssafy.backend.room.dto.event.CancelRoomTimerEvent;
import com.ssafy.backend.room.dto.request.RoomListRequest;
import com.ssafy.backend.room.dto.response.LeaveRoomResult;
import com.ssafy.backend.room.dto.response.PlayerResponse;
import com.ssafy.backend.room.dto.response.RoomListResponse;
import com.ssafy.backend.room.dto.response.RoomResponse;
import com.ssafy.backend.room.service.RoomService;
import com.ssafy.backend.room.service.RoomTimerService;
import com.ssafy.backend.websocket.service.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoomEventListener {
    private final RoomTimerService roomTimerService;
    private final WebSocketNotificationService webSocketNotificationService;
    private final RoomService roomService;

    // 모두 준비 완료 -> 방장에게 4분 30초, 5분 타이머 설정
    @EventListener
    public void handleAllReady(AllReadyTimerEvent event) {
        // 1. 30초 남았을 때(4분 30초 경과) 실행할 로직
        Runnable warningAction = () -> {
            log.info("방 {}: 게임 시작까지 30초 남았습니다. 방장이 게임을 시작해야 합니다.", event.getRoomId());

            // 방장 본인에게 강퇴 경고
            webSocketNotificationService.sendToUser(event.getHostId(), "/queue/room", "ROOM_TIMER_WARNING", "30초 안에 게임을 시작하지 않으면 강퇴됩니다.");

            // 모든 방 사용자에게 강퇴 경고 broadcast
            webSocketNotificationService.sendToTopic(
                    "/topic/room/" + event.getRoomId(),
                    "ROOM_TIMER_WARNING",
                    "30초 안에 게임을 시작하지 않으면 방장이 강퇴됩니다."
            );
        };

        // 2. 5분 경과 시 실행할 로직 (타임아웃)
        Runnable timeoutAction = () -> {
            log.warn("방 {}: 5분 동안 게임을 시작하지 않아 방장을 강퇴합니다.", event.getRoomId());

            // 본인에게 퇴장 완료 알림
            webSocketNotificationService.sendToUser(event.getHostId(), "/queue/room", "ROOM_TIMEOUT", "시간 초과로 방에서 강퇴되었습니다.");

            // 방장 강퇴 로직 호출
            LeaveRoomResult result = roomService.leaveRoom(event.getRoomId(), event.getHostId());

            // 강퇴 후 타이머 삭제
            roomTimerService.cancelRoomTimer(event.getRoomId());

            // 모든 방 사용자에게 방장 강퇴 broadcast
            webSocketNotificationService.sendToTopic("/topic/room/" + event.getRoomId(), "ROOM_TIMEOUT", "시간 초과로 방장이 강퇴되었습니다.");

            // 룸 업데이트
            PlayerResponse newHostResponse = PlayerResponse.from(result.getNewHost());
            webSocketNotificationService.sendToTopic("/topic/room/" + event.getRoomId(), "HOST_CHANGED", newHostResponse);


            // 새 방장에게는 정답 포함된 방 정보 개별 전송
            RoomResponse hostResponse = RoomResponse.from(result.getRoom(), true);
            webSocketNotificationService.sendToUser(result.getNewHost().getUserId(), "/queue/room", "ROOM_UPDATED", hostResponse);

            // 로비
            RoomListRequest roomListRequest = new RoomListRequest();
            RoomListResponse response = roomService.getRooms(roomListRequest);
            webSocketNotificationService.sendToTopic("/topic/lobby", "ROOM_LIST", response);
        };

        // 3. 타이머 설정
        roomTimerService.startRoomTimer(event.getRoomId(), warningAction, timeoutAction);
    }

    // 대기방 타이머 삭제
    // 방장이 게임을 시작했거나 방이 해체될 때, 준비 완료를 취소했을 때
    @EventListener
    public void handleCancelRoomTimer(CancelRoomTimerEvent event) {
        // 타이머 삭제
        roomTimerService.cancelRoomTimer(event.getRoomId());
    }
}
