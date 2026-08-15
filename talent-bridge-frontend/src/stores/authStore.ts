import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { apiClient } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateGrade: (grade: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),

      logout: () => set({ user: null, token: null }),

      updateGrade: (grade) =>
        set((s) => ({
          user: s.user ? { ...s.user, grade: grade as User['grade'] } : null,
        })),

      login: async (email, password) => {
        const res = await apiClient.post<{
          success: boolean;
          data: { token: string; userId: string; name: string; email: string; grade: string; role: string };
        }>('/api/auth/login', { email, password });

        if (!res.data.success) throw new Error('Login failed');

        const { token, userId, name, email: userEmail, grade, role } = res.data.data;
        const user: User = {
          id: userId,
          name,
          email: userEmail,
          role,
          grade: grade as User['grade'],
          createdAt: new Date().toISOString(),
        };
        set({ user, token });
      },

      register: async (name, email, password) => {
        const res = await apiClient.post<{
          success: boolean;
          data: { userId: string; token: string; name: string; email: string; grade: string; role: string };
        }>('/api/auth/register', { name, email, password });

        if (!res.data.success) throw new Error('Registration failed');

        const { userId, token, grade, name: userName, email: userEmail, role } = res.data.data;
        const user: User = {
          id: userId,
          name: userName ?? name,
          email: userEmail ?? email,
          role: role ?? 'Talent',
          grade: grade as User['grade'],
          createdAt: new Date().toISOString(),
        };
        set({ user, token });
      },
    }),
    { name: 'auth-storage' }
  )
);
