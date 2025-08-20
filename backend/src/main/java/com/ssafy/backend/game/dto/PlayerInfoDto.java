package com.ssafy.backend.game.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PlayerInfoDto {
    private Long userId;
    private String nickname;
}
