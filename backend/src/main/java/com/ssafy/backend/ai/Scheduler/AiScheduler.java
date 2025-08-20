package com.ssafy.backend.ai.Scheduler;

import com.ssafy.backend.ai.service.AiProblemRedisService;
import com.ssafy.backend.ai.service.AiProblemService;
import com.ssafy.backend.entity.Problem;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiScheduler {

    private final AiProblemService aiProblemService;
    private final AiProblemRedisService aiProblemRedisService;

    /**
     * 오늘의 AI 바거슾 문제 생성 00:00:05
     */
    @Scheduled(cron = "5 0 0 * * *", zone = "Asia/Seoul")
    @Transactional
    public void createTodayAiProblem() {
        // 오늘의 AI 바거슾 생성 후 DB에 저장
        Problem newProblem = aiProblemService.generateAiTodayProblem();

        // Redis 어제 문제 & 유저 history 캐시 삭제
        aiProblemRedisService.evictYesterdayProblemCache();
        log.info("오늘의 문제 Redis 캐시를 삭제했습니다.");

        // 생성된 문제를 Redis에 캐싱
        aiProblemRedisService.cacheTodayProblem(newProblem);
        log.info("새로운 '오늘의 문제'를 Redis에 캐싱했습니다.");
    }

//    // 23:59:55 오늘 도전자→DB 반영
//    @Scheduled(cron = "55 59 23 * * *", zone = "Asia/Seoul")
//    public void flushChallengers() {
//        problemRepo.findTodaysAiProblem()
//            .ifPresent(p -> game.flushChallengersToDb(p.getProblemId()));
//    }
}