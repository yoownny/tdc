package com.ssafy.backend.ranking.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.backend.ranking.dto.RankingItem;
import com.ssafy.backend.ranking.dto.UserRankingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RankingCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String RANKING_ZSET_KEY = "problem_ranking_zset";
    private static final String RANKING_DETAILS_PREFIX = "problem_ranking_detail:";
    private static final String RANKING_USER_ZSET_KEY = "user_ranking_zset";
    private static final String USER_RANKING_DETAILS_PREFIX = "user_ranking_detail:";

    /**
     * Redis ZSET + String에 랭킹 저장
     */
    public void cacheRanking(List<RankingItem> ranking) {
        try {
            log.info("🔄 Redis ZSET 랭킹 캐시 시작...");

            // 1. 기존 데이터 삭제
            deleteExistingCache();

            // 2. ZSET + String으로 저장
            ranking.forEach(item -> {
                try {
                    // ZSET: problemId + score (정렬용)
                    redisTemplate.opsForZSet().add(
                            RANKING_ZSET_KEY,
                            item.getProblemId().toString(),
                            item.getScore()
                    );

                    // String: JSON으로 직렬화하여 저장
                    Map<String, Object> details = Map.of(
                            "title", item.getTitle(),
                            "likes", item.getLikes(),
                            "playCount", item.getPlayCount()
                    );

                    String detailKey = RANKING_DETAILS_PREFIX + item.getProblemId();
                    String detailJson = objectMapper.writeValueAsString(details);

                    redisTemplate.opsForValue().set(detailKey, detailJson, Duration.ofMinutes(15));

                } catch (Exception e) {
                    log.error("❌ 개별 랭킹 아이템 저장 실패: problemId={}", item.getProblemId(), e);
                }
            });

            // 3. ZSET TTL 설정
            redisTemplate.expire(RANKING_ZSET_KEY, Duration.ofMinutes(15));

            log.info("✅ Redis ZSET 랭킹 캐시 완료: {}개 문제", ranking.size());

        } catch (Exception e) {
            log.error("❌ Redis ZSET 캐시 실패", e);
        }
    }

    public void cacheUserRanking(List<UserRankingResponse.UserRankingItem> ranking) {
        // 상위 10명
        if (ranking.size() > 10) ranking = ranking.subList(0, 10);
        try {
            for (UserRankingResponse.UserRankingItem item : ranking) {
                String member = item.getNickname();
                long games = item.getTotalGame() == null ? 0L : item.getTotalGame();

                // ZSET에 닉네임, 점수 저장
                redisTemplate.opsForZSet().add(RANKING_USER_ZSET_KEY, member, (double) games);

                Map<String, Object> details = Map.of(
                        "nickname", member,
                        "totalGames", games
                );
                String detailKey = USER_RANKING_DETAILS_PREFIX + member;
                String detailJson = objectMapper.writeValueAsString(details);
                redisTemplate.opsForValue().set(detailKey, detailJson, Duration.ofMinutes(15));
            }
            redisTemplate.expire(RANKING_USER_ZSET_KEY, Duration.ofMinutes(15));
            log.info("✅ Redis 유저 랭킹 캐시 완료: {}명 유저", ranking.size());
        } catch (Exception e) {
            log.error("❌ 유저 랭킹 캐시 실패", e);
        }
    }

    /**
     * Redis ZSET에서 랭킹 조회 (String 기반)
     */
    public List<RankingItem> getCachedRanking(int limit) {
        try {
            // 1. ZSET에서 점수와 함께 problemId 조회
            Set<org.springframework.data.redis.core.ZSetOperations.TypedTuple<Object>> tuples =
                    redisTemplate.opsForZSet().reverseRangeWithScores(RANKING_ZSET_KEY, 0, limit - 1);

            if (tuples == null || tuples.isEmpty()) {
                log.warn("⚠️ ZSET 랭킹 캐시 미스");
                return null;
            }

            // 2. score와 problemId 함께 처리
            List<RankingItem> ranking = new ArrayList<>();
            AtomicInteger rank = new AtomicInteger(1);

            for (org.springframework.data.redis.core.ZSetOperations.TypedTuple<Object> tuple : tuples) {
                try {
                    String problemId = tuple.getValue().toString();
                    Double score = tuple.getScore();

                    String detailKey = RANKING_DETAILS_PREFIX + problemId;
                    Object detailObj = redisTemplate.opsForValue().get(detailKey);

                    if (detailObj != null && score != null) {
                        String detailJson = detailObj.toString();
                        Map<String, Object> details = objectMapper.readValue(
                                detailJson,
                                new TypeReference<Map<String, Object>>() {}
                        );

                        ranking.add(RankingItem.builder()
                                .problemId(Long.parseLong(problemId))
                                .title((String) details.get("title"))
                                .likes((Integer) details.get("likes"))
                                .playCount((Integer) details.get("playCount"))
                                .score(score)
                                .rank(rank.getAndIncrement())
                                .build());
                    }
                } catch (Exception e) {
                    log.error("❌ 개별 랭킹 데이터 파싱 실패: tuple={}", tuple, e);
                }
            }

            if (ranking.isEmpty()) {
                log.warn("⚠️ 랭킹 데이터 파싱 실패");
                return null;
            }

            log.debug("✅ ZSET 랭킹 캐시 히트: {}개 문제", ranking.size());
            return ranking;

        } catch (Exception e) {
            log.error("❌ ZSET 랭킹 조회 실패", e);
            return null;
        }
    }

    public List<UserRankingResponse.UserRankingItem> getCachedUserRanking(int limit) {
        try {
            // Redis ZSET에서 점수가 높은 순서대로 랭킹을 가져옴
            var tuples = redisTemplate.opsForZSet()
                    .reverseRangeWithScores(RANKING_USER_ZSET_KEY, 0, Math.max(0, limit - 1));

            if (tuples == null || tuples.isEmpty()) {
                log.warn("⚠️ 유저 랭킹 캐시 미스");
                return null;
            }

            List<UserRankingResponse.UserRankingItem> list = new ArrayList<>();
            for (var t : tuples) {
                if (t == null || t.getValue() == null || t.getScore() == null) continue;
                String nickname = t.getValue().toString();
                long games = t.getScore().longValue();
                list.add(UserRankingResponse.UserRankingItem.builder()
                        .nickname(nickname)
                        .totalGame(games)
                        .build());
            }
            return list;
        } catch (Exception e) {
            log.error("❌ 유저 랭킹 캐시 조회 실패", e);
            return null;
        }
    }

    /**
     * 기존 캐시 데이터 삭제
     */
    private void deleteExistingCache() {
        try {
            // ZSET 삭제
            redisTemplate.delete(RANKING_ZSET_KEY);

            // String 키들 삭제
            Set<String> detailKeys = redisTemplate.keys(RANKING_DETAILS_PREFIX + "*");
            if (detailKeys != null && !detailKeys.isEmpty()) {
                redisTemplate.delete(detailKeys);
            }

        } catch (Exception e) {
            log.error("❌ 기존 캐시 삭제 실패", e);
        }
    }
}