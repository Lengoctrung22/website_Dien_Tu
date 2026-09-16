'use client';

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin' | 'warehouse' | 'orders';
  permissions?: string[];
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  updateUser: (updatedData: Partial<UserProfile>) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  hasPermission: (permission: string) => boolean;
}

const dynamicSessionStorage: StateStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(name, value);
    } catch {
      // ignore storage write errors
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(name);
    } catch {
      // ignore storage remove errors
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isHydrated: false,
      setAuth: (user, token) => {
        set({ user, token, isHydrated: true });
        if (typeof window !== 'undefined') {
          try {
            // Clean up any legacy localStorage session to avoid cross-tab contamination
            window.localStorage.removeItem('techgear_auth_storage');
          } catch {
            // ignore storage clear errors
          }
        }
      },
      updateUser: (updatedData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedData } : null,
        })),
      logout: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.removeItem('techgear_auth_storage');
            window.localStorage.removeItem('techgear_auth_storage');
          } catch {
            // ignore storage clear errors
          }
        }
      },
      isAdmin: () => get().user?.role === 'admin',
      isStaff: () => {
        const role = get().user?.role;
        return role === 'staff' || role === 'admin' || role === 'warehouse' || role === 'orders';
      },
      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (user.permissions?.includes('all')) return true;
        if ((user.role === 'warehouse' || user.email === 'warehouse@techgear.vn') && permission === 'inventory') {
          return true;
        }
        if ((user.role === 'orders' || user.email === 'orders@techgear.vn') && permission === 'orders') {
          return true;
        }
        return user.permissions?.includes(permission) || false;
      },
    }),
    {
      name: 'techgear_auth_storage',
      storage: createJSONStorage(() => dynamicSessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ isHydrated: true });
      },
    }
  )
);

export function useIsAuthHydrated(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const unsubFinish = useAuthStore.persist?.onFinishHydration?.(callback);
      const unsubStore = useAuthStore.subscribe((state) => {
        if (state.isHydrated) callback();
      });
      return () => {
        unsubFinish?.();
        unsubStore();
      };
    },
    () => Boolean(useAuthStore.persist?.hasHydrated?.() || useAuthStore.getState().isHydrated),
    () => false
  );
}

