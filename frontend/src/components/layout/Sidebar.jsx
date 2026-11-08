import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DOCK_ITEMS } from './Dock';
import { useThemeStore } from '../../stores/themeStore';
import { Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { actualTheme, toggleTheme } = useThemeStore();

  return (
    <aside
      className={`hidden lg:flex flex-col sticky top-0 h-screen border-r border-primary-border/60 bg-surface/80 backdrop-blur-xl transition-[width] duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-20 border-b border-primary-border/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 shrink-0 drop-shadow-sm">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <rect width="64" height="64" rx="16" className="fill-surface-2" stroke="rgba(236,72,153,0.3)" strokeWidth="1.5" />
              <rect x="8" y="8" width="48" height="48" rx="13" fill="#EC4899" />
              <circle cx="32" cy="32" r="16" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M32 32V21M32 32l9 5" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="32" cy="32" r="3" fill="#FFF0F5" />
            </svg>
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col min-w-0"
            >
              <span className="font-bold text-base text-text tracking-tight">Meu Tempo</span>
              <span className="text-[11px] text-text-3 font-medium">Controle com leveza</span>
            </motion.div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-xl text-text-3 hover:text-text hover:bg-surface-2 transition-colors"
          title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {DOCK_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 outline-none ${
                isActive
                  ? 'text-primary bg-primary-soft border border-primary/20 shadow-sm shadow-pink-500/5'
                  : 'text-text-2 hover:text-text hover:bg-surface-2'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive ? 'scale-110 text-primary' : ''
                }`}
              />
              {!collapsed && (
                <span className="truncate tracking-tight">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Theme Toggle */}
      <div className="p-4 border-t border-primary-border/40 space-y-2">
        <button
          type="button"
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-text-2 hover:text-primary hover:bg-surface-2 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Alternar tema claro/escuro"
        >
          {actualTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 text-pink-500 shrink-0" />
          )}
          {!collapsed && (
            <span>{actualTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          )}
        </button>
      </div>
    </aside>
  );
}

