package com.ssafy.backend.game.dto;

import com.ssafy.backend.memory.Player;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Builder
@Getter
public class PlayersUpdatedEvent {
    private Long roomId;
    private LeaveDto leaveDto;
    private List<Player> players;
    private List<Long> turnOrderIds;
    private List<PlayerInfoDto> turnOrder;
    private Boolean isForce;

    // 웹소켓 응답용
    public static PlayersUpdatedEvent createPlayerUpdateEvent(PlayersUpdatedEvent event) {
        // 1. players 리스트를 userId를 키로, Player 객체를 값으로 하는 Map으로 변환
        Map<Long, Player> playerMap = event.getPlayers().stream()
                .collect(Collectors.toMap(Player::getUserId, player -> player));

        // 2. turnOrderIds(userId 리스트)를 순회하며, Map에서 플레이어 정보를 찾아 PlayerInfoDto를 생성
        List<PlayerInfoDto> turnOrderInfo = event.getTurnOrderIds().stream()
                .map(userId -> {
                    Player player = playerMap.get(userId);
                    return new PlayerInfoDto(player.getUserId(), player.getNickname());
                })
                .collect(Collectors.toList());

        return PlayersUpdatedEvent.builder()
                .roomId(event.getRoomId())
                .leaveDto(event.getLeaveDto())
                .players(event.getPlayers())
                .turnOrder(turnOrderInfo)
                .build();
    }

}
