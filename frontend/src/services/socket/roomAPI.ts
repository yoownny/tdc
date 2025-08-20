import axios from "axios";

const BASE_URL = "http://70.12.247.130:8080";

// 방 입장 API 요청
export const joinRoomAPI = async (roomId: number) => {
  // const token = sessionStorage.getItem("token")

  try {
    const response = await axios.post(`${BASE_URL}/api/rooms/${roomId}/join`, {
      headers: {
        // Authorization token 부분
        Authorization: ``,
      },
    });
    // 디버그용 출력 코드
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
};

// 방 나가기 API 요청
export const leaveRoomAPI = async (roomId: number) => {
  try {
    // const token = sessionStorage.getItem("token")

    const response = await axios.delete(
      `${BASE_URL}/api/rooms/${roomId}/leave`,
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

// 방장 권한 이양 API 요청
export const transferHostRequestAPI = async (
  roomId: number,
  targetUserId: number
) => {
  try {
    // const token = sessionStorage.getItem("token")

    const response = await axios.post(
      `${BASE_URL}/api/rooms/${roomId}/transfer-host`,
      { targetUserId: targetUserId },
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

// 방장 권한 응답 API 요청
export const transferHostResponseAPI = async (
  roomId: number,
  isAccept: boolean
) => {
  try {
    // const token = sessionStorage.getItem("token")

    const response = await axios.post(
      `${BASE_URL}/api/rooms/${roomId}/transfer-host-response`,
      { accept: isAccept },
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

// 준비 상태 변경 API 요청
export const toggleReadyAPI = async (roomId: number, isReady: boolean) => {
  try {
    // const token = sessionStorage.getItem("token")

    const response = await axios.put(
      `${BASE_URL}/api/rooms/${roomId}/ready`,
      { readyStatus: isReady },
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

// 방 삭제 API 요청
export const deleteRoomAPI = async (roomId: number) => {
  try {
    // const token = sessionStorage.getItem("token")

    const response = await axios.delete(
      `${BASE_URL}/api/rooms/${roomId}/delete`,
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
