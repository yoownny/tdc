import { openHostAcceptDialog } from "@/components/dialogs/TransferHostDialog";
import useGameStore from "@/stores/gameStore";
import useLobbyStore from "@/stores/lobbyStore";
import useProblemStore from "@/stores/problemStore";
import useRoomStore from "@/stores/roomStore";
import { type WebsocketResponse } from "@/types/game/game";
import { type User } from "@/types/user";
import { leaveRoom } from "./subscription";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const getRoomList = useLobbyStore.getState().getRoomList;
const { resetProblem, joinAsHost, joinAsPlayer } = useProblemStore.getState();
const {
  setRoom,
  resetRoom,
  joinPlayer,
  leavePlayer,
  updateHost,
  newHost,
  addChatting,
  updatePlayerStatus,
  updateSetting,
} = useRoomStore.getState();
const { setResultOpen } = useGameStore.getState();

// 방 설정 개인 WS 수신
// /user/queue/room
export function onRoomSetting(response: WebsocketResponse) {
  console.log("Room status Changed: ", response.eventType);
  const payload = response.payload;
  console.log(payload);

  switch (response.eventType) {
    // 방 목록 전체 수신
    case "ROOM_LIST": {
      const rooms = payload.rooms ?? [];
      getRoomList(
        rooms.map((room: any) => {
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
              nickname:
                hostPlayer?.nickname || hostPlayer?.name || "알 수 없음",
            },
          };
        })
      );
      break;
    }

    // 방 생성 및 입장 (방장)
    case "ROOM_CREATED": {
      const problem = payload.problem;

      setRoom({
        ...payload,
        participants: payload.players.map((player: any) => ({
          id: player.userId,
          name: player.nickname,
          isHost: player.role === "HOST" ? true : false,
          status: player.state,
        })),
        numPlayers: payload.currentPlayers,
      });
      // 문제 정보 설정 (방장 기준)
      joinAsHost({
        ...problem,
        createdBy: problem.creator.nickname,
        problemType: problem.source, // 추후 AI 추가 예정
      });
      break;
    }

    // 방 입장 (참가자)
    case "ROOM_JOINED": {
      const problem = payload.problem;

      setRoom({
        ...payload,
        participants: payload.players.map((player: any) => ({
          id: player.userId,
          name: player.nickname,
          isHost: player.role === "HOST" ? true : false,
          status: player.readyState,
        })),
        numPlayers: payload.currentPlayers,
      });
      // 문제 정보 설정 (참가자 기준)
      joinAsPlayer({
        ...problem,
        answer: "",
        createdBy: problem.creator.nickname,
        problemType: problem.source, // 추후 AI 추가 예정
      });
      break;
    }

    // 4분 30초가 지나도 방장이 시작 안할 시 경고 알림
    case "ROOM_TIMER_WARNING": {
      useRoomStore.getState().setTimerWarning(true);
      console.log("방장 시작 경고:", payload);
      break;
    }

    // 5분이 지나도 게임을 시작하지 않아 방장 강퇴 알림
    case "ROOM_TIMEOUT": {
      console.log("방장 강퇴:", payload);
      useRoomStore.getState().setHostTimeout(true);

      // 방장 타임아웃 추적
      track("host_timeout_occurred", {
        room_id: useRoomStore.getState().roomId,
        timeout_reason: "game_start_delay",
        timestamp: getKoreanTimestamp(),
      });

      break;
    }

    // 새로운 방장 수신
    case "ROOM_UPDATED": {
      const problem = payload.problem;

      joinAsHost({
        ...problem,
        createdBy: problem.creator.nickname,
        problemType: problem.source, // 추후 AI 추가 예정
      });
      break;
    }

    // 방 퇴장
    case "ROOM_LEFT":
      {
        const roomId = useRoomStore.getState().roomId;

        console.log("🚪 [ROOM_LEFT] 서버 수신 (방 퇴장 성공):", {
          roomId,
          timestamp: new Date().toISOString(),
          payload,
        });

        // Store 정리
        resetRoom();
        resetProblem();

        // sessionStorage에서도 방 정보 완전 삭제
        sessionStorage.removeItem("room-storage");
        sessionStorage.removeItem("game-storage");

        leaveRoom(roomId);

        // 서버 응답을 받았으므로 로비로 이동 (히스토리 대체)
        window.location.replace("/lobby");
      }
      break;

    // 대상자에게 방장 권한 요청 알림
    case "HOST_TRANSFER_REQUEST": {
      openHostAcceptDialog();
      // todo; state와 연결
      // console.log({
      //   requesterId: payload.requesterId,
      //   requesterNickname: payload.requesterNickname,
      //   roomId: payload.roomId,
      // });
      break;
    }

    // 방장에게 방장 권한 요청 전송 완료 알림
    case "HOST_TRANSFER_SENT": {
      // todo; state와 연결
      // console.log({
      //   targetUserId: payload.targetUserId,
      //   targetNickname: payload.targetNickname,
      //   message: payload.message,
      // });
      break;
    }

    // 방장에게 방장 권한 요청 거절 알림
    case "HOST_TRANSFER_DECLINED": {
      // todo; state와 연결
      // console.log({
      //   targetUserId: payload.targetUserId,
      //   targetNickname: payload.targetNickname,
      //   message: payload.message,
      // });
      break;
    }

    // 방 설정 변경 알림 (개인)
    case "ROOM_SETTINGS_UPDATED": {
      if (payload.updatedSettings) {
        updateSetting(
          payload.updatedSettings.maxPlayers,
          payload.updatedSettings.timeLimit
        );
      }
      break;
    }

    // 방 설정 변경 알림 (브로드캐스트)
    case "ROOM_SETTINGS_CHANGED": {
      updateSetting(payload.maxPlayers, payload.timeLimit);
      break;
    }

    // 문제 변경 알림
    case "PROBLEM_UPDATE_SUCCESS": {
      const problem = payload.problem;
      joinAsHost({
        ...problem,
        createdBy: problem.creator.nickname,
        problemType: problem.source, // 추후 AI 추가 예정
      });
      break;
    }
  }
}

// 대기 상태 방 내부 정보 WS 수신
// /topic/room/${roomId}
export function onWaitingRoom(response: WebsocketResponse) {
  console.log("Waiting Msg: ", response.eventType);
  const payload = response.payload;

  console.log(payload);

  switch (response.eventType) {
    // 참가자 입장
    case "PLAYER_JOINED":
      joinPlayer(
        {
          id: payload.userId,
          name: payload.nickname,
          isHost: payload.role === "HOST",
          status: "WAITING",
        },
        payload.currentPlayers
      );
      addChatting(
        "system",
        `${payload.nickname}님이 입장하였습니다.`,
        new Date().toISOString()
      );
      break;

    // 참가자 퇴장
    case "PLAYER_LEAVING": {
      const gameState = useRoomStore.getState().gameState;

      let leavingUserId: number;
      let leavingNickname: string = "알 수 없는 사용자";

      console.log("🚪 [PLAYER_LEAVING] 서버 수신 (참가자 퇴장):", {
        gameState,
        timestamp: new Date().toISOString(),
        payload,
      });

      if (typeof payload === "number") {
        leavingUserId = payload;
        console.log("payload is number:", leavingUserId);
      } else {
        leavingUserId = payload.userId;
        leavingNickname =
          payload.nickname || payload.name || "알 수 없는 사용자";
        console.log("payload.userId:", payload.userId);
        console.log("payload.nickname:", payload.nickname);
        console.log("payload.name:", payload.name);
      }

      // 현재 방의 참가자 목록에서 해당 userId로 닉네임 찾기
      const currentPlayers = useRoomStore.getState().players;
      console.log("currentPlayers:", currentPlayers);

      // userId 타입 변환
      const userIdAsNumber = Number(leavingUserId);
      const userIdAsString = String(leavingUserId);

      let leavingPlayer = currentPlayers.find(
        (player) => player.id === leavingUserId
      );

      // 첫 번째 시도가 실패하면 타입 변환해서 다시 시도
      if (!leavingPlayer) {
        leavingPlayer = currentPlayers.find(
          (player) => player.id === userIdAsNumber
        );
      }
      if (!leavingPlayer) {
        leavingPlayer = currentPlayers.find(
          (player) => String(player.id) === userIdAsString
        );
      }

      console.log("leavingPlayer:", leavingPlayer);
      console.log("leavingUserId type:", typeof leavingUserId);
      console.log("userIdAsNumber:", userIdAsNumber);
      console.log("userIdAsString:", userIdAsString);

      // 닉네임이 아직 설정되지 않았다면 찾은 플레이어의 이름 사용
      if (leavingNickname === "알 수 없는 사용자" && leavingPlayer) {
        leavingNickname = leavingPlayer.name;
      }
      console.log("leavingNickname:", leavingNickname);

      // 방장이 나가는 경우
      if (leavingPlayer?.isHost) {
        // 결과 모달이 열리지 않도록 resultOpen을 false로 설정
        setResultOpen(false);

        // 게임 중인 경우에만 즉시 로비로 이동
        if (gameState === "PLAYING") {
          // 채팅에 시스템 메시지 추가
          addChatting(
            "system",
            `방장 ${leavingNickname}님이 방을 나갔습니다. 게임이 종료됩니다.`,
            new Date().toISOString()
          );

          // 잠시 후 로비로 이동하도록 설정
          setTimeout(() => {
            const { resetRoom } = useRoomStore.getState();
            const { resetProblem } = useProblemStore.getState();
            const { clearGameData } = useGameStore.getState();
            const roomId = useRoomStore.getState().roomId;

            // 모든 상태 초기화
            resetRoom();
            resetProblem();
            clearGameData();

            // sessionStorage에서도 방 정보 완전 삭제
            sessionStorage.removeItem("room-storage");
            sessionStorage.removeItem("game-storage");

            // 웹소켓 구독 정리
            leaveRoom(roomId);

            // 로비로 이동 (히스토리 대체)
            window.location.replace("/lobby");
          }, 3000);
        } else {
          // 대기 중인 경우: 채팅만 추가하고 HOST_CHANGED 이벤트 대기
          addChatting(
            "system",
            `방장 ${leavingNickname}님이 방을 나갔습니다.`,
            new Date().toISOString()
          );

          // 참가자에서 방장 제거 (HOST_CHANGED에서 새 방장 설정됨)
          leavePlayer(leavingUserId);
        }
      } else {
        // 일반 참가자가 나가는 경우
        // 먼저 닉네임을 저장하고 나서 leavePlayer 호출
        const nicknameToUse = leavingNickname;

        // leavingUserId를 직접 전달하여 타입 일치시킴
        leavePlayer(leavingUserId);

        // 게임 중인 경우 gameStore의 players도 업데이트
        if (gameState === "PLAYING") {
          const { players: gamePlayers, currentPlayer } =
            useGameStore.getState();
          const updatedGamePlayers = gamePlayers.filter(
            (player) => player.id !== leavingUserId
          );

          // 현재 턴인 참가자가 나갔는지 확인
          const currentPlayerLeft = currentPlayer?.id === leavingUserId;

          useGameStore.setState({ players: updatedGamePlayers });

          // 현재 턴 참가자가 나갔으면 자동으로 턴 패스
          if (currentPlayerLeft && updatedGamePlayers.length > 0) {
            console.log(
              `현재 턴 참가자(${leavingUserId})가 퇴장했습니다. 자동으로 턴을 넘깁니다.`
            );

            // 방장을 제외한 참가자들 중에서 다음 턴 찾기
            const participants = updatedGamePlayers.filter((p) => !p.isHost);

            if (participants.length > 0) {
              const nextPlayer = participants[0]; // 첫 번째 참가자로 턴 변경

              // sendTurnOver의 방식과 동일하게 처리
              import("@/websocket/sender").then(({ sendChat }) => {
                const roomId = useRoomStore.getState().roomId;

                // 즉시 nextTurn 호출하여 턴 변경
                useGameStore.getState().nextTurn(nextPlayer.id);

                // 모든 플레이어에게 턴 변경을 알리는 채팅 메시지 전송
                if (roomId) {
                  sendChat(
                    roomId,
                    `__TURN_PASSED__${nextPlayer.id}__${nextPlayer.name}__`
                  );
                }

                console.log(
                  `자동 턴 패스 완료: ${nextPlayer.name}(${nextPlayer.id})`
                );
              });
            }
          }
        }

        addChatting(
          "system",
          `${nicknameToUse}님이 방을 나갔습니다.`,
          new Date().toISOString()
        );

        const { players, hostId } = useRoomStore.getState();
        if (
          players.length === 1 &&
          players[0].id === hostId &&
          gameState === "PLAYING"
        ) {
          addChatting(
            "system",
            "모든 참가자가 퇴장하여 게임이 종료됩니다.",
            new Date().toISOString()
          );

          if (gameState === "PLAYING") {
            // 게임 중이면 전체 퇴장
            setTimeout(() => {
              const { resetRoom } = useRoomStore.getState();
              const { resetProblem } = useProblemStore.getState();
              const { clearGameData } = useGameStore.getState();
              const roomId = useRoomStore.getState().roomId;

              resetRoom();
              resetProblem();
              clearGameData();

              // sessionStorage에서도 방 정보 완전 삭제
              sessionStorage.removeItem("room-storage");
              sessionStorage.removeItem("game-storage");

              // 웹소켓 구독 정리
              leaveRoom(roomId);

              window.location.replace("/lobby");
            }, 3000);
          }
        }
      }
      break;
    }

    // 방장이 바뀐 경우 (방장 퇴장, 권한 넘기기)
    case "HOST_CHANGED": {
      if (payload.oldHostId) {
        updateHost(payload.oldHostId, payload.newHostId);
      } else {
        newHost(payload.userId);
      }
      addChatting("system", `방장이 변경되었습니다.`, new Date().toISOString());
      break;
    }

    // 준비 상태 업데이트 (이벤트 타입 추가)
    case "READY_STATUS_CHANGED":
    case "ROOM_READY_STATUS_UPDATED":
      updatePlayerStatus(
        payload.participants.map((player: any) => ({
          id: player.userId,
          name: player.nickname,
          isHost: player.role === "HOST",
          status: player.readyState === "READY" ? "READY" : "WAITING",
        }))
      );
      break;

    // 4분 30초가 지나도 방장이 시작 안할 시 경고 알림
    case "ROOM_TIMER_WARNING": {
      useRoomStore.getState().setTimerWarning(true);
      addChatting("system", payload, new Date().toISOString());
      break;
    }

    // 5분이 지나도 방장이 시작하지 않아 방장 강퇴 알림
    case "ROOM_TIMEOUT": {
      useRoomStore.getState().setHostTimeout(true);
      addChatting("system", payload, new Date().toISOString());
      break;
    }

    // 방 설정 변경 알림
    case "ROOM_SETTINGS_CHANGED": {
      updateSetting(payload.maxPlayers, payload.timeLimit);
      addChatting(
        "system",
        `방 설정이 변경되었습니다.`,
        new Date().toISOString()
      );
      break;
    }

    // 방 문제 변경 알림
    case "ROOM_PROBLEM_UPDATED": {
      const problem = payload.problem;
      joinAsPlayer({
        ...problem,
        answer: "",
        createdBy: problem.creator.nickname,
        problemType: problem.source, // 추후 AI 추가 예정
      });
      addChatting("system", `문제가 변경되었습니다.`, new Date().toISOString());
      break;
    }

    // 게임 종료 후 대기방 전환
    case "END_GAME": {
      const problem = payload.problem;
      const { setRoom } = useRoomStore.getState();

      console.log("게임 종료 후 대기방 전환:", payload);
      console.log("🎮 InRoomHandler endReason:", payload.endReason);
      console.log("🎮 endReason 타입:", typeof payload.endReason);
      console.log(
        "🎮 EXHAUSTED_ATTEMPTS와 비교:",
        payload.endReason === "EXHAUSTED_ATTEMPTS"
      );
      console.log("problem.answer:", problem?.answer);
      console.log("payload.players:", payload.players);
      console.log("hostId:", payload.hostId);

      // 정답 횟수 소진인 경우 플래그 확인
      const isAnswerAttemptsExhausted =
        useGameStore.getState().isAnswerAttemptsExhausted;
      console.log(
        "🎮 InRoomHandler: isAnswerAttemptsExhausted 플래그:",
        isAnswerAttemptsExhausted
      );

      if (isAnswerAttemptsExhausted) {
        console.log(
          "🎮 InRoomHandler: 정답 횟수 소진 플래그 감지 - InGameHandler에서 처리, 여기서는 아무것도 안함"
        );
        return;
      }

      const participants = payload.players.map((player: any) => ({
        id: player.userId,
        name: player.nickname,
        isHost: player.role === "HOST",
        status: player.role === "HOST" ? "READY" : "WAITING",
      }));

      console.log("최종 participants:", participants);

      // 방 정보 업데이트 (참가자 정보 포함)
      setRoom({
        roomId: payload.roomId,
        gameState: "WAITING", // 강제로 WAITING 상태로 설정
        maxPlayers: payload.maxPlayers,
        numPlayers: payload.currentPlayers,
        hostId: payload.hostId,
        participants: participants as User[],
        timeLimit: payload.timeLimit,
      });

      // 게임 종료 후에는 정답을 포함하여 문제 정보 직접 설정
      joinAsHost({
        problemId: problem.problemId,
        title: problem.title,
        content: problem.content,
        answer: problem.answer || "", // 정답 포함
        difficulty: problem.difficulty,
        genres: problem.genres || [],
        creator: {
          id: problem.creator?.id || 0,
          nickname: problem.creator?.nickname || "",
        },
        problemType: problem.source || "ORIGINAL",
      });

      break;
    }
  }
}
