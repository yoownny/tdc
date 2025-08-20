export interface TimerColorSet {
  backgroundColor: string;
  borderColor: string;
  shadowColor: string;
  tailwindBgClass: string;
  tailwindBorderClass: string;
  tailwindShadowClass: string;
}

// RGB 값 사이를 선형 보간하는 함수
const interpolateRGB = (color1: [number, number, number], color2: [number, number, number], factor: number): [number, number, number] => {
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * factor),
    Math.round(color1[1] + (color2[1] - color1[1]) * factor),
    Math.round(color1[2] + (color2[2] - color1[2]) * factor),
  ];
};

export const getTimerColors = (progress: number): TimerColorSet => {
  // progress: 0-100 (100이 시작, 0이 종료)
  const percentage = progress / 100;
  
  // 색상 정의 (RGB)
  const yellow: [number, number, number] = [255, 215, 0]; // 적당한 노랑 (gold)
  const orange: [number, number, number] = [255, 165, 0]; // 주황 (orange)
  const red: [number, number, number] = [255, 69, 0]; // 빨강-주황 (orangered)
  
  let currentColor: [number, number, number];
  
  if (percentage > 0.5) {
    // 50% ~ 100%: 노랑에서 주황으로
    const factor = 1 - ((percentage - 0.5) / 0.5); // 0에서 1로 (50%일 때 1, 100%일 때 0)
    currentColor = interpolateRGB(yellow, orange, factor);
  } else {
    // 0% ~ 50%: 주황에서 빨강으로
    const factor = 1 - (percentage / 0.5); // 0에서 1로 (50%일 때 0, 0%일 때 1)
    currentColor = interpolateRGB(orange, red, factor);
  }
  
  const [r, g, b] = currentColor;
  
  return {
    backgroundColor: `rgb(${r} ${g} ${b})`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.9)`,
    shadowColor: `rgba(${r}, ${g}, ${b}, 0.4)`,
    tailwindBgClass: `bg-[rgb(${r}_${g}_${b})]`,
    tailwindBorderClass: `border-[rgba(${r},${g},${b},0.9)]`,
    tailwindShadowClass: `shadow-[0_0_20px_rgba(${r},${g},${b},0.4)]`,
  };
};