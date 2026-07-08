// Authentication state management using Zustand
import { create } from 'zustand';
import { User, UserRole } from '../types';
import { authService } from '../services';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  clearUser: () => set({ user: null, isAuthenticated: false }),

  logout: async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    set({ user: null, isAuthenticated: false });
  },

  hasRole: (role) => {
    const { user } = get();
    return user?.role === role;
  },
}));
