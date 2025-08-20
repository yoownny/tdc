// 게임방의 룸 상태 관리
import { AnswerStatus, type Interaction } from "@/types/game/game";
import type { GameStoreType } from "./types";
import type { GamePlayer } from "@/types/user";
import type { TurnOrderItem, CurrentTurn } from "@/types/game/game";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";

const useGameStore = create<GameStoreType>()(
  persist(
    (set, get) => ({
      // Initial State
      // 게임 정보
      roomId: 0,
      players: [],
      remainingQuestions: 0,
      totalQuestions: 0,

      currentPlayer: null,
      currentQuestion: null,
      PendingInteraction: [],
      gameHistory: [],
      currentTimer: 0,

      // 결과 정보
      endReason: "TIMEOUT",
      winnerId: 0,
      winnerName: "",
      submitted_answer: "",
      playTime: "",
      totalQuestionCount: 0,

      // 기타 정보
      nextInteractionId: 1, // Interaction 표시용
      resultOpen: false, // Modal Open 용
      answerAttemptsExhaustedDialogOpen: false, // 정답 횟수 소진 다이얼로그 Open 용
      isAnswerAttemptsExhausted: false, // 정답 횟수 소진 여부 플래그
      lastTurnChange: Date.now(), // 턴 변경 감지용

      // 응답없음 관련 상태
      hostNoResponseWarning: false,
      setHostNoResponseWarning: (warning: boolean) =>
        set(() => ({ hostNoResponseWarning: warning })),

      // 디버깅을 위한 함수
      debugState: () => {
        const state = get();
        console.log("현재 게임 스토어 상태:", {
          ...state,
          pendingGuessCount: state.PendingInteraction.filter(
            (item) => item.type === "GUESS"
          ).length,
          pendingGuesses: state.PendingInteraction.filter(
            (item) => item.type === "GUESS"
          ),
        });
        return state;
      },

      // 게임 시작
      gameStart: (
        roomId,
        playerList,
        remainingQuestions,
        totalQuestions,
        currentPlayer
      ) =>
        set(() => ({
          roomId,
          players: playerList,
          remainingQuestions,
          totalQuestions,
          currentPlayer,
          currentQuestion: null,
          gameHistory: [],
          submitted_answer: "",
          currentTimer: 0,
          nextInteractionId: 1,
          lastTurnChange: Date.now(),
          hostNoResponseWarning: false,
          guestNoResponseWarning: false,
        })),

      // 질문 입력 / 정답 제출
      addInteraction: (type, playerId, content) =>
        set((state) => {
          const username =
            state.players.find((p) => p.id === playerId)?.name ?? "Unknown";

          const newInteraction: Interaction = {
            id: state.nextInteractionId,
            playerId,
            username,
            type,
            content,
            status: AnswerStatus.PENDING,
          };

          // GUESS 타입은 항상 큐에만 저장 (UI 변경 안함)
          if (type === "GUESS") {
            return {
              PendingInteraction: [...state.PendingInteraction, newInteraction],
              nextInteractionId: state.nextInteractionId + 1,
            };
          }

          // QUESTION 타입만 currentQuestion으로 설정
          if (type === "QUESTION") {
            return {
              currentQuestion: {
                id: state.nextInteractionId,
                playerId,
                username,
                type,
                content,
                status: AnswerStatus.PENDING,
              },
              nextInteractionId: state.nextInteractionId + 1,
            };
          }

          // 다른 타입들은 기존대로 처리
          return {
            nextInteractionId: state.nextInteractionId + 1,
          };
        }),

      // 질문에 대한 답변 응답 / 정답 채점
      addHistory: (type, playerId, content, replyContent) =>
        set((state) => {
          if (!content.trim()) return {};

          const username =
            state.players.find((p) => p.id === playerId)?.name ?? "Unknown";
          const newInteraction: Interaction = {
            id: state.nextInteractionId,
            playerId,
            username,
            type,
            content,
            status: replyContent,
          };

          const isDuplicate = state.gameHistory.some(
            (h) =>
              h.type === type &&
              h.username === username &&
              h.content === content &&
              h.status === replyContent
          );

          if (isDuplicate) return state;
          return {
            gameHistory: [...state.gameHistory, newInteraction],
            nextInteractionId: state.nextInteractionId + 1,
          };
        }),

      // 다음 턴
      nextTurn: (targetUserId) =>
        set((state) => {
          const targetPlayer = state.players.find((p) => p.id === targetUserId);
          if (targetPlayer) {
            const newState = {
              currentPlayer: {
                id: targetUserId,
                name: targetPlayer.name,
                isHost: targetPlayer.isHost,
                status: targetPlayer.status,
                turnNumber: targetPlayer.turnNumber, // turnNumber 추가!
              },
              currentTimer: 0, // 타이머 리셋
              // 강제 리렌더링을 위한 더미 값 (현재 시간)
              lastTurnChange: Date.now(),
            };
            return newState;
          } else {
            console.warn(`유효하지 않은 플레이어 ID: ${targetUserId}`);
            // 유효하지 않은 경우 현재 상태 유지
            return {};
          }
        }),

      // 현재 질문/정답 초기화
      clearCurrentQuestion: () => {
        console.log("clearCurrentQuestion 호출됨 - 단순히 현재 질문 제거");
        set({ currentQuestion: null });
      },

      processAnswerQueue: () => {
        console.log("processAnswerQueue 호출됨");
        set((state) => {
          const nextGuess = state.PendingInteraction.find(
            (item) => item.type === "GUESS"
          );

          if (nextGuess) {
            console.log("큐에서 다음 정답 시도를 가져옴:", nextGuess);
            // 큐에서 해당 항목 제거하고 currentQuestion으로 설정
            const remainingPending = state.PendingInteraction.filter(
              (item) => item.id !== nextGuess.id
            );

            return {
              currentQuestion: {
                id: nextGuess.id,
                playerId: nextGuess.playerId,
                username: nextGuess.username,
                type: nextGuess.type,
                content: nextGuess.content,
                status: AnswerStatus.PENDING,
              },
              PendingInteraction: remainingPending,
            };
          }

          console.log("큐에 처리할 정답이 없음");
          return {}; // 상태 변경 없음
        });
      },

      // 방 인원 중도 퇴장 (서버에서 이미 갱신된 nowPlayers 배열과 turnOrder 사용)
      dropOutPlayer: (
        leaveUserId: number,
        nowPlayers: GamePlayer[],
        turnOrder?: TurnOrderItem[],
        currentTurn?: CurrentTurn
      ) =>
        set((state) => {
          // 중복 id 방지 (방어 코드)
          const seen = new Set<number>();
          const uniquePlayers = nowPlayers.filter((p: GamePlayer) => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });

          console.log("🔄 dropOutPlayer 처리:", {
            leaveUserId,
            previousCurrentPlayer: state.currentPlayer,
            newPlayers: uniquePlayers,
            turnOrder,
            currentTurn,
            "현재 턴 참가자가 나갔는가":
              state.currentPlayer?.id === leaveUserId,
          });

          let newCurrentPlayer = state.currentPlayer;

          // 현재 턴 참가자가 나간 경우, 턴 순서 재조정
          if (state.currentPlayer?.id === leaveUserId) {
            console.log(
              "⚠️ 현재 턴 참가자가 퇴장했습니다. 다음 순서 참가자에게 턴 이양"
            );

            // 1. 현재 플레이어의 turnNumber 찾기
            const currentTurnNumber = state.currentPlayer.turnNumber || 0;
            console.log("현재 턴 번호:", currentTurnNumber);

            if (turnOrder && turnOrder.length > 0) {
              // 2. 나간 참가자의 원래 턴 순서를 기준으로 다음 순서 참가자 찾기
              // 현재 턴 번호가 1이면 인덱스는 0, 2면 인덱스는 1...
              const leavingPlayerIndex = currentTurnNumber - 1; // 나간 참가자의 원래 인덱스

              // 나간 참가자의 다음 순서였던 참가자가 새로운 turnOrder에서 같은 인덱스에 위치
              // 예: 1,2,3에서 2가 나가면 → 1,3이 되고, 원래 3이었던 참가자가 인덱스 1에 위치
              let nextTurnIndex = leavingPlayerIndex;

              // 만약 나간 참가자가 마지막 순서였다면, 첫 번째 참가자가 다음 턴
              if (nextTurnIndex >= turnOrder.length) {
                nextTurnIndex = 0;
              }

              console.log(
                `현재 턴 참가자(${currentTurnNumber}번, 인덱스${leavingPlayerIndex})이 퇴장`
              );
              console.log(
                `→ 다음 순서였던 참가자가 새로운 인덱스 ${nextTurnIndex}에서 턴 이양받음`
              );
              console.log("새로운 turnOrder:", turnOrder);

              const nextTurnUser = turnOrder[nextTurnIndex];
              console.log("다음 턴 사용자:", nextTurnUser);

              const nextPlayer = uniquePlayers.find(
                (p) => p.id === nextTurnUser.userId
              );
              console.log("다음 플레이어 정보:", nextPlayer);

              if (nextPlayer) {
                newCurrentPlayer = {
                  id: nextPlayer.id,
                  name: nextPlayer.name,
                  isHost: nextPlayer.isHost,
                  status: nextPlayer.status,
                  turnNumber: nextTurnIndex + 1, // 새로운 turnOrder에서의 턴 번호 (1부터 시작)
                };
                console.log(
                  "✅ 나간 참가자의 다음 순서였던 참가자에게 턴 이양:",
                  {
                    from: `${state.currentPlayer.name}(이전 턴${currentTurnNumber})`,
                    to: `${newCurrentPlayer.name}(새로운 턴${newCurrentPlayer.turnNumber})`,
                    logic: `원래 ${currentTurnNumber}번 다음이었던 참가자가 새로운 ${
                      nextTurnIndex + 1
                    }번으로 턴 이양`,
                  }
                );
              }
            } else if (currentTurn && currentTurn.questionerId) {
              // currentTurn 정보가 있으면 사용
              const nextPlayer = uniquePlayers.find(
                (p) => p.id === currentTurn.questionerId
              );
              if (nextPlayer) {
                newCurrentPlayer = {
                  id: nextPlayer.id,
                  name: nextPlayer.name,
                  isHost: nextPlayer.isHost,
                  status: nextPlayer.status,
                };
                console.log(
                  "✅ currentTurn 기반 새로운 턴 참가자 설정:",
                  newCurrentPlayer
                );
              }
            } else {
              // 백업: 나간 참가자의 다음 순서 참가자 찾기
              const nonHostPlayers = uniquePlayers.filter((p) => !p.isHost);
              if (nonHostPlayers.length > 0) {
                // 현재 턴 번호의 다음 참가자 찾기 (순환)
                const nextIndex = currentTurnNumber % nonHostPlayers.length;
                const nextPlayer = nonHostPlayers[nextIndex];
                newCurrentPlayer = {
                  id: nextPlayer.id,
                  name: nextPlayer.name,
                  isHost: nextPlayer.isHost,
                  status: nextPlayer.status,
                  turnNumber: nextIndex + 1,
                };
                console.log(
                  "🔧 백업 로직으로 다음 순서 참가자 설정:",
                  newCurrentPlayer
                );
              } else {
                newCurrentPlayer = null;
                console.log("❌ 더 이상 턴을 진행할 참가자가 없음");
              }
            }
          }

          // turnOrder가 있으면 플레이어에 turnNumber 할당
          if (turnOrder && turnOrder.length > 0) {
            console.log("🔢 turnOrder 기반으로 turnNumber 재할당");
            uniquePlayers.forEach((player) => {
              if (!player.isHost) {
                const turnIndex = turnOrder.findIndex(
                  (turnPlayer: TurnOrderItem) => turnPlayer.userId === player.id
                );
                player.turnNumber = turnIndex !== -1 ? turnIndex + 1 : 0;
              }
            });
          }

          console.log("📋 최종 상태:", {
            newCurrentPlayer,
            updatedPlayers: uniquePlayers,
          });

          return {
            players: uniquePlayers,
            currentPlayer: newCurrentPlayer,
            lastTurnChange: Date.now(),
          };
        }),

      // 타이머 Sync
      syncTimer: (remainingTime) => set({ currentTimer: remainingTime }),

      // 정답 발표
      setResultOpen: (open) => set(() => ({ resultOpen: open })),

      // 정답 횟수 소진 다이얼로그
      setAnswerAttemptsExhaustedDialogOpen: (open) =>
        set(() => ({ answerAttemptsExhaustedDialogOpen: open })),

      // 정답 횟수 소진 플래그
      setIsAnswerAttemptsExhausted: (exhausted) =>
        set(() => ({ isAnswerAttemptsExhausted: exhausted })),

      // 추가된 액션들
      updateRemainingQuestions: (remaining) =>
        set(() => ({ remainingQuestions: remaining })),

      updatePlayerAnswerAttempts: (playerId, attempts) =>
        set((state) => ({
          players: state.players.map((player) =>
            player.id === playerId
              ? { ...player, answerAttempts: attempts }
              : player
          ),
        })),

      // 게임 종료
      gameOver: (
        endReason,
        userId,
        nickname,
        content,
        questionCnt,
        playTime
      ) => {
        // 🎯 게임 종료 추적 (핵심 게임 완주율 지표)
        track("game_ended", {
          end_reason: endReason.toLowerCase(), // "timeout", "correct_answer", etc.
          total_duration_seconds: playTime ? parseInt(playTime) : 0,
          total_questions_count: questionCnt,
          total_answer_attempts: 0, // 실제 답변 시도 횟수로 교체 필요
          winner_exists: !!userId,
          winner_id: userId,
          timestamp: getKoreanTimestamp(),
        });

        return set(() => ({
          endReason,
          winnerId: userId,
          winnerName: nickname,
          submitted_answer: content ?? "",
          playTime: playTime,
          totalQuestionCount: questionCnt,
          resultOpen: true,
        }));
      },

      // 게임 데이터 초기화
      clearGameData: () =>
        set(() => ({
          players: [],
          currentQuestion: null,
          gameHistory: [],
          currentTimer: 0,
          nextInteractionId: 1,
          resultOpen: false,
          answerAttemptsExhaustedDialogOpen: false,
          isAnswerAttemptsExhausted: false,
          lastTurnChange: Date.now(),
          hostNoResponseWarning: false,
          guestNoResponseWarning: false,
        })),
    }),
    {
      name: "game-storage",
      partialize: (state) => ({
        roomId: state.roomId,
        players: state.players,
        remainingQuestions: state.remainingQuestions,
        totalQuestions: state.totalQuestions,
        currentPlayer: state.currentPlayer,
        currentQuestion: state.currentQuestion, // currentQuestion도 저장에 포함

        // 결과 저장
        resultOpen: state.resultOpen,
        winnerId: state.winnerId,
        winnerName: state.winnerName,
        submitted_answer: state.submitted_answer,
        playTime: state.playTime,
        totalQuestionCount: state.totalQuestionCount,
      }),
    }
  )
);

export default useGameStore;
