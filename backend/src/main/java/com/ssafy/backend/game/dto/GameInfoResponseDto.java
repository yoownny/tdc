package com.ssafy.backend.game.dto;

import com.ssafy.backend.memory.Player;
import com.ssafy.backend.memory.type.RoomState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GameInfoResponseDto {
    private Long roomId;
    private RoomState roomState;
    private GameStatus gameStatus;
    private CurrentTurn currentTurn;
    private List<Player> players;
    private List<PlayerInfoDto> turnOrder;

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class GameStatus {
        private int remainingQuestions;
        private int totalQuestions;
    }

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CurrentTurn {
        private Long questionerId;
        private String nickname;
        private int turnIndex;
    }
}

