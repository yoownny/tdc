// 게임방의 룸 상태 관리
import type { ChatLog } from "@/types/chat";
import { uniqById, type RoomStoreType } from "./types/room";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { track } from "@amplitude/analytics-browser";
import { getKoreanTimestamp } from "@/utils/KoreanTimestamp";
import useProblemStore from "@/stores/problemStore";

const useRoomStore = create<RoomStoreType>()(
  persist(
    (set, get) => ({
      roomId: 0,
      gameState: "WAITING",
      numPlayers: 0,
      maxPlayers: 0,
      hostId: 0,
      players: [],
      chattings: [],
      nextChatlogId: 0,
      timeLimit: 0, // 분 기준
      roomEntryTime: null, // 방 입장 시간

      // 타이머 관련 상태
      timerWarning: false,
      hostTimeout: false,
      setTimerWarning: (warning: boolean) =>
        set(() => ({ timerWarning: warning })),
      setHostTimeout: (timeout: boolean) =>
        set(() => ({ hostTimeout: timeout })),

      // 방 입장
      setRoom: (roomData) => {
        const problemStore = useProblemStore.getState();
        const hasProblem =
          !!problemStore.problemId && problemStore.problemId.trim() !== "";

        track("room_joined", {
          // room_age_minutes: 0, 실제 방 생성 시간으로 교체하면 주석 해제하기
          player_position:
            roomData.participants?.length || roomData.players?.length || 0,
          room_has_problem: hasProblem,
          room_id: roomData.roomId,
          max_players: roomData.maxPlayers,
          current_players: roomData.numPlayers,
          problem_id: problemStore.problemId || null,
          problem_type: problemStore.problemType || null,
          timestamp: getKoreanTimestamp(),
        });

        return set(() => ({
          roomId: roomData.roomId,
          gameState: roomData.gameState,
          maxPlayers: roomData.maxPlayers,
          numPlayers: roomData.numPlayers,
          hostId: roomData.hostId,
          players: uniqById(roomData.participants || roomData.players || []), // ✅ 스냅샷은 항상 덮어쓰기
          timeLimit: roomData.timeLimit,
          roomEntryTime: Date.now(),
        }));
      },

      // 방 퇴장
      resetRoom: () =>
        set(() => ({
          roomId: 0,
          gameState: "WAITING",
          maxPlayers: 0,
          numPlayers: 0,
          hostId: 0,
          players: [],
          chattings: [],
          nextChatlogId: 0,
          roomEntryTime: null,
        })),

      // 다른 플레이어 입장
      joinPlayer: (newPlayer, currentPlayers) =>
        set((state) => {
          const exists = state.players.some((p) => p.id === newPlayer.id);
          const players = exists
            ? state.players.map((p) =>
                p.id === newPlayer.id ? { ...p, ...newPlayer } : p
              )
            : [...state.players, newPlayer]; // ✅ 중복 push 금지
          return {
            players,
            // 서버가 보내주는 카운트를 신뢰하고, 없으면 실제 인원 재계산
            numPlayers:
              typeof currentPlayers === "number"
                ? currentPlayers
                : players.filter((p) => p.id > 0).length,
          };
        }),

      // 다른 플레이어 퇴장
      leavePlayer: (targetUserId) =>
        set((state) => {
          const next = state.players.filter((p) => p.id !== targetUserId);
          const wasPresent = next.length !== state.players.length;
          return {
            players: next,
            numPlayers: Math.max(0, state.numPlayers - (wasPresent ? 1 : 0)),
          };
        }),

      // 방장 넘기기를 통한 방장 변경
      updateHost: (oldHostId, newHostId) =>
        set((state) => ({
          players: state.players.map((player) => {
            if (player.id === oldHostId) {
              return { ...player, isHost: false, status: "WAITING" }; // 이전 Host → 참가자
            }
            if (player.id === newHostId) {
              return { ...player, isHost: true, status: "READY" }; // 새 Host → Host
            }
            return player;
          }),
          hostId: newHostId,
        })),

      updateSetting: (maxPlayers, timeLimit) =>
        set(() => ({
          maxPlayers,
          timeLimit,
        })),

      // 채팅 내역 추가
      addChatting: (username, content, timestamp, type, status) =>
        set((state) => {
          const last = state.chattings[state.chattings.length - 1];
          if (last && last.user === username && last.content === content) {
            return state; // 직전과 동일 문구면 무시
          }

          const newChatLog: ChatLog = {
            id: state.nextChatlogId,
            user: username,
            content,
            timestamp,
            type,
            status,
          };

          return {
            chattings: [...state.chattings, newChatLog],
            nextChatlogId: state.nextChatlogId + 1,
          };
        }),

      // 채팅 내역 초기화
      clearChattings: () =>
        set(() => ({
          chattings: [],
          nextChatlogId: 0,
        })),

      // 방장 퇴장을 통한 방장 변경
      newHost: (newHostId) =>
        set((state) => ({
          hostId: newHostId,
          players: state.players.map((player) =>
            player.id === newHostId
              ? {
                  ...player,
                  isHost: true,
                  status: "WAITING",
                }
              : player
          ),
        })),

      // 플레이어 준비 상태 변경
      updatePlayerStatus: (players) =>
        set((state) => {
          // 기존 참가자 순서를 유지하면서 상태만 업데이트
          const updatedPlayers = state.players.map((existingPlayer) => {
            const updatedPlayer = players.find(
              (p) => p.id === existingPlayer.id
            );
            return updatedPlayer
              ? { ...existingPlayer, status: updatedPlayer.status }
              : existingPlayer;
          });

          return { players: updatedPlayers };
        }),

      // 방 게임 진행 상태 변경
      updateRoomStatus: (gameState) => set(() => ({ gameState })),

      // 모든 참가자가 준비 상태인지 확인
      areAllPlayersReady: () => {
        const state = get();
        return state.players.every((player) => player.status === "READY");
      },

      // 방 내부 인원이 2명 이상인지 확인
      isNotAlone: () => {
        const state = get();
        return state.players.length >= 2;
      },

      // 방 체류 시간 계산
      getRoomStayDuration: () => {
        const state = get();
        if (!state.roomEntryTime) return 0;
        return Math.floor((Date.now() - state.roomEntryTime) / 1000);
      },
    }),
    {
      name: "room-storage", // sessionStorage key
      partialize: (state) => ({
        // 저장할 필드만 선택
        roomId: state.roomId,
        gameState: state.gameState,
        maxPlayers: state.maxPlayers,
        numPlayers: state.numPlayers,
        players: state.players,
        hostId: state.hostId,
        timeLimit: state.timeLimit,
        roomEntryTime: state.roomEntryTime,
        // 채팅은 기록 보존 X
      }),
    }
  )
);

export default useRoomStore;
