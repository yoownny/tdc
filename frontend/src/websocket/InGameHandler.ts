import useGameStore from "@/stores/gameStore";
import useProblemStore from "@/stores/problemStore";
import useRoomStore from "@/stores/roomStore";
import useUserStore from "@/stores/userStore";
import { type WebsocketResponse, type ServerPlayer } from "@/types/game/game";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import { track } from "@amplitude/analytics-browser";
import { leaveRoom, joinLobby } from "./subscription";

const { addChatting, updateRoomStatus, setRoom, leavePlayer } =
  useRoomStore.getState();
const openAnswer = useProblemStore.getState().openAnswer;
const {
  gameStart,
  gameOver,
  nextTurn,
  addInteraction,
  addHistory,
  dropOutPlayer,
  setResultOpen,
  setAnswerAttemptsExhaustedDialogOpen,
  setIsAnswerAttemptsExhausted,
  clearCurrentQuestion,
  processAnswerQueue,
} = useGameStore.getState();

// 방 내부 정보 WS 전체 수신
// /topic/games/${roomId}
export function onRoom(response: WebsocketResponse) {
  console.log("Room Msg: ", response.eventType);

  const payload = response.payload;

  console.log(payload);
  switch (response.eventType) {
    // 게임 시작
    case "GAME_STARTED": {
      const gameData = payload.gameInfoResponseDto;
      const clearChattings = useRoomStore.getState().clearChattings;

      // 게임 시작 시 채팅창 초기화
      clearChattings();

      // 서버에서 제공하는 turnOrder 배열을 기반으로 턴 번호 할당
      const turnOrder = gameData.turnOrder || [];

      console.log("🎮 [GAME_STARTED] 서버 turnOrder:", {
        turnOrder,
        currentTurn: gameData.currentTurn,
        players: gameData.players,
        timestamp: new Date().toISOString(),
      });

      // 플레이어 데이터 구성: 서버의 turnOrder 순서를 그대로 사용
      const playersWithTurnNumber = gameData.players.map(
        (player: ServerPlayer) => {
          if (player.role === "HOST") {
            return {
              id: player.userId,
              name: player.nickname,
              isHost: true,
              status: "PLAYING",
              answerAttempts: player.answerAttempts,
            };
          }

          // turnOrder 배열에서 현재 플레이어의 순서 찾기 (1부터 시작)
          const turnIndex = turnOrder.findIndex(
            (turnPlayer) => turnPlayer.userId === player.userId
          );
          const turnNumber = turnIndex !== -1 ? turnIndex + 1 : 0;

          return {
            id: player.userId,
            name: player.nickname,
            isHost: false,
            status: "PLAYING",
            answerAttempts: player.answerAttempts,
            turnNumber,
          };
        }
      );

      // 현재 턴 플레이어 정보도 서버 데이터 기반으로 구성
      const currentTurnPlayerId = gameData.currentTurn.questionerId;
      const currentTurnIndex = turnOrder.findIndex(
        (turnPlayer) => turnPlayer.userId === currentTurnPlayerId
      );
      const currentTurnNumber =
        currentTurnIndex !== -1 ? currentTurnIndex + 1 : 1;

      gameStart(
        gameData.roomId,
        playersWithTurnNumber,
        gameData.gameStatus.remainingQuestions,
        gameData.gameStatus.totalQuestions,
        {
          id: gameData.currentTurn.questionerId,
          name: gameData.currentTurn.nickname,
          isHost: false,
          status: "PLAYING",
          turnNumber: currentTurnNumber,
        }
      );
      updateRoomStatus(gameData.roomState);
      addChatting("system", `게임이 시작되었습니다!`, new Date().toISOString());
      break;
    }

    // 예외 상황 - 플레이어 퇴장
    case "PLAYERS": {
      const newPlayersInput = payload.players;
      const leaveUserId = payload.leaveDto.userId;

      console.log(
        "🚪 [PLAYERS] 서버 수신 (플레이어 퇴장) - 전체 데이터 확인:",
        {
          leaveUserId,
          newPlayersInput,
          currentTurn: payload.currentTurn,
          timestamp: new Date().toISOString(),
          "전체 payload": payload,
          "payload 구조": {
            players: payload.players,
            leaveDto: payload.leaveDto,
            currentTurn: payload.currentTurn,
            turnOrder: payload.turnOrder || "turnOrder 없음",
            gameStatus: payload.gameStatus || "gameStatus 없음",
            roomState: payload.roomState || "roomState 없음",
            "기타 필드들": Object.keys(payload).filter(
              (key) =>
                ![
                  "players",
                  "leaveDto",
                  "currentTurn",
                  "turnOrder",
                  "gameStatus",
                  "roomState",
                ].includes(key)
            ),
          },
        }
      );

      // turnOrder가 있는지 특별히 확인
      if (payload.turnOrder) {
        console.log("🔄 turnOrder 데이터 상세:", {
          turnOrder: payload.turnOrder,
          turnOrderLength: payload.turnOrder.length,
          turnOrderType: typeof payload.turnOrder,
          "각 turnOrder 항목": payload.turnOrder.map((item, index: number) => ({
            index,
            item,
            type: typeof item,
          })),
        });
      } else {
        console.log("❌ turnOrder가 payload에 포함되지 않음");
      }

      // 서버에서 보내준 플레이어 데이터와 turnOrder를 사용하여 처리
      dropOutPlayer(
        leaveUserId,
        newPlayersInput.map((player: ServerPlayer) => ({
          id: player.userId,
          name: player.nickname,
          isHost: player.role === "HOST",
          status: player.readyState,
          answerAttempts: player.answerAttempts,
        })),
        payload.turnOrder, // 새로운 turnOrder 전달
        payload.currentTurn // 현재 턴 정보 전달 (있다면)
      );

      // 서버에서 턴 관리하므로 클라이언트에서는 턴 변경하지 않음
      break;
    }

    // 게임 종료
    case "END_GAME": {
      const myUserId = useUserStore.getState().userId;
      const roomId = useRoomStore.getState().roomId;
      openAnswer(payload.problem.answer);

      // 방장이 퇴장한 경우
      if (payload.endReason === "LEAVE_HOST") {
        const hostId = useRoomStore.getState().hostId;

        updateRoomStatus("WAITING");
        leavePlayer(hostId);
        gameOver(
          payload.endReason,
          payload.winnerInfo?.winnerId ?? 0,
          payload.winnerInfo?.nickname ?? "",
          payload.problem?.guess ?? "",
          payload.totalQuestionCount ?? 0,
          payload.playTime ?? ""
        );

        if (myUserId === hostId) {
          const { resetRoom } = useRoomStore.getState();
          const { resetProblem } = useProblemStore.getState();
          const { clearGameData } = useGameStore.getState();

          // 방 / 게임 데이터 정리
          resetRoom();
          resetProblem();
          clearGameData();

          // session Storage 데이터 정리
          sessionStorage.removeItem("room-storage");
          sessionStorage.removeItem("game-storage");

          // 웹소켓 구독 정리
          leaveRoom(roomId);
          joinLobby();

          window.location.replace("/lobby");
        }
      }

      // endReason을 확인해서 정답 횟수 소진인 경우 별도 처리
      if (payload.endReason === "EXHAUSTED_ATTEMPTS") {
        console.log("🎮 정답 횟수 소진 감지 - 다이얼로그 표시");

        // 정답 횟수 소진 플래그 설정 (InRoomHandler가 확인할 수 있도록)
        setIsAnswerAttemptsExhausted(true);

        // 정답 횟수 소진 다이얼로그 표시 (룸 상태는 아직 변경하지 않음)
        setAnswerAttemptsExhaustedDialogOpen(true);

        console.log("🎮 다이얼로그 상태 설정 완료, 5초 타이머 시작");

        // 5초 후 다이얼로그 닫고 대기방 상태로 변경
        setTimeout(() => {
          console.log("🎮 5초 타이머 완료 - 다이얼로그 닫고 대기방 상태 변경");

          const {
            setAnswerAttemptsExhaustedDialogOpen,
            setIsAnswerAttemptsExhausted,
          } = useGameStore.getState();
          setAnswerAttemptsExhaustedDialogOpen(false);
          setIsAnswerAttemptsExhausted(false); // 플래그 초기화

          // 참가자 상태 업데이트 (방장 제외 모든 참가자를 WAITING으로)
          const currentRoomState = useRoomStore.getState();
          const existingParticipants = currentRoomState.players || [];

          const updatedParticipants = existingParticipants.map((player) => ({
            ...player,
            status: player.isHost ? "READY" : "WAITING", // 방장은 READY, 나머지는 WAITING
          }));

          setRoom({
            ...currentRoomState,
            gameState: "WAITING",
            players: updatedParticipants,
          });

          // 대기방 상태로 변경
          updateRoomStatus("WAITING");
        }, 5000);
      } else {
        console.log("🎮 일반 게임 종료:", payload.endReason);

        // 일반 게임 종료 (정답 맞춤, 시간 초과 등)
        updateRoomStatus("WAITING");
        gameOver(
          payload.endReason,
          payload.winnerInfo?.winnerId ?? 0,
          payload.winnerInfo?.nickname ?? "",
          payload.problem?.guess ?? "",
          payload.totalQuestionCount ?? 0,
          payload.playTime ?? ""
        );
      }
      break;
    }

    // 방장 변경 (게임 중)
    case "HOST_CHANGED": {
      const { updateHost, newHost } = useRoomStore.getState();

      if (payload.oldHostId) {
        updateHost(payload.oldHostId, payload.newHostId);
      } else {
        newHost(payload.userId);
      }

      console.log("게임 중 방장 변경:", payload);
      break;
    }

    // 턴 넘기기 수신 (모든 참가자)
    case "NEXT_TURN":
      console.log("🔄 [NEXT_TURN] 서버 수신 (브로드캐스트):", {
        현재상태: useGameStore.getState().currentPlayer,
        timestamp: new Date().toISOString(),
        payload: payload,
      });

      // 새로운 payload 구조에 맞게 수정: payload.nextTurnDto.nextPlayerId
      const nextPlayerId =
        payload.nextTurnDto?.nextPlayerId || payload.nextPlayerId;
      if (nextPlayerId) {
        nextTurn(nextPlayerId);
      }
      break;
  }
}

// Chatting WS 전체 수신
// /topic/games/${roomId}/chat
export function onChat(response: WebsocketResponse) {
  console.log("Chatting Msg: ", response.eventType);

  const payload = response.payload;
  const playerList = useGameStore.getState().players;

  const getPlayerName = (id: number): string =>
    playerList.find((player) => player.id === id)?.name ?? "Unknown";

  const displayReply = (answer: string) => {
    switch (answer) {
      case "CORRECT":
        return "맞습니다. ⭕";
      case "INCORRECT":
        return "아닙니다. ❌";
      case "IRRELEVANT":
        return "상관없습니다. 🟡";
      default:
        return "❓";
    }
  };

  const displayAnswerWait = (username: string) => {
    return `${username}님이 추리 결과를 기다리고 있습니다...`;
  };

  const displayJudge = (answer: string) => {
    switch (answer) {
      case "CORRECT":
        return "정답입니다! ⭕";
      case "INCORRECT":
        return "아닙니다. ❌";
    }
  };

  console.log(payload);
  switch (response.eventType) {
    // 상호 대화 정보 수신
    case "CHAT":
      // __TURN_PASSED__ 메시지는 무시하고 서버의 공식 NEXT_TURN 이벤트만 사용
      if (payload.message && payload.message.startsWith("__TURN_PASSED__")) {
        const parts = payload.message.split("__");
        if (parts.length >= 4) {
          const nextPlayerId = parseInt(parts[2]);

          // 다른 플레이어들도 즉시 턴 변경 적용
          nextTurn(nextPlayerId);
        }
      } else {
        // 일반 채팅 메시지 처리
        addChatting(
          payload.nickname,
          payload.message,
          new Date().toISOString(),
          "CHAT"
        );
      }
      break;

    // 유저 퇴장 시스템 메시지
    case "LEAVE_PLAYER":
      {
        const myUserId = useUserStore.getState().userId;
        const leavingUserId =
          typeof payload === "number" ? payload : payload.userId;

        const isMe = leavingUserId === myUserId;

        console.log("🚪 [LEAVE_PLAYER] 서버 수신 (채팅 채널):", {
          leavingUserId,
          myUserId,
          isMe,
          timestamp: new Date().toISOString(),
          payload,
        });

        if (isMe) {
          // 기존 leave 버튼 눌렀을 때와 동일한 로직 실행
          addChatting(
            "system",
            "강제 퇴장 처리되었습니다.",
            new Date().toISOString()
          );

          setResultOpen(false);

          setTimeout(() => {
            const { resetRoom } = useRoomStore.getState();
            const { resetProblem } = useProblemStore.getState();
            const { clearGameData } = useGameStore.getState();

            resetRoom();
            resetProblem();
            clearGameData();

            // 로비로 이동
            window.location.replace("/lobby");
          }, 300);

          return; // 본인 처리 후 다른 로직은 건너뜀
        }
        addChatting(
          "system",
          `${payload.nickname}님이 방을 나갔습니다.`,
          payload.timestamp || new Date().toISOString()
        );
      }
      break;

    // 질문 응답 수신
    case "QUESTION": {
      // 모든 참가자의 질문 횟수 차감 동기화
      const currentRemainingQuestions =
        useGameStore.getState().remainingQuestions;
      if (currentRemainingQuestions > 0) {
        useGameStore
          .getState()
          .updateRemainingQuestions(currentRemainingQuestions - 1);
        console.log(
          "질문 수신 - 모든 참가자 remainingQuestions 동기화:",
          currentRemainingQuestions - 1
        );
      }

      addChatting(
        getPlayerName(payload.questionRequestDto.senderId),
        payload.questionRequestDto.question,
        new Date().toISOString(),
        "QUESTION",
        "PENDING"
      );
      // 브로드캐스트에서는 턴 변경하지 않음 (서버에서 관리)

      // 질문을 보낸 참가자도 자신의 질문을 currentQuestion으로 설정
      // 이렇게 하면 질문자도 "응답을 기다리는 중" 상태를 볼 수 있음
      addInteraction(
        "QUESTION",
        payload.questionRequestDto.senderId,
        payload.questionRequestDto.question
      );
      break;
    }

    // 질문 답변 수신
    case "RESPOND_QUESTION": {
      const { qnA = {}, nextGuessDto = {} } = payload;
      const question = qnA.question ?? "(질문 없음)";
      const answerText = displayReply(qnA.answer ?? "UNKNOWN");

      // 질문과 답변만 출력
      const answerStatus =
        qnA.answer === "CORRECT"
          ? "CORRECT"
          : qnA.answer === "INCORRECT"
          ? "INCORRECT"
          : qnA.answer === "IRRELEVANT"
          ? "IRRELEVANT"
          : "PENDING";

      addChatting(
        getPlayerName(qnA.questionerId ?? -1),
        `${question} - ${answerText}`,
        new Date().toISOString(),
        "QUESTION",
        answerStatus
      );

      // currentQuestion을 정리하여 질문 제출자의 UI 상태 업데이트
      const { addHistory } = useGameStore.getState();

      // 히스토리에 질문-답변 추가 (중복 체크는 addHistory 내부에서 처리)
      addHistory(
        "QUESTION",
        qnA.questionerId ?? -1,
        question,
        qnA.answer ?? "UNKNOWN"
      );

      // 현재 질문 정리 - 단순히 질문만 제거
      clearCurrentQuestion();

      console.log("RESPOND_QUESTION 처리 완료:", {
        currentState: useGameStore.getState(),
        clearedCurrentQuestion: true,
      });

      // nextGuessDto가 있으면 해당 정답을 직접 currentQuestion으로 설정
      if (nextGuessDto?.senderId && nextGuessDto.guess) {
        console.log("서버가 지정한 다음 정답 시도자:", {
          senderId: nextGuessDto.senderId,
          guess: nextGuessDto.guess,
        });

        // 서버가 지정한 정답을 바로 currentQuestion으로 설정 (큐 우회)
        const username =
          useGameStore
            .getState()
            .players.find((p) => p.id === nextGuessDto.senderId)?.name ??
          "Unknown";

        useGameStore.getState().nextInteractionId++;
        const newQuestion = {
          id: useGameStore.getState().nextInteractionId,
          playerId: nextGuessDto.senderId,
          username,
          type: "GUESS" as const,
          content: nextGuessDto.guess,
          status: "PENDING" as const,
        };

        useGameStore.setState({ currentQuestion: newQuestion });
        console.log(
          "서버 지정 정답을 currentQuestion으로 직접 설정:",
          newQuestion
        );
      } else {
        console.log("서버가 지정한 다음 정답이 없어서 큐에서 처리");
        // 큐에 정답이 있는지 확인하고 처리
        processAnswerQueue();
      }

      console.log("최종 상태:", useGameStore.getState());
      break;
    }

    // 추리 응답 수신
    // 단순 표기 정보로 대응
    case "GUESS_SEND": {
      const player =
        playerList.find((player) => player.id === payload.senderId)?.name ??
        "Unknown";
      addChatting(
        player,
        displayAnswerWait(player),
        new Date().toISOString(),
        "GUESS",
        "PENDING"
      );

      // null 데이터 체크 후에만 방장 UI에 정답 처리 화면 표시
      // 채팅에서는 payload.message를 사용
      if (payload.senderId && payload.message) {
        addInteraction("GUESS", payload.senderId, payload.message);
      }
      break;
    }

    // 정답에 대한 결과 수신
    case "RESPOND_GUESS": {
      const guessStatus =
        payload.answer === "CORRECT" ? "CORRECT" : "INCORRECT";
      addChatting(
        playerList.find((player) => player.id === payload.questionerId)?.name ??
          "Unknown",
        `${payload.question} - ${displayJudge(payload.answer)}`,
        new Date().toISOString(),
        "GUESS",
        guessStatus
      );

      console.log("RESPOND_GUESS 이벤트 수신 (채팅 채널):", payload);

      // 정답 판정 완료 후 현재 질문 정리
      clearCurrentQuestion();

      // 방금 처리된 정답을 큐에서 제거 (중복 방지)
      const currentState = useGameStore.getState();
      const processedAnswer = payload.question;
      const processedPlayerId = payload.questionerId;

      const filteredQueue = currentState.PendingInteraction.filter(
        (item) =>
          !(
            item.type === "GUESS" &&
            item.content === processedAnswer &&
            item.playerId === processedPlayerId
          )
      );

      console.log("처리된 정답을 큐에서 제거:", {
        processedAnswer,
        processedPlayerId,
        beforeQueue: currentState.PendingInteraction.length,
        afterQueue: filteredQueue.length,
      });

      useGameStore.setState({ PendingInteraction: filteredQueue });

      // 큐에 다음 정답이 있는지 확인하고 처리
      processAnswerQueue();

      console.log("정답 판정 후 상태 (채팅 채널):", useGameStore.getState());
      break;
    }
  }
}

// History WS 전체 수신
// /topic/games/${roomId}/history
export function onHistory(response: WebsocketResponse) {
  const payload = response.payload;
  console.log("History Msg: ", response.eventType);

  addHistory(
    response.eventType as "QUESTION" | "GUESS",
    payload.questionerId,
    payload.question,
    payload.answer
  );
}

// 인게임 WS 개인 수신
// /user/queue/game
export function onPersonalGame(response: WebsocketResponse) {
  console.log("Personal Msg: ", response.eventType);

  const payload = response.payload;

  console.log(payload);
  switch (response.eventType) {
    // 질문 수신 (방장)
    case "QUESTION_SEND":
      console.log("방장에게 질문 수신:", payload);
      addInteraction(
        "QUESTION",
        payload.questionRequestDto.senderId,
        payload.questionRequestDto.question
      );
      console.log("방장에게 질문 수신:", payload);
      addInteraction(
        "QUESTION",
        payload.questionRequestDto.senderId,
        payload.questionRequestDto.question
      );
      break;

    // 추리한 정답 수신 (방장) - 브로드캐스트에서 처리하도록 비활성화
    case "GUESS_SEND":
      // 브로드캐스트에서 처리하므로 개인 메시지에서는 처리하지 않음
      // addInteraction("GUESS", payload.senderId, payload.guess);
      break;

    // 질문 이후 가장 오래된 정답 시도 수신 (방장)
    case "RESPOND_QUESTION": {
      // const next = payload.nextGuessDto;
      // if (next && next.senderId && next.guess) {
      //   addInteraction("GUESS", next.senderId, next.guess);
      // }
      break;
    }

    // 정답 채점 이후, 다음 정답 시도 수신 (방장)
    // 전체에게 결과 채팅 후, 개인에 전달되는 다음 시도 or turn
    case "RESPOND_GUESS": {
      console.log("RESPOND_GUESS 이벤트 수신:", payload);

      // 정답 판정 완료 후 현재 질문 정리
      clearCurrentQuestion();

      // 큐에 다음 정답이 있는지 확인하고 처리
      processAnswerQueue();

      console.log("정답 판정 후 상태:", useGameStore.getState());
      break;
    }

    // 턴 넘기기 수신 (넘긴 사람, 받은 사람)
    // 브로드캐스트에서 이미 처리되므로 개인 메시지에서는 처리하지 않음
    case "NEXT_TURN":
      console.log("🔄 [NEXT_TURN] 서버 수신 (개인 메시지):", {
        timestamp: new Date().toISOString(),
        payload: payload,
        note: "브로드캐스트에서 이미 처리됨",
      });
      // 중복 처리 방지를 위해 개인 메시지에서는 nextTurn 호출하지 않음
      // 중복 처리 방지를 위해 개인 메시지에서는 nextTurn 호출하지 않음
      break;

    // 정답 채점 결과 수신
    case "JUDGEMENT": {
      const { status, content } = payload;
      console.log(`정답 채점 결과: ${content} - ${status}`);

      // 정답 채점 후 서버에서 NEXT_TURN 이벤트를 보내므로
      // 클라이언트에서 자동으로 턴을 변경하지 않음
      // 서버의 턴 관리에 의존
      break;
    }

    // 방장 응답 없음 경고
    case "HOST_WARNING": {
      console.log("방장 응답 없음 경고:", payload);
      useGameStore.getState().setHostNoResponseWarning(true);

      // Amplitude 방장 응답없음 추적
      track("host_no_response_warning", {
        room_id: useGameStore.getState().roomId,
        warning_reason: "response_timeout",
        timestamp: getKoreanTimestamp(),
      });

      break;
    }

    // 참가자 강퇴 처리
    case "PLAYER_FORCE_LEAVE": {
      const leavingUserId = useUserStore.getState().userId;
      const roomId = useRoomStore.getState().roomId;

      console.log("🚪 [PLAYER_FORCE_LEAVE] 서버 수신 (강제 퇴장):", {
        leavingUserId,
        roomId,
        timestamp: new Date().toISOString(),
        payload,
      });

      // leavingUserId를 직접 전달하여 타입 일치시킴
      leavePlayer(leavingUserId);

      const { players: gamePlayers } = useGameStore.getState();
      const updatedGamePlayers = gamePlayers.filter(
        (player) => player.id !== leavingUserId
      );
      dropOutPlayer(leavingUserId, updatedGamePlayers);

      setTimeout(() => {
        const { resetRoom } = useRoomStore.getState();
        const { resetProblem } = useProblemStore.getState();
        const { clearGameData } = useGameStore.getState();

        // Store 정리;
        resetRoom();
        resetProblem();
        clearGameData();

        // session Storage 정리
        sessionStorage.removeItem("room-storage");
        sessionStorage.removeItem("game-storage");

        // 웹소켓 구독 정리
        leaveRoom(roomId);
        joinLobby();

        window.location.replace("/lobby");
      }, 3000);

      // Amplitude 참가자 응답없음 추적
      track("player_force_leave", {
        room_id: useGameStore.getState().roomId,
        warning_reason: "response_timeout",
        timestamp: getKoreanTimestamp(),
      });

      break;
    }

    // 오류 발생
    case "ERROR": {
      console.error(payload);
      break;
    }
  }
}
