import { create } from "zustand";

interface UserStoreType {
  userId: number;
  userName: string;
  setUserFromStorage: () => void;
  setUser: (id: number, name: string) => void;
}

const useUserStore = create<UserStoreType>()((set) => ({
  userId: 0,
  userName: "",

  setUser: (id, name) => set({ userId: id, userName: name }),

  setUserFromStorage: () =>
    set((state) => {
      try {
        const jsonData = sessionStorage.getItem("auth-storage");
        if (!jsonData) return state;

        const userData = JSON.parse(jsonData).state.user;
        return {
          userId: userData.userId,
          userName: userData.nickname,
        };
      } catch (e) {
        console.error("유저 정보 파싱 실패:", e);
        return state;
      }
    }),
}));

export default useUserStore;
