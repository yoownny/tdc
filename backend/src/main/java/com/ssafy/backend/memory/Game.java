package com.ssafy.backend.memory;

import com.ssafy.backend.memory.type.PlayerRole;
import lombok.Getter;
import lombok.Setter;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.function.Function;
import java.util.stream.Collectors;

// 한 판 게임 데이터
@Getter
public class Game {
    // 게임 진행 정보
    private int remainingQuestions; // 전체 남은 질문 수
    private int remainingGuess; // 전체 남은 정답 시도 횟수

    // 플레이어 정보
    private List<Long> turnOrder; // 턴 순서 (랜덤)
    @Setter
    private Long currentQuestionerId; // 현재 질문자
    @Setter
    private int currentTurnIndex = 0; // 현재 턴 인덱스
    private ConcurrentHashMap<Long, Player> players = new ConcurrentHashMap<>(); // 플레이어 상세 정보

    // 방장 정보
    private int noResponseCount = 0; // 응답없음 횟수

    // 게임 데이터 (한 판 끝나면 모두 삭제)
    private final Queue<AnswerAttempt> answerQueue = new ConcurrentLinkedQueue<>(); // 정답 시도 대기열
    private final List<QnA> gameHistory = Collections.synchronizedList(new ArrayList<>()); // 질문-답변 기록 (시간 순 저장)

    public Game(List<Long> playerIds, Map<Long, Player> roomPlayers, Long hostId) {
        // 턴 설정
        initGameInitialInfo(playerIds, hostId);

        // 플레이어 상태 초기화
        initializePlayersFrom(roomPlayers, hostId);

        // 첫 턴 설정
        setFirstTurn();
    }

    private void initGameInitialInfo(List<Long> playerIds, Long hostId) {
        if (playerIds == null || playerIds.isEmpty()) {
            throw new IllegalArgumentException("플레이어 정보가 없습니다.");
        }
        playerIds.remove(hostId);
        turnOrder = new ArrayList<>(playerIds);
        Collections.shuffle(turnOrder);
        remainingQuestions = 30;
        remainingGuess = playerIds.size() * 3;
    }

    public void initializePlayersFrom(Map<Long, Player> roomPlayers, Long hostId) {
        // 방장을 제외한 참가자들만 게임에 참여 (원본 roomPlayers는 수정하지 않음)
        players = (ConcurrentHashMap<Long, Player>) roomPlayers.entrySet().stream()
                .filter(entry -> !entry.getKey().equals(hostId)) // 방장 제외
                .map(Map.Entry::getValue)
                .peek(gamePlayer -> {
                    // 복사 생성자로 게임용 Player 생성
                    // Player gamePlayer = Player.forGame(roomPlayer);
                    // todo; 얕은 복사 상태임

                    // 역할 설정
                    if (gamePlayer.getUserId().equals(currentQuestionerId)) {
                        gamePlayer.setRole(PlayerRole.QUESTIONER);
                    } else {
                        gamePlayer.setRole(PlayerRole.PARTICIPANT);
                    }
                    gamePlayer.setAnswerAttempts(3);
                    gamePlayer.setNoResponseCount(0);

                })
                .collect(Collectors.toConcurrentMap(
                        Player::getUserId,
                        Function.identity()
                ));
    }

    // 첫 턴 설정
    private void setFirstTurn() {
        if (!turnOrder.isEmpty()) {
            currentQuestionerId = turnOrder.getFirst();
            currentTurnIndex = 0;
        }
    }

    // 안전한 gameHistory getter - 방어적 복사
    public List<QnA> getGameHistory() {
        synchronized (gameHistory) {
            return new ArrayList<>(gameHistory);
        }
    }

    // 가장 최신 질문 반환 -> 마지막 질문이 무조건 답변 대기중인 질문
    public QnA getLastQnA() {
        synchronized (gameHistory) {
            return gameHistory.isEmpty() ? null : gameHistory.getLast();
        }
    }

    // 안전한 QnA 추가
    public void addQnA(QnA qna) {
        gameHistory.add(qna); // Collections.synchronizedList의 add()는 이미 동기화됨
    }


    // 턴 관리
    // 주어진 플레이어가 현재 질문자인지 확인
    public boolean isCurrentQuestioner(Long playerId) {
        return Objects.equals(currentQuestionerId, playerId);
    }

    // 현재 턴이 유효한지 확인 (질문자가 존재하고 게임이 진행 중인지)
    public boolean validateTurn() {
        return currentQuestionerId != null && !isFinished();
    }

    // 현재 턴 관리 메서드 추가
    public Long getNextQuestioner() {
        if (turnOrder.isEmpty()) return null;

        int nextIndex = (currentTurnIndex + 1) % turnOrder.size();
        return turnOrder.get(nextIndex);
    }

    // 질문 횟수 차감
    public void minusRemainingQuestions() {
        remainingQuestions--;
    }

    // 다음 턴으로 넘기기
    public void advanceTurn() {
        if (turnOrder.isEmpty()) return;

        currentTurnIndex = (currentTurnIndex + 1) % turnOrder.size();
        currentQuestionerId = turnOrder.get(currentTurnIndex);
    }

    // 특정 플레이어가 나갔을 때 턴 순서 조정
    public void removePlayerFromTurn(Long playerId) {
        // 1. players Map에서도 제거
        players.remove(playerId);

        // 2. turnOrder에서 플레이어 위치 찾기
        int removedIndex = turnOrder.indexOf(playerId);
        if (removedIndex == -1) {
            throw new RuntimeException("해당 참가자가 player가 아닙니다."); // 해당 플레이어가 turnOrder에 없음
        }

        // 3. turnOrder에서 제거
        turnOrder.remove(playerId);

        // 4. 모든 플레이어가 나간 경우
        if (turnOrder.isEmpty()) {
            currentQuestionerId = null;
            currentTurnIndex = 0;
            return;
        }

        // 5. 현재 턴 인덱스 조정
        if (removedIndex < currentTurnIndex) {
            // 제거된 사람이 현재 질문자보다 앞에 있었던 경우
            // 인덱스를 하나 감소시켜서 현재 질문자를 유지
            currentTurnIndex--;
        } else if (removedIndex == currentTurnIndex) {
            // 제거된 사람이 현재 질문자인 경우
            // 인덱스는 그대로 두고 (다음 사람이 현재 인덱스가 됨)
            // 만약 마지막 사람이었다면 처음으로 돌아감
            if (currentTurnIndex >= turnOrder.size()) {
                currentTurnIndex = 0;
            }
        }
        // removedIndex > currentTurnIndex인 경우는 인덱스 조정 불필요

        // 6. 현재 질문자 업데이트
        currentQuestionerId = turnOrder.get(currentTurnIndex);
    }

    // 게임 상태 확인
    public boolean isFinished() {
        return remainingQuestions <= 0 || turnOrder.isEmpty();
    }

    // Getters and Setters
//    public void setTurnStartTime(long turnStartTime) { this.turnStartTime = turnStartTime; }

    public void addAnswerAttempt(AnswerAttempt attempt) {
        answerQueue.offer(attempt);
    }

    // 정답 시도 큐
    public Optional<AnswerAttempt> peekOptionalAnswer() {
        return Optional.ofNullable(answerQueue.peek());
    }

    public AnswerAttempt popAnswer() {
        return answerQueue.poll();
    }

    public synchronized void decrementRemainingGuess(int count) {
        if (remainingGuess <= 0) {
            throw new IllegalStateException("정답 시도 횟수를 초과했습니다.");
        }
        remainingGuess -= count;
    }

    // 응답 없음 횟수 증가
    public synchronized void incrementNoResponseCount() {
        this.noResponseCount++;
    }

    // 응답 없음 초기화
    public synchronized void resetNoResponseCount() {
        this.noResponseCount = 0;
    }

}
