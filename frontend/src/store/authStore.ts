import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin' | 'warehouse' | 'orders';
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
  hasPermission: (permission: string) => boolean;
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
      logout: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('techgear_auth_storage');
            sessionStorage.clear();
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
    }
  )
);

