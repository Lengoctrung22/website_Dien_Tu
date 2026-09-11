import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin';
  permissions?: string[];
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  setAuth: (user: UserProfile, token: string) => void;
  updateUser: (updatedData: Partial<UserProfile>) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isStaff: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      updateUser: (updatedData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedData } : null,
        })),
      logout: () => set({ user: null, token: null }),
      isAdmin: () => get().user?.role === 'admin',
      isStaff: () => get().user?.role === 'staff' || get().user?.role === 'admin',
    }),
    {
      name: 'techgear_auth_storage',
    }
  )
);
