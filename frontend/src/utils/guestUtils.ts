import { v4 as uuidv4 } from "uuid";

/**
 * 게스트 ID 생성
 */
export const generateGuestId = (): string => {
  return `guest_${uuidv4()}`;
};

/**
 * 게스트 데이터 정리
 */
export const clearGuestData = (): void => {
  sessionStorage.removeItem("guestId");
  sessionStorage.removeItem("guestNickname");
};
