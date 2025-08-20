import axios from "axios";

const BASE_URL = "http://70.12.247.130:8080";

// 정답 시도 API 요청
export const attemptAnswerAPI = async (roomId: number, content: string) => {
  // const token = sessionStorage.getItem("token")

  try {
    const response = await axios.post(
      `${BASE_URL}/api/games/${roomId}/guess`,
      { guess_text: content },
      {
        headers: {
          // Authorization token 부분
          Authorization: ``,
        },
      }
    );
    // 디버그용 출력 코드
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
};

// 정답 판정 API 요청
export const judgeAnswerAPI = async (roomId: number, isCorrect: boolean) => {
  try {
    // const token = sessionStorage.getItem("token")

    const response = await axios.post(
      `${BASE_URL}/api/rooms/${roomId}/judge`,
      { isCorrect: isCorrect },
      {
        headers: {
          // Authorization token 부분
          Authorization: ``,
        },
      }
    );
    // 디버그용 출력 코드
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
};
