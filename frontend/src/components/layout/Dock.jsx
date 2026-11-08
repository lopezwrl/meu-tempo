import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, CheckSquare, BookOpen, BarChart3, Settings } from 'lucide-react';

export const DOCK_ITEMS = [
  { path: '/', label: 'Início', icon: Home, index: 0 },
  { path: '/tarefas', label: 'Tarefas', icon: CheckSquare, index: 1 },
  { path: '/notas', label: 'Notas', icon: BookOpen, index: 2 },
  { path: '/historico', label: 'Histórico', icon: BarChart3, index: 3 },
  { path: '/configuracoes', label: 'Mais', icon: Settings, index: 4 },
];

export function Dock() {
  const location = useLocation();
  const dockRef = useRef(null);
  const itemRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, ready: false });
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Identify active item index based on current path
  const activeIndex = Math.max(
    0,
    DOCK_ITEMS.findIndex((item) => {
      if (item.path === '/') return location.pathname === '/';
      return location.pathname.startsWith(item.path);
    })
  );

  // Mandatory solution: calculate indicator position via getBoundingClientRect() of activeEl & dock container
  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = itemRefs.current[activeIndex];
      const container = dockRef.current;
      if (!activeEl || !container) return;

      const { left, width } = activeEl.getBoundingClientRect();
      const containerLeft = container.getBoundingClientRect().left;
      setIndicatorStyle({
        left: left - containerLeft,
        width,
        ready: true,
      });
    };

    updateIndicator();
    // Re-check after layout has settled / fonts loaded
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeIndex, location.pathname]);

  // Hide dock on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 60) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 20) {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="lg:hidden fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
      <motion.nav
        ref={dockRef}
        aria-label="Navegação móvel"
        animate={{
          y: isVisible ? 0 : 80,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="dock-container pointer-events-auto relative flex items-center p-1.5 rounded-full bg-surface/90 backdrop-blur-xl border border-primary-border shadow-xl shadow-pink-500/10"
      >
        {/* Sliding Indicator Pill using getBoundingClientRect relative coords & spring */}
        {indicatorStyle.ready && (
          <motion.div
            layoutId="dock-indicator"
            initial={false}
            animate={{
              x: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            className="absolute top-1.5 bottom-1.5 left-0 rounded-full bg-primary-soft border border-primary/25 z-0"
          />
        )}

        {DOCK_ITEMS.map((item, index) => {
          const isActive = activeIndex === index;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              ref={(el) => (itemRefs.current[index] = el)}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold select-none transition-colors duration-200 outline-none ${
                isActive ? 'text-primary' : 'text-text-3 hover:text-text-2'
              }`}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              <AnimatePresence>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="overflow-hidden whitespace-nowrap pl-0.5 text-primary"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </motion.nav>
    </div>
  );
}

