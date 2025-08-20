package com.ssafy.backend.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.backend.entity.Problem;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiProblemRedisService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final long TTL_SECONDS = 86400; // 24시간
    private static final String TODAY_PROBLEM_KEY = "ai_today_problem"; // 오늘 문제
    private static final String USER_HISTORY_PREFIX = "ai_user_history:"; // 유저별 기록

    private String getUserHistoryKey(Long problemId, Long userId) {
        return USER_HISTORY_PREFIX + problemId + ":user:" + userId;
    }

    private String getTodayProblemKey(LocalDate date) {
        return TODAY_PROBLEM_KEY + ":" + date;
    }

    /**
     * 오늘의 AI 문제 캐싱
     */
    public void cacheTodayProblem(Problem problem) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextDayStart = LocalDate.now().plusDays(1).atStartOfDay();
        long secondsUntilTomorrow = Duration.between(now, nextDayStart).getSeconds();

        redisTemplate.opsForValue().set(getTodayProblemKey(LocalDate.now()), problem, Duration.ofSeconds(secondsUntilTomorrow));
    }

    /**
     * 오늘의 AI 문제 조회
     */
    public Problem getTodayProblem() {
        return (Problem) redisTemplate.opsForValue().get(getTodayProblemKey(LocalDate.now()));
    }

    /**
     * 질문 추가
     */
    public void addQuestion(Long problemId, Long userId, String question, String answer) {
        modifyHistory(problemId, userId, "question", Map.of("userQuestion", question, "response", answer));
    }

    /**
     * 질문과 코멘트 함께 추가
     */
    public void addQuestion(Long problemId, Long userId, String question, String answer, String comment) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("userQuestion", question);
        entry.put("response", answer);
        if (comment != null && !comment.trim().isEmpty()) {
            entry.put("comment", comment);
        }
        modifyHistory(problemId, userId, "question", entry);
    }

    /**
     * 정답 시도 추가
     */
    public void addGuess(Long problemId, Long userId, String guess, String message, int score, boolean isCorrect) {
        modifyHistory(problemId, userId, "guess", Map.of("userAnswer", guess, "score", score, "isCorrect", isCorrect, "message", message));
    }

    /**
     * 정답 시도와 코멘트 함께 추가
     */
    public void addGuess(Long problemId, Long userId, String guess, String message, int score, boolean isCorrect, String comment) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("userAnswer", guess);
        entry.put("score", score);
        entry.put("isCorrect", isCorrect);
        entry.put("message", message);
        if (comment != null && !comment.trim().isEmpty()) {
            entry.put("comment", comment);
        }
        modifyHistory(problemId, userId, "guess", entry);
    }

    /**
     * 정답 시도와 사용자/AI 코멘트 함께 추가
     */
    public void addGuessWithAiComment(Long problemId, Long userId, String guess, String message, int score, boolean isCorrect, String userComment, String aiComment) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("userAnswer", guess);
        entry.put("score", score);
        entry.put("isCorrect", isCorrect);
        entry.put("message", message);
        if (userComment != null && !userComment.trim().isEmpty()) {
            entry.put("userComment", userComment);
        }
        if (aiComment != null && !aiComment.trim().isEmpty()) {
            entry.put("comment", aiComment);
        }
        modifyHistory(problemId, userId, "guess", entry);
    }

    /**
     * 사용자 통계 조회
     */
    public Map<String, Object> getUserStats(Long problemId, Long userId) {
        try {
            String key = getUserHistoryKey(problemId, userId);
            Object obj = redisTemplate.opsForValue().get(key);
            if (obj == null) return null;
            return objectMapper.readValue(obj.toString(), new TypeReference<>() {});
        } catch (Exception e) {
            log.error("사용자 통계 조회 실패: problemId={}, userId={}", problemId, userId, e);
            return null;
        }
    }

    /**
     * 사용자 세션 삭제
     */
    public void deleteUserSession(Long problemId, Long userId) {
        try {
            redisTemplate.delete(getUserHistoryKey(problemId, userId));
        } catch (Exception e) {
            log.error("사용자 세션 삭제 실패: problemId={}, userId={}", problemId, userId, e);
        }
    }

    /**
     * 오늘 문제 + 유저 히스토리 전체 삭제
     * - 스케줄러에서 "내일 문제 생성 직전" 호출
     */
    public void evictYesterdayProblemCache() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        String yesterdayKey = getTodayProblemKey(yesterday);
        Problem yesterdayProblem = (Problem) redisTemplate.opsForValue().get(yesterdayKey);

        if (yesterdayProblem != null) {
            Long problemId = yesterdayProblem.getId();

            // 유저 히스토리 삭제
            Set<String> userHistoryKeys = redisTemplate.keys(USER_HISTORY_PREFIX + problemId + ":user:*");
            if (!userHistoryKeys.isEmpty()) {
                redisTemplate.delete(userHistoryKeys);
                log.info("어제 문제 유저 히스토리 삭제 완료. ProblemId: {}", problemId);
            }

            // 어제 문제 캐시 삭제
            redisTemplate.delete(yesterdayKey);
            log.info("어제 문제 캐시 삭제 완료. Key: {}", yesterdayKey);
        } else {
            log.info("어제 문제 캐시가 존재하지 않습니다. Key: {}", yesterdayKey);
        }
    }

    // ----------------- private helper -----------------

    /**
     * 질문/정답 시도 기록을 수정하는 공통 메서드
     */
    private void modifyHistory(Long problemId, Long userId, String type, Map<String, Object> entry) {
        try {
            // key로 조회
            String key = getUserHistoryKey(problemId, userId);
            Map<String, Object> data = getOrInitData(key);

            // 질문 또는 정답 시도 카운트 증가
            String countKey = type + "_count";
            int count = (int) data.getOrDefault(countKey, 0);
            data.put(countKey, count + 1);

            // 히스토리 추가
            String historyKey = type + "_history";
            List<Map<String, Object>> history = (List<Map<String, Object>>) data.get(historyKey);
            history.add(entry);

            // Redis 저장 -> 문제 TTL에 맞춤
            saveData(key, data);
            log.info("{} history 추가 완료: problemId={}, userId={}", type.equals("question") ? "질문" : "정답 시도", problemId, userId);

        } catch (Exception e) {
            log.error("{} history 추가 실패: problemId={}, userId={}", type.equals("question") ? "질문" : "정답 시도", problemId, userId, e);
        }
    }

    private Map<String, Object> getOrInitData(String key) throws Exception {
        Object obj = redisTemplate.opsForValue().get(key);
        if (obj != null) {
            return objectMapper.readValue(obj.toString(), new TypeReference<>() {});
        }

        Map<String, Object> data = new HashMap<>();
        data.put("question_count", 0);
        data.put("guess_count", 0);
        data.put("question_history", new ArrayList<Map<String, String>>());
        data.put("guess_history", new ArrayList<Map<String, String>>());
        return data;
    }

    private void saveData(String key, Map<String, Object> data) throws Exception {
        String json = objectMapper.writeValueAsString(data);

        // 오늘 문제 키 TTL 조회
        String todayProblemKey = getTodayProblemKey(LocalDate.now());
        long ttl = redisTemplate.getExpire(todayProblemKey);

        // 문제 TTL이 남아있다면 그대로 적용, 없으면 기본값 하루
        if (ttl <= 0) {
            ttl = TTL_SECONDS; // 24시간
        }
        redisTemplate.opsForValue().set(key, json, Duration.ofSeconds(ttl));
    }
}
