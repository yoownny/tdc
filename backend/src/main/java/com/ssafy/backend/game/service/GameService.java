package com.ssafy.backend.game.service;

import com.ssafy.backend.common.enums.SolveType;
import com.ssafy.backend.entity.User;
import com.ssafy.backend.entity.UserSolvedProblem;
import com.ssafy.backend.game.dto.*;
import com.ssafy.backend.game.dto.event.CancelHostWarningEvent;
import com.ssafy.backend.game.dto.event.HostWarningEvent;
import com.ssafy.backend.memory.*;
import com.ssafy.backend.memory.repository.RoomRepository;
import com.ssafy.backend.memory.type.AnswerStatus;
import com.ssafy.backend.memory.type.PlayerRole;
import com.ssafy.backend.memory.type.ReadyState;
import com.ssafy.backend.memory.type.RoomState;
import com.ssafy.backend.repository.UserRepository;
import com.ssafy.backend.repository.UserSolvedProblemRepository;
import com.ssafy.backend.repository.ProblemInfoRepository;
import com.ssafy.backend.room.dto.response.PlayerResponse;
import com.ssafy.backend.room.dto.response.RoomListResponse;
import com.ssafy.backend.room.dto.response.RoomResponse;
import com.ssafy.backend.room.service.RoomService;
import com.ssafy.backend.websocket.service.WebSocketNotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final UserSolvedProblemRepository userSolvedProblemRepository;
    private final ProblemInfoRepository problemInfoRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final WebSocketNotificationService webSocketNotificationService;
    private final RoomService roomService;

    /**
     * 게임 시작
     */
    @Transactional
    public void startGame(Long roomId, Long userId) {
        // 방 조회
        Room room = roomRepository.findById(roomId);
        if (room == null) {
            throw new RuntimeException("방을 찾을 수 없습니다.");
        }

        // 유효성 검사
        ValidationResultDto validation = validateGameStart(room, userId);
        if (!validation.isValid()) {
            throw new RuntimeException(validation.getErrorMessage());
        }

        // 방 상태 변경
        synchronized (room) {
            if (room.getState() != RoomState.WAITING) {
                RoomState currentState = room.getState();
                if (currentState == RoomState.STARTING) {
                    throw new RuntimeException("게임 시작 처리 중입니다.");
                } else if (currentState == RoomState.PLAYING) {
                    throw new RuntimeException("이미 게임이 진행 중입니다.");
                } else {
                    throw new RuntimeException("게임을 시작할 수 없는 상태입니다.");
                }
            }
            room.setState(RoomState.STARTING);
        }

        try {
            // 게임 객체 생성 및 초기화
            Game game = new Game(room.getPlayerOrder(), room.getPlayers(), userId);
            room.setCurrentGame(game);

            // 최종 상태로 변경 (STARTING -> PLAYING)
            room.setState(RoomState.PLAYING);

            // 저장 (인메모리에서는 이미 반영됨)
            roomRepository.save(room);

            // 게임 시작 이벤트 발행
            eventPublisher.publishEvent(GameInfoResultDto.createGameInfoResultEvent(roomId, room.getTimeLimit(),
                createGameInfoDto(room, game)));
        } catch (Exception e) {
            // 실패 시 상태 롤백
            room.setState(RoomState.WAITING);
            room.setCurrentGame(null);

            throw new RuntimeException("게임 시작 중 오류가 발생했습니다.");
        }
    }

    // === Private 메서드들 (순수 비즈니스 로직) ===

    private ValidationResultDto validateGameStart(Room room, Long userId) {
        // 방장 권한 확인
        if (!userId.equals(room.getHostId())) {
            return ValidationResultDto.invalid("방장만 게임을 시작할 수 있습니다.");
        }

        // 문제 선택 여부 확인
        if (room.getSelectedProblem() == null) {
            return ValidationResultDto.invalid("게임에 사용할 문제가 선택되지 않았습니다.");
        }

        // 최소 인원 확인
        if (room.getPlayers().size() < 2) {
            return ValidationResultDto.invalid("최소 2명 이상이어야 게임을 시작할 수 있습니다.");
        }

        // 모든 참가자 준비 완료 확인
        boolean allReady = room.getPlayers().values().stream()
            .allMatch(player -> player.getReadyState() == ReadyState.READY);

        if (!allReady) {
            return ValidationResultDto.invalid("모든 참가자가 준비 완료 상태여야 합니다.");
        }

        return ValidationResultDto.valid();
    }

    private GameInfoResponseDto createGameInfoDto(Room room, Game game) {
        // 1. players 리스트를 userId를 키로, Player 객체를 값으로 하는 Map으로 변환
        Map<Long, Player> playerMap = game.getPlayers().values().stream()
            .collect(Collectors.toMap(Player::getUserId, player -> player));

        // 2. turnOrderIds(userId 리스트)를 순회하며, Map에서 플레이어 정보를 찾아 PlayerInfoDto를 생성
        List<PlayerInfoDto> turnOrderInfo = game.getTurnOrder().stream()
            .map(userId -> {
                Player player = playerMap.get(userId);
                return new PlayerInfoDto(player.getUserId(), player.getNickname());
            })
            .toList();

        return GameInfoResponseDto.builder()
            .roomId(room.getRoomId())
            .roomState(room.getState())
            .gameStatus(
                GameInfoResponseDto.GameStatus.builder()
                    .remainingQuestions(room.getCurrentGame().getRemainingQuestions())
                    .totalQuestions(30).build()) //todo; 직접 넣는게 맞나?
            .currentTurn(
                GameInfoResponseDto.CurrentTurn.builder()
                    .questionerId(game.getCurrentQuestionerId())
                    .nickname(game.getPlayers().get(game.getCurrentQuestionerId()).getNickname())
                    .turnIndex(game.getCurrentTurnIndex()).build())
            .players(
                new ArrayList<>(game.getPlayers().values())
            )
            .turnOrder(turnOrderInfo)
            .build();
    }

    public QuestionResponseDto sendQuestion(Long roomId, QuestionRequestDto questionRequestDto, Long userId) {
        // 방 조회 //todo;util로 뺴기
        Room room = roomRepository.findById(roomId);
        if (room == null) {
            throw new RuntimeException("방을 찾을 수 없습니다.");
        }

        Game game = room.getCurrentGame();
        if (game == null) {
            throw new RuntimeException("게임을 찾을 수 없습니다.");
        }

        // 유효성 검사
        log.info("currentId={}, userId={}", game.getCurrentQuestionerId(), userId);
        if (!game.isCurrentQuestioner(userId)) {
            throw new RuntimeException("질문자의 차례가 아닙니다.");
        }
        if (!game.validateTurn()) {
            throw new RuntimeException("더 이상 질문을 할 수 없습니다.");
        }

        // 질문 처리 로직
        try {
            // 다음 턴으로 이동 + 질문 횟수 차감
//            game.advanceTurn();

            // 3. 응답 생성
            return QuestionResponseDto.builder()
                .hostId(room.getHostId())
                .questionRequestDto(
                    QuestionResponseDto.QuestionRequestDto.builder()
                        .question(questionRequestDto.getQuestion())
                        .senderId(userId).build()
                ).build();

        } catch (Exception e) {
            throw new RuntimeException("질문 처리 중 오류가 발생했습니다.");
        }
    }

    public AnswerResultDto respondToQuestion(Long roomId, AnswerRequestDto answerRequestDto, Long userId) {
        // 방 조회
        Room room = roomRepository.findById(roomId);
        if (room == null) {
            throw new RuntimeException("방을 찾을 수 없습니다.");
        }

        Game game = room.getCurrentGame();
        if (game == null) {
            throw new RuntimeException("게임을 찾을 수 없습니다.");
        }

        // 유효성 검사
        if (!room.getHostId().equals(userId)) {
            throw new RuntimeException("출제자만 답변할 수 있습니다.");
        }

        if (answerRequestDto.getQuestionerId() == null || answerRequestDto.getQuestion() == null
            || answerRequestDto.getAnswerStatus() == null) {
            throw new RuntimeException("질문이 유효하지 않습니다.");
        }

        // todo; 중복 유효성 검사

        // 방장 응답 없음 경고가 있다면
        if (game.getNoResponseCount() > 0) {
            // 타이머 삭제
            eventPublisher.publishEvent(new CancelHostWarningEvent(roomId));
        }

        // 답변 처리 로직
        // QnA 질문-답변 저장
        QnA qna = new QnA(HistoryType.QUESTION, answerRequestDto.getQuestionerId(), answerRequestDto.getQuestion(),
            answerRequestDto.getAnswerStatus());
        game.addQnA(qna);

        // 질문 횟수 차감
        game.minusRemainingQuestions();

        // 정답 시도 큐 확인
        Optional<AnswerAttempt> nextGuessDto = game.peekOptionalAnswer();

        // 남은 정답 시도 없으면 -> 다음 차례 요청
        if (nextGuessDto.isEmpty()) {
            // 다음 차례 계산하기
            game.advanceTurn();

            Long nextQuestionerId = game.getCurrentQuestionerId();

            return AnswerResultDto.builder()
                .remainingQuestions(game.getRemainingQuestions())
                .hasRemainGuess(false)
                .qnA(qna)
                .nextTurnDto(NextTurnDto.builder()
                    .nextPlayerId(nextQuestionerId)
                    .nextPlayerNickname(game.getPlayers().get(nextQuestionerId).getNickname()).build())
                .nextGuessDto(AnswerResultDto.GuessDto.builder().senderId(null).guess(null).build())
                .build();
        }

        // 응답 생성
        return AnswerResultDto.builder()
            .remainingQuestions(game.getRemainingQuestions())
            .hasRemainGuess(true)
            .qnA(qna)
            .nextGuessDto(AnswerResultDto.GuessDto.builder()
                .senderId(nextGuessDto.get().getUserId())
                .guess(nextGuessDto.get().getGuess())
                .build())
            .build();
    }

    public ChatResponseDto sendGuess(Long roomId, QuestionRequestDto guessRequestDto, Long userId, String nickname) {
        // 방 조회
        Room room = roomRepository.findById(roomId);
        if (room == null) {
            throw new RuntimeException("방을 찾을 수 없습니다.");
        }

        Game game = room.getCurrentGame();
        if (game == null) {
            throw new RuntimeException("게임을 찾을 수 없습니다.");
        }

//        // todo; util -> 유효성: 게임이 끝났는지 확인
//        if (game.isFinished()) {
//            throw new RuntimeException("게임이 종료되었습니다.");
//        }

        if (guessRequestDto.getQuestion() == null) {
            throw new RuntimeException("정답 시도가 유효하지 않습니다.");
        }
//
//        // 유효성: 플레이어 존재 확인
        Player player = game.getPlayers().get(userId);
//        if (player == null) {
//            throw new RuntimeException("해당 유저는 게임에 참여하고 있지 않습니다.");
//        }

        //아니면 정답 시도 횟수 차감
        player.decrementAnswerAttempt();

        // 정답 시도 큐에 정답 시도 추가
        game.addAnswerAttempt(new AnswerAttempt(userId, guessRequestDto.getQuestion()));

        // 응답 생성
        return ChatResponseDto.builder()
            .senderId(userId)
            .nickname(nickname)
            .message(guessRequestDto.getQuestion())
            .timestamp(LocalDateTime.now())
            .build();
    }

    public ChatResponseDto sendChat(Long roomId, ChatRequestDto chatRequestDto, Long userId, String nickname) {
        Room room = roomRepository.findById(roomId);
        if (room == null) {
            throw new RuntimeException("방을 찾을 수 없습니다.");
        }

        return ChatResponseDto.builder()
            .senderId(userId)
            .nickname(nickname)
            .message(chatRequestDto.getMessage())
            .timestamp(LocalDateTime.now())
            .build();
    }

    public JudgeResultDto respondToGuess(Long roomId, JudgeRequestDto judgeRequestDto, Long userId, String nickname) {
        // 방 조회
        Room room = roomRepository.findById(roomId);
        if (room == null) {
            throw new RuntimeException("방을 찾을 수 없습니다.");
        }

        Game game = room.getCurrentGame();
        if (game == null) {
            throw new RuntimeException("게임을 찾을 수 없습니다.");
        }

        // 유효성 검사
        if (!room.getHostId().equals(userId)) {
            throw new RuntimeException("출제자만 답변할 수 있습니다.");
        }

        if (judgeRequestDto.getSenderId() == null || judgeRequestDto.getGuess() == null
            || judgeRequestDto.getAnswerStatus() == null) {
            throw new RuntimeException("정답 판정 값이 유효하지 않습니다.");
        }

        AnswerAttempt answerAttempt = game.peekOptionalAnswer()
            .orElseThrow(() -> new RuntimeException("잘못된 정답 시도 입니다."));
        if (!answerAttempt.getGuess().equals(judgeRequestDto.getGuess()) || !answerAttempt.getUserId()
            .equals(judgeRequestDto.getSenderId())) {
            throw new RuntimeException("잘못된 정답 시도 입니다.");
        }

        // 답변 처리 로직
        try {
            // 방장 응답 없음 경고가 있다면
            if (game.getNoResponseCount() > 0) {
                // 타이머 삭제
                eventPublisher.publishEvent(new CancelHostWarningEvent(roomId));
            }
            // QnA 정답 시도 - 채점 결과 저장
            game.popAnswer();
            QnA qna = new QnA(HistoryType.GUESS, judgeRequestDto.getSenderId(), judgeRequestDto.getGuess(),
                judgeRequestDto.getAnswerStatus());
            game.addQnA(qna);

            // 전체 정답 시도 차감
            game.decrementRemainingGuess(1);

            // 맞았거나
            // 모든 사람의 정답 시도 횟수를 다 소진한 경우
            // 게임 종료
            if (judgeRequestDto.getAnswerStatus() == AnswerStatus.CORRECT || game.getRemainingGuess() <= 0) {
                Problem problem = room.getSelectedProblem();

                // 정답자 정보 가져오기 (게임 참가자에서)
                String winnerNickname = null;
                if (judgeRequestDto.getSenderId() != null &&
                    game.getPlayers().containsKey(judgeRequestDto.getSenderId())) {
                    winnerNickname = game.getPlayers().get(judgeRequestDto.getSenderId()).getNickname();
                }

                // UserSolvedProblem 저장
                saveUserSolvedProblems(room, game, judgeRequestDto.getSenderId(),
                    judgeRequestDto.getAnswerStatus() == AnswerStatus.CORRECT);

                EndResponseDto endResponseDto = EndResponseDto.createEvent(roomId, problem,
                    game.getRemainingQuestions(),
                    judgeRequestDto.getAnswerStatus() == AnswerStatus.CORRECT ? "CORRECT_ANSWER"
                        : "EXHAUSTED_ATTEMPTS",
                    judgeRequestDto.getSenderId(), winnerNickname, judgeRequestDto.getGuess(), false, null);

                log.info("정답을 맞아서 종료됨 players={}, size={}", room.getPlayers().toString(), room.getPlayers().size());
                // 게임 종료 이벤트 발행
                eventPublisher.publishEvent(endResponseDto);

                // 게임 삭제
                deleteGameInfo(roomId);

                return JudgeResultDto.builder()
                    .isEnd(true)
                    .qnA(qna)
                    .endResponseDto(endResponseDto)
                    .build();
            }

            // 정답 시도 큐 확인
            Optional<AnswerAttempt> nextGuessDto = game.peekOptionalAnswer();

            // 남은 정답 시도가 없으면 -> 다음 차례 요청
            if (nextGuessDto.isEmpty()) {
                // 다음 차례 계산하기
                game.advanceTurn();

                Long nextQuestionerId = game.getCurrentQuestionerId();

                return JudgeResultDto.builder()
                    .isEnd(false)
                    .hasRemainGuess(false)
                    .qnA(qna)
                    .nextTurnDto(NextTurnDto.builder()
                        .nextPlayerId(nextQuestionerId)
                        .nextPlayerNickname(game.getPlayers().get(nextQuestionerId).getNickname()).build())
                    .build();
            }

            //남은 정답 시도가 있으면 가장 오래된 정답 시도 보내기
            return JudgeResultDto.builder()
                .isEnd(false)
                .qnA(qna)
                .hasRemainGuess(true)
                .guessDto(AnswerResultDto.GuessDto.builder()
                    .senderId(nextGuessDto.get().getUserId())
                    .guess(nextGuessDto.get().getGuess()).build())
                .build();

        } catch (Exception e) {
            throw new RuntimeException("정답 판정(채점) 중 오류가 발생했습니다.");
        }

    }

    public NextTurnResultDto passTurn(Long roomId, PassTurnRequestDto passTurnRequestDto, Long userId) {
        // 방 조회
        Room room = roomRepository.findById(roomId);
        if (room == null) {
            throw new RuntimeException("방을 찾을 수 없습니다.");
        }

        Game game = room.getCurrentGame();
        if (game == null) {
            throw new RuntimeException("게임을 찾을 수 없습니다.");
        }

        // todo -> 유저 유효성 검사
        if (!game.getCurrentQuestionerId().equals(userId)) {
            throw new RuntimeException("자신의 차례가 아닙니다.");
        }

        NextTurnResultDto resultDto = NextTurnResultDto.builder()
            .isWarn(false).build();

        // 시간 초과로 인한 턴 패스
        if (Objects.equals(passTurnRequestDto.getPassTurnReason(), "TIMEOUT")) {
            log.info("시간 초과 턴 패스");
            Player player = game.getPlayers().get(userId);
            // 응답 없음 횟수 추가
            player.incrementNoResponseCount();
            if (player.getNoResponseCount() >= 2) {
                log.info("강퇴 처리");
                // 강퇴 처리
                handlePlayerDisconnect(userId, roomId, player.getNickname(), true);
            } else {
                // 다음 차례 계산하기
                game.advanceTurn();
                resultDto.setIsWarn(true);
            }
        } else {
            log.info("수동 턴 패스");
            // 다음 차례 계산하기
            game.advanceTurn();
        }

        Long nextQuestionerId = game.getCurrentQuestionerId();
        resultDto.setNextTurnDto(
            NextTurnDto.builder()
                .nextPlayerId(nextQuestionerId)
                .nextPlayerNickname(game.getPlayers().get(nextQuestionerId).getNickname()).build());
        return resultDto;
    }

    /**
     * 방장 응답 없음
     */
    public Boolean handleHostTimeout(Long roomId, Long userId, String nickname) {
        // 방 조회
        Room room = roomRepository.findById(roomId);
        if (room == null) {
            throw new RuntimeException("방을 찾을 수 없습니다.");
        }

        Game game = room.getCurrentGame();
        if (game == null) {
            throw new RuntimeException("게임을 찾을 수 없습니다.");
        }

        if (!Objects.equals(room.getHostId(), userId)) {
            throw new RuntimeException("방장이 아닙니다.");
        }

        // 1. 1차 타임아웃: 아직 경고가 발송되지 않은 경우
        if (game.getNoResponseCount() < 1) {
            // 경고 상태로 변경
            game.incrementNoResponseCount();
            // 다음 타임아웃 체크를 다시 스케줄링합니다. (예: 30초 뒤)
            eventPublisher.publishEvent(new HostWarningEvent(userId, roomId, nickname));
            return true;
        } else { // 이미 경고를 받은 경우
            handlePlayerDisconnect(userId, roomId, nickname, false);
            return false;
        }
    }

    public void endGame(Long roomId) {
        // 방 조회
        Room room = roomRepository.findById(roomId);
        if (room == null) {
            throw new RuntimeException("방을 찾을 수 없습니다.");
        }

        Game game = room.getCurrentGame();
        if (game == null) {
            throw new RuntimeException("게임을 찾을 수 없습니다.");
        }

        // UserSolvedProblem 저장 (타임아웃으로 인한 종료 - 승자 없음)
        saveUserSolvedProblems(room, game, null, false);

        Problem problem = room.getSelectedProblem();
        EndResponseDto endResponseDto = EndResponseDto.createEvent(roomId, problem, game.getRemainingQuestions(),
            "TIMEOUT", null, null, null, false, null);

        log.info("게임 전체 시간 타임아웃으로 종료됨 players={}, size={}", room.getPlayers().toString(), room.getPlayers().size());
        // 게임 종료 이벤트 발행
        eventPublisher.publishEvent(endResponseDto);

        // 게임 삭제
        deleteGameInfo(roomId);
    }

    // 참가자 이탈 처리
    public void handlePlayerDisconnect(Long userId, Long roomId, String nickname, Boolean isForce) {
        log.info("유저 이탈 처리: userId={}, roomId={}", userId, roomId);

        // 방 조회
        Room room = roomRepository.findById(roomId);

        Game game = room.getCurrentGame();

        Problem problem = room.getSelectedProblem();

        // 출제자인 경우
        if (room.getHostId().equals(userId)) {
            log.info("출제자 이탈 → 방장 권한 이양 후 게임 종료");

            log.info("출제자 제거 전 : players={}, size={}", room.getPlayers().toString(), room.getPlayers().size());
            // 기존 방장을 방에서 제거
            room.getPlayers().remove(userId);
            room.getPlayerOrder().remove(userId);
            roomRepository.removeUserRoom(userId);
            // 변경사항 저장
            roomRepository.save(room);
            log.info("출제자 제거 후 : players={}, size={}", room.getPlayers().toString(), room.getPlayers().size());


            // UserSolvedProblem 저장 (출제자 이탈로 인한 종료 - 승자 없음)
            saveUserSolvedProblems(room, game, null, false);

            // 응답 없음 횟수 리셋
            game.resetNoResponseCount();

            EndResponseDto endResponseDto = EndResponseDto.createEvent(roomId, problem, game.getRemainingQuestions(),
                "LEAVE_HOST",
                null, null, null, false, null);

            log.info("게임 중 출제자 이탈로 종료됨 players={}, size={}", room.getPlayers().toString(), room.getPlayers().size());

            // 게임 종료 event 발행
            eventPublisher.publishEvent(endResponseDto);

            // 게임 삭제 (게임→대기방 전환 + 새 방장 설정 포함)
            deleteGameInfo(roomId);

            log.debug("게임 종료: reason={}", endResponseDto.getEndReason());
            return;
        }

        // 참가자인 경우
        // 전체 남은 정답 시도에서 참가자의 남은 정답 시도를 뺌
        game.decrementRemainingGuess(game.getPlayers().get(userId).getAnswerAttempts());

        log.info("참가자 목록에서 제거 전 : players={}, size={}", room.getPlayers().toString(), room.getPlayers().size());
        // 참가자를 리스트에서 제거하고, 턴을 재계산함
        game.removePlayerFromTurn(userId);
        // 참가자를 방에서 제거
        room.getPlayers().remove(userId);
        room.getPlayerOrder().remove(userId);
        roomRepository.removeUserRoom(userId);
        // 변경사항 저장
        roomRepository.save(room);
        log.info("참가자 목록에서 제거 후 : players={}, size={}", room.getPlayers().toString(), room.getPlayers().size());

        // 참가자 목록 변경 이벤트 발행
        eventPublisher.publishEvent(PlayersUpdatedEvent.builder()
            .roomId(roomId)
            .leaveDto(LeaveDto.builder().userId(userId).nickname(nickname).build())
            .players(new ArrayList<>(game.getPlayers().values()))
            .turnOrderIds(game.getTurnOrder())
            .isForce(isForce).build());

        // 참가자가 없으면 게임 종료
        if (game.getPlayers().isEmpty()) {
            log.info("출제자만 남음 → 게임 종료");

            // UserSolvedProblem 저장 (출제자만 남음으로 인한 종료 - 승자 없음)
            saveUserSolvedProblems(room, game, null, false);

            EndResponseDto endResponseDto = EndResponseDto.createEvent(roomId, problem, game.getRemainingQuestions(),
                "ONLY_HOST",
                null, null, null, isForce, isForce ? userId : null);

            log.info("마지막 참가자가 이탈하여 종료됨 players={}, size={}", room.getPlayers().toString(), room.getPlayers().size());
            // 게임 종료 event 발행
            eventPublisher.publishEvent(endResponseDto);

            // 게임 삭제
            deleteGameInfo(roomId);
        }
    }

    private void deleteGameInfo(Long roomId) {
        Room room = roomRepository.findById(roomId);
        Game game = room.getCurrentGame();

        log.info("게임 종료 후 방 상태: roomId={}, hostId={}, players={}",
            roomId, room.getHostId(), room.getPlayers().keySet());

        log.info("game.getPlayer()={}", game.getPlayers().keySet());
        // 게임에서 대기방으로 참가자 정보 복원
        if (game != null && !game.getPlayers().isEmpty()) {
            // 게임 참가자들을 room으로 복원 (게임 중 나간 참가자 제외)
            for (Player gamePlayer : game.getPlayers().values()) {
                // room에 해당 플레이어가 없으면 추가 (게임 도중 연결이 끊어졌을 수도 있음)
                if (!room.getPlayers().containsKey(gamePlayer.getUserId())) {
                    room.getPlayers().put(gamePlayer.getUserId(), gamePlayer);
                    room.getPlayerOrder().add(gamePlayer.getUserId());
                }
            }
        }
        log.info("복원 후 방 상태: hostId={}, room.players={}", room.getHostId(), room.getPlayers().keySet());
        log.info("복원 후 게임 상태: game.getPlayer()={}", game.getPlayers().keySet());

        // 방장이 없다면 새 방장 설정
        Long currentHostId = room.getHostId();
        log.info("currentHostId={}", currentHostId);
        if (currentHostId == null || !room.getPlayers().containsKey(currentHostId)) {
            log.info("방장이 없기 때문에 새로운 방장 설정");
            if (!room.getPlayers().isEmpty()) {
                // 첫 번째 참가자를 새 방장으로 설정
                Long newHostId = room.getPlayers().keySet().iterator().next();
                room.setHostId(newHostId);

                Player newHost = room.getPlayers().get(newHostId);
                newHost.setRole(PlayerRole.HOST);
                newHost.setReadyState(ReadyState.READY);

                log.info("새 방장 설정: roomId={}, newHostId={}", roomId, newHostId);
                log.info("새 방장 설정 후 값: hostId={}, room.players={}", room.getHostId(), room.getPlayers().values().stream().map(p -> p.getUserId() + "-> " + p.getRole()).toList());

                // 새 방장 알림 전송
                PlayerResponse newHostResponse = PlayerResponse.from(newHost);
                webSocketNotificationService.sendToTopic("/topic/room/" + roomId, "HOST_CHANGED", newHostResponse);

                // 새 방장에게 방장 화면 전환 알림
                RoomResponse hostRoomResponse = RoomResponse.from(room, true);
                webSocketNotificationService.sendToUser(newHostId, "/queue/room", "ROOM_UPDATED", hostRoomResponse);
            }
        }

        // 게임 삭제
        room.setCurrentGame(null);

        // room 상태 변경
        room.setState(RoomState.WAITING);

        // 모든 player 상태 변경 (대기방 상태로 리셋)
        room.getPlayers().values().forEach(player -> {
            if (player.getUserId().equals(room.getHostId())) {
                player.setRole(PlayerRole.HOST);
                player.setReadyState(ReadyState.READY);
            } else {
                player.setRole(PlayerRole.PARTICIPANT);
                player.setReadyState(ReadyState.WAITING);
            }
        });

        // 대기방으로 전환된 방 정보 브로드캐스트 (정답 포함)
        RoomResponse roomResponse2 = RoomResponse.from(room, true);
        log.info("players={}, size={}", roomResponse2.getPlayers().toString(), roomResponse2.getPlayers().size());
        webSocketNotificationService.sendToTopic("/topic/room/" + roomId, "END_GAME", roomResponse2);

        // 저장
        roomRepository.save(room);
        log.info("플레이어 상태 변경 후: hostId={}, room.players={}", room.getHostId(), room.getPlayers().values().stream().map(p -> p.getUserId() + "-> " + p.getRole()).toList());

        // 대기방 복귀 알림 전송
        RoomResponse roomResponse = RoomResponse.from(room, false);
        webSocketNotificationService.sendToTopic("/topic/room/" + roomId, "GAME_TO_WAITING", roomResponse);

        // 로비에 방 상태 변경 알림 전송 (게임 → 대기방)
        RoomListResponse lobbyResponse = roomService.getRooms(new com.ssafy.backend.room.dto.request.RoomListRequest());
        webSocketNotificationService.sendToTopic("/topic/lobby", "ROOM_LIST", lobbyResponse);

        log.info("게임 종료 및 대기방 복귀 완료: roomId={}, hostId={}, playerCount={}",
            roomId, room.getHostId(), room.getPlayers().size());
    }

    /**
     * 게임 종료 시 UserSolvedProblem 저장 및 User 통계 업데이트
     */
    @Transactional
    private void saveUserSolvedProblems(Room room, Game game, Long winnerId, boolean hasWinner) {
        Problem problem = room.getSelectedProblem();
        LocalDateTime now = LocalDateTime.now();

        // problemId가 숫자인지 확인 (창작문제는 UUID, 일반문제는 숫자)
        Long problemIdLong = null;
        try {
            problemIdLong = Long.parseLong(problem.getProblemId());
        } catch (NumberFormatException e) {
            // 창작문제(UUID)의 경우 - UserSolvedProblem에는 저장하지 않지만 User 통계는 업데이트
            log.info("창작문제 - UserSolvedProblem 저장 생략, User 통계만 업데이트: problemId={}", problem.getProblemId());
            updateUserStatistics(game, winnerId, hasWinner);
            return;
        }

        // 일반문제(숫자 ID) - UserSolvedProblem 저장 및 User 통계 업데이트
        final Long finalProblemId = problemIdLong;
        game.getPlayers().values().forEach(player -> {
            Long userId = player.getUserId();
            boolean isWinner = hasWinner && userId.equals(winnerId);

            UserSolvedProblem userSolvedProblem = UserSolvedProblem.builder()
                .userId(userId)
                .problemId(finalProblemId)
                .isWinner(isWinner)
                .solvedAt(now)
                .solveType(SolveType.NORMAL)
                .build();

            userSolvedProblemRepository.save(userSolvedProblem);
            
            // 각 사용자의 문제 플레이마다 playCount 증가
            incrementProblemPlayCount(finalProblemId);
        });

        // User 통계 업데이트
        updateUserStatistics(game, winnerId, hasWinner);

        log.info("UserSolvedProblem 저장 및 User 통계 업데이트 완료: problemId={}, 참가자 수={}, 승자={}",
            finalProblemId, game.getPlayers().size(), winnerId);
    }

    /**
     * 게임 참가자들의 User 테이블 통계 업데이트
     */
    @Transactional
    private void updateUserStatistics(Game game, Long winnerId, boolean hasWinner) {
        game.getPlayers().values().forEach(player -> {
            Long userId = player.getUserId();
            boolean isWinner = hasWinner && userId.equals(winnerId);

            // User 조회
            User user = userRepository.findByUserId(userId).orElse(null);
            if (user != null) {
                // 게임 통계 업데이트
                user.updateGameStats(isWinner);

                userRepository.save(user);
                log.debug("사용자 통계 업데이트: userId={}, totalGames={}, wins={}",
                    userId, user.getTotalGames(), user.getWins());
            } else {
                log.warn("통계 업데이트 실패 - 사용자를 찾을 수 없음: userId={}", userId);
            }
        });
    }

    /**
     * 사용자별 문제 플레이 수 증가
     */
    private void incrementProblemPlayCount(Long problemId) {
        try {
            // DB에 저장된 문제인지 확인 후 playCount 증가
            problemInfoRepository.findById(problemId).ifPresent(problemInfo -> {
                problemInfo.incrementPlayCount();
                problemInfoRepository.save(problemInfo);
                log.debug("사용자 플레이 기록 - 문제 플레이 수 증가: problemId={}, playCount={}", problemId, problemInfo.getPlayCount());
            });
        } catch (Exception e) {
            log.error("문제 플레이 수 증가 실패: problemId={}", problemId, e);
        }
    }

}
