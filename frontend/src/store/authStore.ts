'use client';

import { useState, useEffect } from 'react';
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
  recheckAuth: () => boolean;
}

const STORAGE_KEY = 'techgear_auth_storage';

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
            window.localStorage.removeItem(STORAGE_KEY);
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
        set({ user: null, token: null, isHydrated: true });
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.removeItem(STORAGE_KEY);
            window.localStorage.removeItem(STORAGE_KEY);
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
      recheckAuth: () => syncAuthFromStorage(),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => dynamicSessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
        useAuthStore.setState({ isHydrated: true });
      },
    }
  )
);

/**
 * Synchronously reads the current browser tab's sessionStorage and updates the Zustand store.
 * Guaranteed to keep multi-tab sessions strictly isolated without cross-tab contamination.
 */
export function syncAuthFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const storedUser = parsed?.state?.user || parsed?.user;
      const storedToken = parsed?.state?.token || parsed?.token;

      if (storedUser && typeof storedUser === 'object' && storedUser.role) {
        const currentState = useAuthStore.getState();
        if (
          !currentState.isHydrated ||
          !currentState.user ||
          currentState.user.id !== storedUser.id ||
          currentState.user.role !== storedUser.role ||
          currentState.token !== (storedToken || null)
        ) {
          useAuthStore.setState({
            user: storedUser,
            token: storedToken || null,
            isHydrated: true,
          });
        }
        return true;
      }
    }

    // Storage has no valid session
    const currentState = useAuthStore.getState();
    if (currentState.user !== null) {
      useAuthStore.setState({ user: null, token: null, isHydrated: true });
    } else if (!currentState.isHydrated) {
      useAuthStore.setState({ isHydrated: true });
    }
    return false;
  } catch (err) {
    console.warn('[authStore] Failed to sync auth from storage:', err);
    if (!useAuthStore.getState().isHydrated) {
      useAuthStore.setState({ isHydrated: true });
    }
    return false;
  }
}

// Initial client-side sync as soon as module loads in the browser
if (typeof window !== 'undefined') {
  syncAuthFromStorage();
}

/**
 * Reliable React hook for client-side authentication hydration.
 * Ensures initial SSR render does not cause hydration mismatches,
 * and guarantees hydration completes immediately upon mounting on the client (within 1 tick).
 */
export function useIsAuthHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 1. Synchronously sync auth from current tab's sessionStorage
    syncAuthFromStorage();

    // 2. Mark as hydrated on next macrotask to avoid cascading render lint warning
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 0);

    // 3. Keep in sync with any subsequent store changes (e.g. login/logout)
    const unsub = useAuthStore.subscribe((state) => {
      if (state.isHydrated) {
        setIsHydrated(true);
      }
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  return isHydrated;
}
