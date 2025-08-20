package com.ssafy.backend.entity;

import com.ssafy.backend.common.enums.Source;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "problems")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "problem_id")
    private Long id;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;

    @Column(nullable = false, length = 50)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Source source;

    @Column(name = "is_today")
    private Boolean isToday;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;


    /**
     * 새로운 Problem 인스턴스를 생성합니다.
     *
     * @param creatorId 문제를 생성한 사용자의 ID.
     * @param title 문제의 제목.
     * @param content 문제의 내용.
     * @param answer 문제에 대한 정답.
     * @param source 문제의 출처.
     * @param isToday 오늘의 AI 문제 여부.
     * @param createdAt 문제 생성 일시.
     */

    @Builder
    public Problem(Long creatorId, String title, String content, String answer, Source source, LocalDateTime createdAt, Boolean isToday) {
        this.creatorId = creatorId;
        this.title = title;
        this.content = content;
        this.answer = answer;
        this.source = source;
        this.isToday = isToday;
        this.createdAt = createdAt;
    }
}

