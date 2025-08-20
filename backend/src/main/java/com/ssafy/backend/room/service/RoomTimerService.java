package com.ssafy.backend.room.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
@RequiredArgsConstructor
public class RoomTimerService {

    private final TaskScheduler taskScheduler;
    // Key: roomId, Value: 방의 타이머 정보(경고 + 타임아웃)를 담는 객체
    private final Map<Long, RoomTimerInfo> roomTimers = new ConcurrentHashMap<>();

    // 대기방 타이머 시간 상수
    private static final Duration WARNING_DURATION = Duration.ofMinutes(2).plusSeconds(30); // 2분 30초 후 경고
    private static final Duration TIMEOUT_DURATION = Duration.ofMinutes(3); // 3분 후 타임아웃

    /**
     * 모든 유저가 준비를 완료했을 때 타이머를 시작합니다.
     * 2분 30초 뒤 경고 알림, 3분 뒤 타임아웃 로직을 각각 실행합니다.
     *
     * @param roomId    방 ID
     * @param onWarning 2분 30초 경과 후 (30초 남았을 때) 실행될 로직
     * @param onTimeout 3분 경과 후 실행될 로직 (예: 방 해체 및 강퇴)
     */
    public void startRoomTimer(Long roomId, Runnable onWarning, Runnable onTimeout) {
        // 이미 해당 방에 타이머가 실행 중이면 중복 실행 방지
        if (roomTimers.containsKey(roomId)) {
            return;
        }

        Instant now = Instant.now();

        // 1. 2분 30초 뒤 실행될 경고 타이머 설정
        Instant warningInstant = now.plus(WARNING_DURATION);
        ScheduledFuture<?> warningTask = taskScheduler.schedule(onWarning, warningInstant);

        // 2. 3분 뒤 실행될 타임아웃 타이머 설정
        Instant timeoutInstant = now.plus(TIMEOUT_DURATION);
        ScheduledFuture<?> timeoutTask = taskScheduler.schedule(onTimeout, timeoutInstant);

        // 3. 두 타이머를 하나의 객체로 묶어서 관리
        RoomTimerInfo timerInfo = new RoomTimerInfo(warningTask, timeoutTask);
        roomTimers.put(roomId, timerInfo);
    }

    /**
     * 방장이 게임을 시작했거나 방이 해체될 때, 설정된 모든 타이머(경고, 타임아웃)를 취소합니다.
     *
     * @param roomId 방 ID
     */
    public void cancelRoomTimer(Long roomId) {
        RoomTimerInfo timerInfo = roomTimers.remove(roomId);
        if (timerInfo != null) {
            timerInfo.cancelAll();
        }
    }

    /**
     * 특정 방의 경고 및 타임아웃 타이머 정보를 담는 내부 클래스.
     * 두 타이머를 하나의 단위로 관리하기 위해 사용합니다.
     */
    @Getter
    private static class RoomTimerInfo {
        private final ScheduledFuture<?> warningTask;
        private final ScheduledFuture<?> timeoutTask;

        public RoomTimerInfo(ScheduledFuture<?> warningTask, ScheduledFuture<?> timeoutTask) {
            this.warningTask = warningTask;
            this.timeoutTask = timeoutTask;
        }

        /**
         * 이 방과 관련된 모든 스케줄된 작업을 취소합니다.
         */
        public void cancelAll() {
            if (warningTask != null) {
                warningTask.cancel(false);
            }
            if (timeoutTask != null) {
                timeoutTask.cancel(false);
            }
        }
    }
}
