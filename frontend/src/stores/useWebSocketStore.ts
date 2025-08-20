import { Client, StompSubscription } from "@stomp/stompjs";
import { create } from "zustand";

// 연결 상태 정의
type ConnStatus = "idle" | "connecting" | "connected";

interface WebsocketStoreType {
  // Stomp Clinet
  client: Client | null;
  // 구독 채널 리스트
  subscriptions: Record<string, StompSubscription>;
  // 새로 고침 시 구독 복원을 위한 상태
  currentRoomId: number | null;
  // 연결 상태
  connectionStatus: ConnStatus;

  // WS Client 설정
  setClient: (client: Client | null) => void;
  setConnectionStatus: (s: ConnStatus) => void;
  // 구독 채널 State 전이 함수
  addSubscription: (topic: string, sub: StompSubscription) => void;
  getSubscription: (topic: string) => StompSubscription | undefined;
  getAllSubscriptions: () => Record<string, StompSubscription>;
  removeSubscription: (topic: string) => void;
  clearAllSubscriptions: () => void;
  // 방 설정
  setCurrentRoomId: (roomId: number | null) => void;
}

// 상태 표현
const useWebsocketStore = create<WebsocketStoreType>((set, get) => ({
  client: null,
  subscriptions: {},
  currentRoomId: null,
  connectionStatus: "idle",

  // WS Client 설정
  setClient: (client) => set({ client }),

  // WS 연결 상태 전이 함수
  setConnectionStatus: (s) => set({ connectionStatus: s }),

  // 구독 채널 추가
  addSubscription: (topic: string, sub: StompSubscription) =>
    set((state) => state.subscriptions[topic] ? state : {
    subscriptions: { ...state.subscriptions, [topic]: sub },
    }),

  // 구독 채널 Search
  getSubscription: (topic) => get().subscriptions[topic],

  // 구독 채널 List 반환
  getAllSubscriptions: () => get().subscriptions,

  // 구독 채널 삭제
  removeSubscription: (topic) => {
    set((state) => {
      const { [topic]: _, ...rest } = state.subscriptions;
      return { subscriptions: rest };
    });
  },

  // 구독 채널 초기화
  clearAllSubscriptions: () => {
    set({ subscriptions: {} });
  },

  // 방 번호 설정
  setCurrentRoomId: (roomId) => set(() => ({ currentRoomId: roomId })),
}));

export default useWebsocketStore;
