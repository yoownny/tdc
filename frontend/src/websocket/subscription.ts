import useWebsocketStore from "@/stores/useWebSocketStore";
import { onChat, onHistory, onPersonalGame, onRoom } from "./InGameHandler";
import { onRoomSetting, onWaitingRoom } from "./InRoomHander";
import { onLobby } from "./LobbyHandler";

// Subscription 관리 함수
const LOBBY_TOPIC = "/topic/lobby";

// 로비 입장 WS
export function joinLobby() {
  const { client, addSubscription, getSubscription } =
    useWebsocketStore.getState();
  if (!client || !client.connected) return;
  if (getSubscription(LOBBY_TOPIC)) return;

  const sub = client.subscribe(LOBBY_TOPIC, (message) => {
    const response = JSON.parse(message.body);
    onLobby(response);
  });

  addSubscription(LOBBY_TOPIC, sub);
  console.log("로비 입장");
}

// 로비 퇴장 WS
export function leaveLobby() {
  const { getSubscription, removeSubscription } = useWebsocketStore.getState();
  const sub = getSubscription(LOBBY_TOPIC);

  if (sub) {
    sub.unsubscribe();
    removeSubscription(LOBBY_TOPIC);
  }

  console.log("로비 퇴장");
}

// 개인 메시지 채널 구독 추가 WS (로그인의 경우)
export function joinMyMsg() {
  const { client, addSubscription, getSubscription } =
    useWebsocketStore.getState();
  if (!client || !client.connected) return;

  const subsData = [
    { topic: "/user/queue/game", handler: onPersonalGame },
    { topic: "/user/queue/room", handler: onRoomSetting },
  ];

  subsData.forEach(({ topic, handler }) => {
    if (getSubscription(topic)) return;
    const subscription = client.subscribe(topic, (msg) => {
      const data = JSON.parse(msg.body);
      handler(data);
    });

    addSubscription(topic, subscription);
  });
}

// 개인 메시지 채널 구독 삭제 WS (로그아웃의 경우)
export function leaveMyMsg() {
  const { getAllSubscriptions, removeSubscription } =
    useWebsocketStore.getState();

  const topicsToLeave = ["/user/queue/game", "/user/queue/room"];

  topicsToLeave.forEach((topic) => {
    const subscription = getAllSubscriptions()[topic];
    if (subscription) {
      subscription.unsubscribe();
      removeSubscription(topic);
    }
  });

  console.log("로그아웃");
}

// 방 입장 WS
export function joinRoom(roomId: number) {
  const { client, addSubscription, getSubscription } =
    useWebsocketStore.getState();
  if (!client || !client.connected) return;

  const subsData = [
    { topic: `/topic/room/${roomId}`, handler: onWaitingRoom },
    { topic: `/topic/games/${roomId}`, handler: onRoom },
    { topic: `/topic/games/${roomId}/chat`, handler: onChat },
    { topic: `/topic/games/${roomId}/history`, handler: onHistory },
  ];

  subsData.forEach(({ topic, handler }) => {
    if (getSubscription(topic)) return;
    const subscription = client.subscribe(topic, (msg) => {
      const data = JSON.parse(msg.body);
      handler(data);
    });
    addSubscription(topic, subscription);
  });

  console.log(`${roomId}번 방 입장`);
}

// 방 퇴장 WS
export function leaveRoom(roomId: number) {
  const { getAllSubscriptions, removeSubscription } =
    useWebsocketStore.getState();

  const topicsToLeave = [
    `/topic/room/${roomId}`,
    `/topic/games/${roomId}`,
    `/topic/games/${roomId}/chat`,
    `/topic/games/${roomId}/history`,
  ];

  topicsToLeave.forEach((topic) => {
    const subscription = getAllSubscriptions()[topic];
    if (subscription) {
      subscription.unsubscribe();
      removeSubscription(topic);
    }
  });

  console.log(`${roomId}번 방 종료`);
}
