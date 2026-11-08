import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: {
    id: 1,
    name: 'Você',
    theme: 'light',
    idle_minutes: 10,
    onboarded: true,
  },
  setUser: (userData) => set({ user: { ...userData } }),
  updateUserField: (field, value) =>
    set((state) => ({ user: { ...state.user, [field]: value } })),
}));

