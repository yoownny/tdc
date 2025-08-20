package com.ssafy.backend.game.dto;

import lombok.*;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GameInfoResultDto {
    private Long roomId;
    private Integer TimeLimit;
    private GameInfoResponseDto gameInfoResponseDto;

    // 웹소켓 응답용
    public static GameInfoResultDto createGameInfoResultDto(int timeLimit, GameInfoResponseDto gameInfoResponseDto) {
        return GameInfoResultDto.builder()
                .TimeLimit(timeLimit)
                .gameInfoResponseDto(gameInfoResponseDto)
                .build();
    }

    // 이벤트용
    public static GameInfoResultDto createGameInfoResultEvent(Long roomId, int timeLimit, GameInfoResponseDto gameInfoResponseDto) {
        return GameInfoResultDto.builder()
                .roomId(roomId)
                .TimeLimit(timeLimit)
                .gameInfoResponseDto(gameInfoResponseDto)
                .build();
    }
}

