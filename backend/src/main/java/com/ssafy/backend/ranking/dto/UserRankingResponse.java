package com.ssafy.backend.ranking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRankingResponse {

    private List<UserRankingItem> ranking;  // 랭킹 리스트
    private LocalDateTime lastUpdated;  // 갱신 시간

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserRankingItem {

        private String nickname;  // 닉네임
        private Long totalGame;  // 총 게임 수
    }
}
