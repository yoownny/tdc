package com.ssafy.backend.game.listner;

import com.ssafy.backend.game.dto.EndResponseDto;
import com.ssafy.backend.game.dto.GameInfoResultDto;
import com.ssafy.backend.game.dto.PlayersUpdatedEvent;
import com.ssafy.backend.game.dto.event.CancelHostWarningEvent;
import com.ssafy.backend.game.dto.event.HostWarningEvent;
import com.ssafy.backend.game.service.GameService;
import com.ssafy.backend.game.service.GameTimerService;
import com.ssafy.backend.memory.Room;
import com.ssafy.backend.memory.repository.RoomRepository;
import com.ssafy.backend.room.dto.response.RoomResponse;
import com.ssafy.backend.room.service.RoomTimerService;
import com.ssafy.backend.websocket.service.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class GameEventListener {
    private final GameTimerService gameTimerService;
    private final RoomTimerService roomTimerService;
    private final WebSocketNotificationService webSocketNotificationService;
    private final GameService gameService;
    private final RoomRepository roomRepository;

    // 게임 시작
    @EventListener
    public void handleGameStarted(GameInfoResultDto event) {
        // 대기방 게임 시작 타이머 삭제
        roomTimerService.cancelRoomTimer(event.getRoomId());

        // 게임 타이머 설정
        gameTimerService.startGameTimer(event.getRoomId(), event.getTimeLimit(), () -> {
            // 타임아웃 시 게임 종료 처리
            gameService.endGame(event.getRoomId());
        });

        // 게임 시작 알림 전송
        webSocketNotificationService.sendToTopic(
                "/topic/games/" + event.getRoomId(),
                "GAME_STARTED", GameInfoResultDto.createGameInfoResultDto(event.getTimeLimit(), event.getGameInfoResponseDto())
        );
    }

    // 게임 종료
    @EventListener
    public void handleGameEnd(EndResponseDto endResponseDto) {
        // playTime 설정
        String playTime = gameTimerService.getElapsedTimeFormatted(endResponseDto.getRoomId());
        endResponseDto.setPlayTime(playTime);

        // 타이머 삭제
        gameTimerService.cancelGameTimer(endResponseDto.getRoomId());

        // 게임 종료 브로드캐스트
        webSocketNotificationService.sendToTopic("/topic/games/" + endResponseDto.getRoomId(), "END_GAME",
                endResponseDto);

        // 대기방 전환 처리
        //handleGameEndTransition(endResponseDto.getRoomId());
    }

//    private void handleGameEndTransition(Long roomId) {
//        try {
//            Room room = roomRepository.findById(roomId);
//            if (room != null) {
//                // 대기방으로 전환된 방 정보 브로드캐스트 (정답 포함)
//                RoomResponse roomResponse = RoomResponse.from(room, true);
//                log.info("players={}, size={}", roomResponse.getPlayers().toString(), roomResponse.getPlayers().size());
//                webSocketNotificationService.sendToTopic("/topic/room/" + roomId, "END_GAME", roomResponse);
//            }
//        } catch (Exception e) {
//            log.error("게임 종료 후 대기방 전환 실패: roomId={}, error={}", roomId, e.getMessage());
//        }
//    }

    // 참가자 리스트 변경
    @EventListener
    public void handlePlayersUpdated(PlayersUpdatedEvent event) {
        log.info("roomId - {}", event.getRoomId());

        // 질문자 강퇴인 경우
        if (event.getIsForce()) {
            // 질문자에게 응답 없음 경고
            webSocketNotificationService.sendToUser(event.getLeaveDto().getUserId(), "/queue/game", "PLAYER_FORCE_LEAVE",
                    "응답 없음 2회로 강퇴되었습니다.");
        }

        // 나간 참가자 chat으로 알림
        webSocketNotificationService.sendToTopic(
                "/topic/games/" + event.getRoomId() + "/chat",
                "LEAVE_PLAYER",
                event.getLeaveDto()
        );

        // 참가자 리스트 broadcast -> turnOrder도 추가
        webSocketNotificationService.sendToTopic(
                "/topic/games/" + event.getRoomId(),
                "PLAYERS",
                PlayersUpdatedEvent.createPlayerUpdateEvent(event)
        );
    }

    // 방장 (답변/채점) 응답 없음
    @EventListener
    public void handleHostNoResponse(HostWarningEvent event) {
        log.info("방장 응답 없음 - {}", event.getHostId());
        // 방장 응답 없음 타이머 설정
        gameTimerService.startHostTimer(event.getRoomId(), () -> {
            // 2회 응답 없음 시 방장 강퇴
            gameService.handlePlayerDisconnect(event.getHostId(), event.getRoomId(), event.getNickname(), false);
        });
    }

    // 방장 (답변/채점) 응답 없음 타이머 삭제
    @EventListener
    public void handleCancelHostNoResponse(CancelHostWarningEvent event) {
        // 방장 응답 없음 타이머 설정
        gameTimerService.cancelHostTimer(event.getRoomId());
    }
}
