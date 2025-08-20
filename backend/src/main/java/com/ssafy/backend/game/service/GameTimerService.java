package com.ssafy.backend.game.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
@RequiredArgsConstructor
public class GameTimerService {

    private final TaskScheduler taskScheduler;
    private final Map<Long, ScheduledFuture<?>> gameTimers = new ConcurrentHashMap<>(); // 종료 타이머
    private final Map<Long, Instant> gameStartTimes = new ConcurrentHashMap<>(); // 시작 시간
    private final Map<Long, ScheduledFuture<?>> hostTimers = new ConcurrentHashMap<>(); // 방장 응답 없음 타이머

    // 게임 시작 시 타이머 등록
    public void startGameTimer(Long roomId, int timeLimit, Runnable onTimeout) {
        Instant startTime = Instant.now();
        Instant endTime = Instant.now().plusSeconds(timeLimit * 60L); // 시간 설정

        // 시작 시간 저장
        gameStartTimes.put(roomId, startTime);

        // 타이머 등록
        // 종료 시 실행할 로직
        ScheduledFuture<?> future = taskScheduler.schedule(onTimeout, endTime);

        gameTimers.put(roomId, future);
    }

    // (수동 종료) 타이머 취소
    public void cancelGameTimer(Long roomId) {
        ScheduledFuture<?> future = gameTimers.remove(roomId);
        gameStartTimes.remove(roomId);
        if (future != null) {
            future.cancel(true);
        }
    }

    // 경과 시간 계산 (분:초 형식)
    public String getElapsedTimeFormatted(Long roomId) {
        Instant start = gameStartTimes.get(roomId);
        if (start == null) {
            return "00:00"; // 아직 시작 안 했거나 이미 끝난 경우
        }
        long elapsedSeconds = Instant.now().getEpochSecond() - start.getEpochSecond();
        long minutes = elapsedSeconds / 60;
        long seconds = elapsedSeconds % 60;
        return String.format("%02d:%02d", minutes, seconds);
    }

    // 방장 응답없음 타이머
    public void startHostTimer(Long roomId, Runnable onTimeout) {
        // 동일한 방에 대해 기존에 진행중인 액션 타이머가 있다면 취소
        cancelHostTimer(roomId);

        Instant triggerTime = Instant.now().plusSeconds(30L);
        ScheduledFuture<?> future = taskScheduler.schedule(onTimeout, triggerTime);
        hostTimers.put(roomId, future);
    }

    // 방장 응답없음 타이머 취소
    public void cancelHostTimer(Long roomId) {
        ScheduledFuture<?> future = hostTimers.remove(roomId);
        if (future != null) {
            future.cancel(false); // 현재 실행 중인 작업은 방해하지 않음
        }
    }
}

