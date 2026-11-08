import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api, queryKeys } from './services/api';
import { useUserStore } from './stores/userStore';
import { ParticleBackground } from './components/layout/ParticleBackground';
import { SplashScreen } from './components/layout/SplashScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Dock } from './components/layout/Dock';
import { TopBar } from './components/layout/TopBar';
import { CompletionModal } from './components/features/CompletionModal';
import { CommandPalette } from './components/features/CommandPalette';
import { ToastProvider } from './components/ui/Toast';

// Pages
import { Home } from './pages/Home';
import { Tasks } from './pages/Tasks';
import { Notes } from './pages/Notes';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

const ROUTE_INDICES = {
  '/': 0,
  '/tarefas': 1,
  '/notas': 2,
  '/historico': 3,
  '/configuracoes': 4,
};

function getRouteIndex(pathname) {
  if (pathname === '/') return 0;
  for (const [route, index] of Object.entries(ROUTE_INDICES)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return index;
    }
  }
  return 0;
}

const pageVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir) => ({
    x: dir > 0 ? -30 : 30,
    opacity: 0,
  }),
};

export function App() {
  const location = useLocation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('mt-splash-seen');
    }
    return true;
  });
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    const handleReplay = () => {
      setShowSplash(true);
    };
    window.addEventListener('mt-replay-splash', handleReplay);
    return () => window.removeEventListener('mt-replay-splash', handleReplay);
  }, []);

  // Sync user profile on mount
  useQuery({
    queryKey: queryKeys.user,
    queryFn: async () => {
      try {
        const u = await api.getUser();
        if (u) setUser(u);
        return u;
      } catch {
        return null;
      }
    },
  });

  // Fetch notes & tasks for Command Palette
  const { data: notes = [] } = useQuery({
    queryKey: queryKeys.notes,
    queryFn: api.getNotes,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: api.getTasks,
  });

  // Track tab navigation direction for horizontal slide animation
  const currentIndex = getRouteIndex(location.pathname);
  const prevIndexRef = useRef(currentIndex);
  const direction = currentIndex - prevIndexRef.current;

  useEffect(() => {
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Global Ctrl+K shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ToastProvider>
      <div className="relative min-h-screen flex bg-bg text-text selection:bg-pink-200 selection:text-pink-900 transition-colors">
        {/* Anti-gravity particle background */}
        <ParticleBackground />

        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
          <TopBar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

          <main className="flex-1 px-4 sm:px-8 py-6 max-w-6xl w-full mx-auto">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={location.pathname}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="w-full"
              >
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/tarefas" element={<Tasks />} />
                  <Route path="/notas" element={<Notes />} />
                  <Route path="/historico" element={<History />} />
                  <Route path="/configuracoes" element={<Settings />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Mobile Bottom Dock (hidden on desktop) */}
          <Dock />
        </div>

        {/* Entrance Splash Animation */}
        {showSplash && (
          <SplashScreen
            forceShow={true}
            onComplete={() => setShowSplash(false)}
          />
        )}

        {/* Global Modals */}
        <CompletionModal />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          notes={notes}
          tasks={tasks}
        />
      </div>
    </ToastProvider>
  );
}

