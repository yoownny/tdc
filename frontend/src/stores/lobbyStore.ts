import type { RoomSummary } from "@/types/room/roomSummary";
import { create } from "zustand";

interface LobbyStoreType {
  roomList: RoomSummary[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  currentPage: number;
  totalPages: number;
  lastUpdated: Date | null;
  loadingTimeoutCancel: (() => void) | null;
  refreshTimeoutCancel: (() => void) | null;

  getRoomList: (
    rooms: RoomSummary[],
    totalPages?: number,
    currentPage?: number
  ) => void;
  appendRoomList: (
    rooms: RoomSummary[],
    totalPages?: number,
    currentPage?: number
  ) => void;
  changeNumPlayer: (targetRoomId: number, nowCurrentPlayers: number) => void;
  deleteRoom: (deletedRoomId: number) => void;
  createRoom: (newRoom: RoomSummary) => void;
  updateRoom: (targetRoomId: number, updatedRoom: RoomSummary) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setLoadingTimeoutCancel: (cancel: (() => void) | null) => void;
  setRefreshTimeoutCancel: (cancel: (() => void) | null) => void;
  resetPagination: () => void;
  clearRoomList: () => void;
}

const useLobbyStore = create<LobbyStoreType>()((set, get) => ({
  roomList: [],
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  hasNextPage: true,
  currentPage: 0,
  totalPages: 1,
  lastUpdated: null,
  loadingTimeoutCancel: null,
  refreshTimeoutCancel: null,

  getRoomList: (rooms, totalPages = 1, currentPage = 1) => {
    const state = get();
    
    // 동일한 데이터인지 체크하여 불필요한 업데이트 방지
    if (JSON.stringify(state.roomList) === JSON.stringify(rooms) && 
        state.currentPage === currentPage && 
        state.totalPages === totalPages) {
      return;
    }
    
    // 기존 타임아웃들 취소
    if (state.loadingTimeoutCancel) {
      state.loadingTimeoutCancel();
    }
    if (state.refreshTimeoutCancel) {
      state.refreshTimeoutCancel();
    }

    set(() => ({
      roomList: rooms,
      isLoading: false,
      isRefreshing: false,
      isLoadingMore: false,
      hasNextPage: currentPage < totalPages,
      currentPage,
      totalPages,
      lastUpdated: new Date(),
      loadingTimeoutCancel: null,
      refreshTimeoutCancel: null,
    }));
  },

  appendRoomList: (rooms, totalPages = 1, currentPage = 1) => {
    const state = get();
    set(() => ({
      roomList: [...state.roomList, ...rooms],
      isLoadingMore: false,
      hasNextPage: currentPage < totalPages,
      currentPage,
      totalPages,
      lastUpdated: new Date(),
    }));
  },

  createRoom: (newRoom) =>
    set((state) => ({
      roomList: [...state.roomList, newRoom],
    })),

  changeNumPlayer: (targetRoomId, nowCurrentPlayers) =>
    set((state) => ({
      roomList: state.roomList.map((room) =>
        room.roomId === targetRoomId
          ? { ...room, currentPlayers: nowCurrentPlayers }
          : room
      ),
    })),

  deleteRoom: (deletedRoomId) =>
    set((state) => ({
      roomList: state.roomList.filter((room) => room.roomId !== deletedRoomId),
    })),

  updateRoom: (targetRoomId, updatedRoom) =>
    set((state) => ({
      roomList: state.roomList.map((room) =>
        room.roomId === targetRoomId ? updatedRoom : room
      ),
      lastUpdated: new Date(),
    })),

  setLoading: (loading) => set(() => ({ isLoading: loading })),

  setRefreshing: (refreshing) => set(() => ({ isRefreshing: refreshing })),

  setLoadingMore: (loading) => set(() => ({ isLoadingMore: loading })),

  setLoadingTimeoutCancel: (cancel) =>
    set(() => ({ loadingTimeoutCancel: cancel })),

  setRefreshTimeoutCancel: (cancel) =>
    set(() => ({ refreshTimeoutCancel: cancel })),

  resetPagination: () =>
    set(() => ({
      currentPage: 0,
      totalPages: 1,
      hasNextPage: true,
      roomList: [],
    })),

  clearRoomList: () =>
    set(() => ({
      roomList: [],
      isLoading: false,
      isRefreshing: false,
      isLoadingMore: false,
      hasNextPage: true,
      currentPage: 0,
      totalPages: 1,
      lastUpdated: null,
      loadingTimeoutCancel: null,
      refreshTimeoutCancel: null,
    })),
}));

export default useLobbyStore;
