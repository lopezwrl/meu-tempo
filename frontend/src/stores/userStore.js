import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: {
    id: 1,
    name: '',
    theme: 'light',
    idle_minutes: 10,
    onboarded: null, // null = still loading, false = needs onboarding, true = done
  },
  setUser: (userData) => set({ user: { ...userData } }),
  updateUserField: (field, value) =>
    set((state) => ({ user: { ...state.user, [field]: value } })),
}));

