// 디바이스 타입 감지 함수
export function getDeviceType(): "desktop" | "mobile" | "tablet" {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}