package com.ssafy.backend.entity;

import com.ssafy.backend.common.enums.SocialProvider;
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
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "social_id", nullable = false)
    private String socialId;

    @Enumerated(EnumType.STRING)
    @Column(name = "social_provider")
    private SocialProvider provider;

    @Column(name = "nickname", nullable = false)
    private String nickname;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "total_games")
    private Integer totalGames;

    @Column(name = "wins")
    private Integer wins;

    @Column(name = "is_deleted", nullable = false)
    private Boolean deleted;

    @Column(name = "role", nullable = false)
    private String role;  // "USER", "ADMIN" 등

    @Column(name = "today_ai_solved_count")
    private Integer todayAiSolvedCount;

    @Column(name = "expires_at", nullable = true)
    private LocalDateTime expiresAt;


    /**
     * 새로운 User 인스턴스를 생성합니다.
     *
     * @param socialId 소셜 로그인 ID.
     * @param provider 소셜 로그인 제공자.
     * @param nickname 유저의 닉네임.
     * @param createdAt 유저 계정 생성일.
     * @param deleted 유저 계정 삭제 여부. 계정이 삭제된 경우 `true`, 아니면 `false`.
     * @param role 유저 권한 종류. ADMIN 아니면 USER
     * @param expiresAt 게스트유저 만료 여부.
     */

    @Builder
    public User(String socialId, SocialProvider provider, String nickname, LocalDateTime createdAt, Boolean deleted,  String role, LocalDateTime expiresAt) {
        this.socialId = socialId;
        this.provider = provider;
        this.nickname = nickname;
        this.createdAt = createdAt;
        this.totalGames = 0;
        this.wins = 0;
        this.deleted = deleted;
        this.role = role;
        this.todayAiSolvedCount = 0;
        this.expiresAt = expiresAt;
    }
    
    /**
     * 게임 통계 업데이트를 위한 메서드들
     */
    public void setTotalGames(Integer totalGames) {
        this.totalGames = totalGames;
    }
    
    public void setWins(Integer wins) {
        this.wins = wins;
    }
    
    /**
     * 게임 결과 업데이트
     * @param isWinner 게임에서 승리했는지 여부
     */
    public void updateGameStats(boolean isWinner) {
        this.totalGames = (this.totalGames != null ? this.totalGames : 0) + 1;
        if (isWinner) {
            this.wins = (this.wins != null ? this.wins : 0) + 1;
        }
    }

    /**
     * 게스트 사용자 여부 확인
     */
    public boolean isGuest() {
        return SocialProvider.guest.equals(this.provider);
    }

    /**
     * 만료 여부 확인 (null 안전)
     */
    public boolean isExpired() {
        // 게스트가 아니면 만료되지 않음
        if (!isGuest()) {
            return false;
        }

        // expiresAt이 null이면 만료되지 않음 (안전장치)
        if (this.expiresAt == null) {
            return false;
        }

        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    /**
     * Wins 업데이트
     */
    public void increaseWins() {
        this.wins = (this.wins != null ? this.wins : 0) + 1;
    }

    /**
     * totalGames 업데이트
     */
    public void increaseTotalGames() {
        this.totalGames = (this.totalGames != null ? this.totalGames : 0) + 1;
    }

    /**
     * today AI 사건 해결 수 업데이트
     */
    public void increaseTodayAiSolvedCount() {
        this.todayAiSolvedCount = (this.todayAiSolvedCount != null ? this.todayAiSolvedCount : 0) + 1;
    }
}