package com.ssafy.backend.entity;

import com.ssafy.backend.common.enums.SolveType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_solved_problems")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserSolvedProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "solved_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(name = "is_winner", nullable = false)
    private Boolean isWinner;

    @Column(name = "solved_at", nullable = false)
    private LocalDateTime solvedAt;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SolveType solveType;

    @Builder
    public UserSolvedProblem(Long userId, Long problemId, Boolean isWinner, LocalDateTime solvedAt, SolveType solveType) {
        this.userId = userId;
        this.problemId = problemId;
        this.isWinner = isWinner;
        this.solvedAt = solvedAt;
        this.solveType = solveType;
    }

    /**
     * 맞춘 문제로 변경
     */
    public void markAsWinner() {
        this.isWinner = true;
        this.solvedAt = LocalDateTime.now();
    }

    /**
     * 맞춘 시간 변경
     */
    public void updateSolvedAt() {
        this.solvedAt = LocalDateTime.now();
    }
}
