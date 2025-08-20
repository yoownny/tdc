package com.ssafy.backend.repository;

import com.ssafy.backend.entity.Problem;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepository extends JpaRepository<Problem,Long> {

    // 오늘의 AI 문제 조회 (isToday & 오늘 생성)
    Optional<Problem> findByIsTodayAndCreatedAtBetween(boolean b, LocalDateTime startOfDay, LocalDateTime endOfDay);

    // 오늘의 AI 문제들 중 가장 최신의 만들어진 문제 조회 (어제의 AI 문제)
    Optional<Problem> findTopByIsTodayTrueOrderByCreatedAtDesc();
}
