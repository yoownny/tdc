import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthState } from "./types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 상태
      user: null,
      _hasHydrated: false,
      accessToken: null,

      // 액션
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => set({ user: null, accessToken: null }),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
