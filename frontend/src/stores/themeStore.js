import { create } from 'zustand';

function getInitialTheme() {
  const saved = localStorage.getItem('meutempo-theme');
  if (saved && ['light', 'dark', 'auto'].includes(saved)) {
    return saved;
  }
  return 'auto';
}

function resolveActualTheme(preference) {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyThemeToDom(actualTheme) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (actualTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
    }
  }
}

export const useThemeStore = create((set, get) => {
  const initialTheme = getInitialTheme();
  const initialActual = resolveActualTheme(initialTheme);
  applyThemeToDom(initialActual);

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      const currentPref = get().theme;
      if (currentPref === 'auto') {
        const nextActual = resolveActualTheme('auto');
        applyThemeToDom(nextActual);
        set({ actualTheme: nextActual });
      }
    });
  }

  return {
    theme: initialTheme, // 'light' | 'dark' | 'auto'
    actualTheme: initialActual, // 'light' | 'dark'
    setTheme: (newTheme) => {
      localStorage.setItem('meutempo-theme', newTheme);
      const actual = resolveActualTheme(newTheme);
      applyThemeToDom(actual);
      set({ theme: newTheme, actualTheme: actual });
    },
    toggleTheme: () => {
      const current = get().actualTheme;
      const next = current === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});

