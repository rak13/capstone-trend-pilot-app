import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  interests: string;
  followers: number;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  linkedinConnected: boolean;
  linkedinPersonId: string | null;
  setAuth: (token: string, user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  setLinkedIn: (personId: string) => void;
  clearLinkedIn: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      linkedinConnected: false,
      linkedinPersonId: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (user) => set({ user }),
      setLinkedIn: (personId) => set({ linkedinConnected: true, linkedinPersonId: personId }),
      clearLinkedIn: () => set({ linkedinConnected: false, linkedinPersonId: null }),
      logout: () => set({ token: null, user: null, linkedinConnected: false, linkedinPersonId: null }),
    }),
    {
      name: "trendpilot-auth",
    },
  ),
);
