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
          <div className="w-10 h-10 shrink-0 drop-shadow-sm rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(214,59,106,0.18)]">
            <svg viewBox="0 0 512 512" className="w-full h-full">
              <rect width="512" height="512" rx="128" fill="#F9C6D0" />
              <rect x="128" y="144" width="64" height="64" rx="16" fill="#D63B6A" />
              <rect x="224" y="160" width="176" height="32" rx="16" fill="#D63B6A" opacity="0.5" />
              <polyline points="136,176 152,200 192,160" fill="none" stroke="white" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="128" y="240" width="64" height="64" rx="16" fill="#D63B6A" />
              <rect x="224" y="256" width="136" height="32" rx="16" fill="#D63B6A" opacity="0.5" />
              <polyline points="136,272 152,296 192,256" fill="none" stroke="white" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="128" y="336" width="64" height="64" rx="16" fill="#F0A0B5" opacity="0.7" />
              <rect x="224" y="352" width="104" height="32" rx="16" fill="#D63B6A" opacity="0.3" />
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

