import { formatInTimeZone } from 'date-fns-tz';

// 한국 시간 라이브러리
export const getKoreanTimestamp = (): string => {
  return formatInTimeZone(new Date(), 'Asia/Seoul', "yyyy-MM-dd'T'HH:mm:ssXXX");
};