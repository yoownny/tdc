import useLobbyStore from "@/stores/lobbyStore";
import { type WebsocketResponse } from "@/types/game/game";

// Lobby에서 WS 수신
// /topic/lobby
export function onLobby(response: WebsocketResponse) {
  console.log("Lobby Msg: ", response.eventType);

  const payload = response.payload;

  switch (response.eventType) {
    // 방 목록 전체 수신
    case "ROOM_LIST": {
      const rooms = payload.rooms ?? [];
      const mapedRoomList = rooms.map((room: any) => {
        const hostPlayer = room.players?.find(
          (player: any) => player.userId === room.hostId
        );
        
        return {
          roomId: room.roomId,
          title: room.problem?.title || "제목 없음",
          currentPlayers: room.currentPlayers,
          maxPlayers: room.maxPlayers,
          gameState: room.state,
          problemType: room.problem?.source || "ORIGINAL",
          genres: room.problem?.genres || [],
          difficulty: room.problem?.difficulty || "NORMAL",
          timeLimit: room.timeLimit,
          host: {
            id: room.hostId,
            nickname: hostPlayer?.nickname || hostPlayer?.name || "알 수 없음",
          },
        };
      });
      useLobbyStore.getState().getRoomList(mapedRoomList);
      break;
    }

    // 방 업데이트 (참가자 수 변경, 상태 변경 등)
    case "ROOM_UPDATED": {
      console.log(payload);
      
      if (payload.roomId) {
        const hostPlayer = payload.players?.find(
          (player: any) => player.userId === payload.hostId
        );

        const updatedRoom = {
          roomId: payload.roomId,
          title: payload.problem.title,
          currentPlayers: payload.currentPlayers,
          maxPlayers: payload.maxPlayers,
          gameState: payload.state,
          problemType: payload.problem.source,
          genres: payload.problem.genres,
          difficulty: payload.problem.difficulty,
          timeLimit: payload.timeLimit,
          host: {
            id: payload.hostId,
            nickname: hostPlayer?.nickname || hostPlayer?.name || "알 수 없음",
          },
        };
        useLobbyStore.getState().updateRoom(payload.roomId, updatedRoom);
      }
      break;
    }

    // 새 방 생성됨
    case "ROOM_CREATED": {
      if (payload.roomId) {
        const hostPlayer = payload.players?.find(
          (player: any) => player.userId === payload.hostId
        );

        useLobbyStore.getState().createRoom({
          roomId: payload.roomId,
          title: payload.problem.title,
          currentPlayers: payload.currentPlayers,
          maxPlayers: payload.maxPlayers,
          gameState: payload.state,
          problemType: payload.problem.source,
          genres: payload.problem.genres,
          difficulty: payload.problem.difficulty,
          timeLimit: payload.timeLimit,
          host: {
            id: payload.hostId,
            nickname: hostPlayer?.nickname || hostPlayer?.name || "알 수 없음",
          },
        });
      }
      break;
    }

    // 방 삭제됨
    case "ROOM_DELETED": {
      if (payload.roomId) {
        useLobbyStore.getState().deleteRoom(payload.roomId);
      }
      break;
    }

    // 방 상태 변경 (게임 시작/종료 등)
    case "ROOM_STATUS_CHANGED": {
      if (payload.roomId && payload.currentPlayers !== undefined) {
        useLobbyStore.getState().updateRoom(payload.roomId, payload.currentPlayers);
      }
      break;
    }
  }
}
