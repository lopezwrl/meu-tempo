import React from 'react';
import { useUserStore } from '../../stores/userStore';
import { useThemeStore } from '../../stores/themeStore';
import { TimerPill } from './TimerPill';
import { Search, Sun, Moon, Sparkles, Headphones, Wind } from 'lucide-react';

export function TopBar({ onOpenCommandPalette }) {
  const user = useUserStore((s) => s.user);
  const { actualTheme, toggleTheme } = useThemeStore();

  // Greeting by hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Date in pt-BR
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  // Capitalize first letter of date
  const displayDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const userName = user?.name?.trim() ? user.name : 'Você';

  return (
    <header className="topbar sticky top-0 z-20 w-full px-4 sm:px-8 py-4 backdrop-blur-xl bg-surface/70 border-b border-primary-border/40 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Left Greeting & Date */}
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-text tracking-tight truncate flex items-center gap-2">
            <span>{getGreeting()}, {userName}</span>
            <Sparkles className="w-4 h-4 text-primary shrink-0 fill-primary/20" />
          </h1>
          <p className="text-xs text-text-3 font-medium capitalize mt-0.5">
            {displayDate}
          </p>
        </div>

        {/* Right Actions & Floating Timer Pill */}
        <div className="flex items-center gap-2">
          {/* Timer Pill */}
          <TimerPill />

          {/* Focus Sanctuary Quick Button */}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('mt-open-sanctuary', { detail: 'sound' })
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-primary-border/60 text-text-2 hover:text-primary hover:border-primary text-xs font-semibold transition-all shadow-sm"
            title="Santuário de Foco & Sons Offline"
          >
            <Headphones className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Santuário</span>
          </button>

          {/* Box Breathing Quick Button */}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('mt-open-sanctuary', { detail: 'breath' })
              )
            }
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-primary-border/60 text-text-2 hover:text-primary hover:border-primary text-xs font-semibold transition-all shadow-sm"
            title="Respiração Guiada 4-4-4-4"
          >
            <Wind className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Respirar</span>
          </button>

          {/* Search / Command palette button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-primary-border/60 text-text-3 hover:text-text hover:border-primary text-xs font-medium transition-all shadow-sm"
            title="Buscar (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Buscar</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-2 text-[10px] text-text-3 border border-primary-border/40 font-mono">
              Ctrl K
            </kbd>
          </button>

          {/* Quick theme toggle in mobile */}
          <button
            type="button"
            onClick={toggleTheme}
            className="lg:hidden p-2 rounded-xl text-text-3 hover:text-primary hover:bg-surface-2 transition-colors border border-primary-border/40"
            title="Alternar tema"
          >
            {actualTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-pink-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
