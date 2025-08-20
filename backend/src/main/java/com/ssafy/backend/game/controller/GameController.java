package com.ssafy.backend.game.controller;

import com.ssafy.backend.game.dto.*;
import com.ssafy.backend.game.service.GameService;
import com.ssafy.backend.game.service.GameTimerService;
import com.ssafy.backend.memory.repository.RoomRepository;
import com.ssafy.backend.websocket.service.WebSocketNotificationService;
import com.ssafy.backend.websocket.util.WebSocketUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
@Tag(name = "GameController", description = "게임 진행 관련 기능")
public class GameController {

    private final GameService gameService;
    private final WebSocketNotificationService webSocketNotificationService;
    private final RoomRepository roomRepository;
    private final GameTimerService gameTimerService;

    /**
     * 게임 시작
     */
    @Operation(description = "게임 시작")
    @MessageMapping("/games/{roomId}/start")
    public void startGame(@DestinationVariable Long roomId, SimpMessageHeaderAccessor headerAccessor) {
        log.info("게임 시작 요청");
        Long userId = null;
        try {
            userId = WebSocketUtils.getUserIdFromSession(headerAccessor);
            gameService.startGame(roomId, userId);
            log.info("게임 시작 성공: roomId={}", roomId);

            // todo; 로비에 방 상태 변경 알림 (게임 중으로 표시)
            /*                List<RoomInfoDto> updatedRooms = lobbyService.getAllRooms();
                messagingTemplate.convertAndSend(
                        "/sub/lobby/rooms-updated",
                        updatedRooms
                );*/
        } catch (
                Exception e) {
            log.error("게임 시작 처리 중 예외: userId={}, roomId={}, error={}",
                    userId, roomId, e.getMessage());

            webSocketNotificationService.sendToUser(userId, "/queue/game", "ERROR", e.getMessage());
        }
    }

    /**
     * 질문 제출
     */
    @Operation(description = "질문 제출")
    @MessageMapping("/games/{roomId}/question")
    public void sendQuestion(@DestinationVariable Long roomId, @Payload QuestionRequestDto questionRequestDto, SimpMessageHeaderAccessor headerAccessor) {
        log.info("질문 제출: {}", roomId);
        Long userId = null;
        try {
            userId = WebSocketUtils.getUserIdFromSession(headerAccessor);
            QuestionResponseDto result = gameService.sendQuestion(roomId, questionRequestDto, userId);
            log.info("질문 제출 성공 hostId={}", result.getHostId());

            // 출제자에게 "질문이 잘 도착함" 알림
            webSocketNotificationService.sendToUser(result.getHostId(), "/queue/game", "QUESTION_SEND", result);

            // 질문 정보를 모든 사용자 채팅에 broadcast
            webSocketNotificationService.sendToTopic("/topic/games/" + roomId + "/chat", "QUESTION", result);
        } catch (
                Exception e) {
            log.warn("질문 제출 실패: userId={}, roomId={}, reason={}", userId, roomId, e.getMessage());
            webSocketNotificationService.sendToUser(userId, "/queue/game", "ERROR", e.getMessage());
        }
    }

    /**
     * 답변 제출
     */
    @Operation(description = "답변 제출")
    @MessageMapping("/games/{roomId}/respond-question")
    public void respondToQuestion(@DestinationVariable Long roomId, @Payload AnswerRequestDto answerRequestDto, SimpMessageHeaderAccessor headerAccessor) {
        log.info("답변 제출: {}", roomId);
        Long userId = null;
        try {
            userId = WebSocketUtils.getUserIdFromSession(headerAccessor);
            AnswerResultDto result = gameService.respondToQuestion(roomId, answerRequestDto, userId);
            log.info("답변 제출 성공");

            // 전체 남은 질문 개수를 braodcast -> 사용자 UI는 바뀌면 안됨
            webSocketNotificationService.sendToTopic("/topic/games/" + roomId, "REMAINING_QUESTIONS", result.getRemainingQuestions());

            // 답변 정보를 모든 사용자 채팅에 broadcast
            webSocketNotificationService.sendToTopic("/topic/games/" + roomId + "/chat", "RESPOND_QUESTION",
                    AnswerResponseDto.builder().qnA(result.getQnA()).nextGuessDto(result.getNextGuessDto()).build());

            // 질문 - 답변 QnAHistory broadcast
            webSocketNotificationService.sendToTopic("/topic/games/" + roomId + "/history", "QUESTION",
                    result.getQnA());

            // 출제자에게 "답변이 잘 갔음" 알림
            webSocketNotificationService.sendToUser(
                    userId, // 출제자 본인
                    "/queue/game",
                    "RESPOND_QUESTION",
                    AnswerResponseDto.builder().qnA(result.getQnA()).nextGuessDto(result.getNextGuessDto()).build());

            // 남은 정답 시도가 없으면 turn pass
            if (!result.getHasRemainGuess()) {
                // 현재 유저에게 다음 턴 알림
                webSocketNotificationService.sendToUser(userId, "/queue/game", "NEXT_TURN",
                        result.getNextTurnDto()); // 남은 정답 시도
                // 다음 턴 유저에게 다음 턴 알림
                webSocketNotificationService.sendToUser(result.getNextTurnDto().getNextPlayerId(), "/queue/game", "NEXT_TURN",
                        result.getNextTurnDto()); // 남은 정답 시도
                // 모두에게 턴 변경 알림
                webSocketNotificationService.sendToTopic("/topic/games/" + roomId, "NEXT_TURN",
                        result.getNextTurnDto());
            }

            log.info("답변에 대하여 질문={}, 답={}, 정답시도 리스트={}", result.getQnA().getQuestion(), result.getQnA().getAnswer(), result.getNextGuessDto().getGuess());
        } catch (Exception e) {
            log.warn("답변 제출 실패: userId={}, roomId={}, reason={}", userId, roomId, e.getMessage());
            webSocketNotificationService.sendToUser(userId, "/queue/game", "ERROR", e.getMessage());
        }
    }

    /**
     * 정답 시도 (추리하기)
     */
    @Operation(description = "정답 시도 (추리하기)")
    @MessageMapping("/games/{roomId}/guess")
    public void sendGuess(@DestinationVariable Long roomId, @Payload QuestionRequestDto guessRequestDto, SimpMessageHeaderAccessor headerAccessor) {
        log.info("정답 시도: {}", roomId);
        Long userId = null;
        try {
            userId = WebSocketUtils.getUserIdFromSession(headerAccessor);
            String nickname = WebSocketUtils.getNicknameFromSession(headerAccessor);
            ChatResponseDto result = gameService.sendGuess(roomId, guessRequestDto, userId, nickname);
            log.info("정답 시도 제출 성공");

            // 정답 시도자에게 알림
            webSocketNotificationService.sendToUser(userId, "/queue/game", "GUESS_SEND", result);

            // 정답 시도를 모든 사용자 채팅에 broadcast
            webSocketNotificationService.sendToTopic("/topic/games/" + roomId + "/chat", "GUESS_SEND", result);

            log.info("정답 시도 senderId={}, message={}", result.getSenderId(), result.getMessage());
        } catch (Exception e) {
            log.warn("정답 시도 실패: userId={}, roomId={}, reason={}", userId, roomId, e.getMessage());
            webSocketNotificationService.sendToUser(userId, "/queue/game", "ERROR", e.getMessage());
        }
    }

    /**
     * 정답 판정(채점)
     */
    @Operation(description = "정답 판정(채점)")
    @MessageMapping("/games/{roomId}/respond-guess")
    public void respondToGuess(@DestinationVariable Long roomId, @Payload JudgeRequestDto judgeRequestDto, SimpMessageHeaderAccessor headerAccessor) {
        log.info("정답 판정(채점): {}", roomId);
        Long userId = null;
        try {
            userId = WebSocketUtils.getUserIdFromSession(headerAccessor);
            String nickname = WebSocketUtils.getNicknameFromSession(headerAccessor);
            JudgeResultDto result = gameService.respondToGuess(roomId, judgeRequestDto, userId, nickname);
            log.info("정답 판정(채점) 성공");

            // 정답 판정(채점) 결과를 모든 사용자 채팅에 broadcast
            webSocketNotificationService.sendToTopic("/topic/games/" + roomId + "/chat", "RESPOND_GUESS",
                    result.getQnA()); // 채팅 - QnA

            // 게임이 종료되지 않았으면
            if (!result.getIsEnd()) {
                // 정답 시도 - 채점 결과 QnAHistory broadcast
                webSocketNotificationService.sendToTopic("/topic/games/" + roomId + "/history", "GUESS",
                        result.getQnA()); // QnA
                if (result.getHasRemainGuess()) {
                    // 출제자에게 남은 정답 시도 알림
                    webSocketNotificationService.sendToUser(userId, "/queue/game", "GUESS_SEND",
                            result.getGuessDto()); // 남은 정답 시도
                    log.debug("남은 정답 시도: guess={}", result.getGuessDto());
                } else {
                    // 출제자에게 남은 정답 시도 없음을 알림
                    webSocketNotificationService.sendToUser(userId, "/queue/game", "GUESS_SEND",
                            AnswerResultDto.GuessDto.builder().senderId(null).guess(null).build()); // 남은 정답 시도 없음


                    // 현재 유저에게 다음 턴 알림
                    webSocketNotificationService.sendToUser(userId, "/queue/game", "NEXT_TURN",
                            result.getNextTurnDto()); // 남은 정답 시도
                    // 다음 턴 유저에게 다음 턴 알림
                    webSocketNotificationService.sendToUser(result.getNextTurnDto().getNextPlayerId(), "/queue/game", "NEXT_TURN",
                            result.getNextTurnDto());
                    // 모두에게 턴 변경 알림
                    webSocketNotificationService.sendToTopic("/topic/games/" + roomId, "NEXT_TURN",
                            result.getNextTurnDto()); // 남은 정답 시도
                    log.debug("다음 차례: nextId={}", result.getNextTurnDto().getNextPlayerId());
                }
            }
        } catch (Exception e) {
            log.warn("정답 판정(채점) 실패: userId={}, roomId={}, reason={}", userId, roomId, e.getMessage());
            webSocketNotificationService.sendToUser(userId, "/queue/game", "ERROR", e.getMessage());
        }
    }


    /**
     * 채팅
     */
    @Operation(description = "채팅")
    @MessageMapping("/games/{roomId}/chat")
    public void sendChat(@DestinationVariable Long roomId, @Payload ChatRequestDto chatRequestDto, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = null;
        try {
            userId = WebSocketUtils.getUserIdFromSession(headerAccessor);
            String nickname = WebSocketUtils.getNicknameFromSession(headerAccessor);
            ChatResponseDto result = gameService.sendChat(roomId, chatRequestDto, userId, nickname);
            // 모든 사용자 채팅에 broadcast
            webSocketNotificationService.sendToTopic("/topic/games/" + roomId + "/chat", "CHAT", result);
            log.info("chat: {}, {}, {}, {}", result.getSenderId(), result.getNickname(), result.getMessage(), result.getTimestamp());
        } catch (Exception e) {
            webSocketNotificationService.sendToUser(userId, "/queue/game", "ERROR", e.getMessage());
        }
    }

    /**
     * 턴 패스 혹은 시간 초과
     */
    @Operation(description = "턴 패스 혹은 시간 초과")
    @MessageMapping("/games/{roomId}/pass-turn")
    public void passTurn(@DestinationVariable Long roomId, @Payload PassTurnRequestDto passTurnRequestDto, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = null;
        try {
            userId = WebSocketUtils.getUserIdFromSession(headerAccessor);
            NextTurnResultDto result = gameService.passTurn(roomId, passTurnRequestDto, userId);
            // 타임 아웃이고, 경고를 보내야하면
            if (result.getIsWarn()) {
                // 질문자에게 응답 없음 경고
                webSocketNotificationService.sendToUser(userId, "/queue/game", "PLAYER_WARNING",
                        "한 번 더 응답을 하지 않으면 강퇴됩니다.");
            }
            // 현재 유저에게 다음 턴 알림
            webSocketNotificationService.sendToUser(userId, "/queue/game", "NEXT_TURN",
                    result); // 남은 정답 시도
            // 다음 턴 유저에게 다음 턴 알림
            webSocketNotificationService.sendToUser(result.getNextTurnDto().getNextPlayerId(), "/queue/game", "NEXT_TURN",
                    result);

            // 모두에게 턴 변경 알림
            webSocketNotificationService.sendToTopic("/topic/games/" + roomId, "NEXT_TURN",
                    result); // 남은 정답 시도
        } catch (Exception e) {
            webSocketNotificationService.sendToUser(userId, "/queue/game", "ERROR", e.getMessage());
        }
    }

    /**
     * 방장 응답 없음
     */
    @Operation(description = "방장 응답 없음")
    @MessageMapping("/games/{roomId}/host-timeout")
    public void hostTimeout(@DestinationVariable Long roomId, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = null;
        try {
            userId = WebSocketUtils.getUserIdFromSession(headerAccessor);
            String nickname = WebSocketUtils.getNicknameFromSession(headerAccessor);
            Boolean isWarn = gameService.handleHostTimeout(roomId, userId, nickname);
            if (isWarn) {
                // 방장에게 응답 없음 경고
                webSocketNotificationService.sendToUser(userId, "/queue/game", "HOST_WARNING",
                        "30초 내로 응답을 하지 않으면 강퇴됩니다.");
            }
        } catch (Exception e) {
            webSocketNotificationService.sendToUser(userId, "/queue/game", "ERROR", e.getMessage());
        }
    }
}

