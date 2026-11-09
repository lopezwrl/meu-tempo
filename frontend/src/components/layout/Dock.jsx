import React, { useRef, useState, useEffect, useCallback } from 'react';
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

  // Measure active item position & width accurately at every stage of label expansion
  const updateIndicator = useCallback(() => {
    const activeEl = itemRefs.current[activeIndex];
    const container = dockRef.current;
    if (!activeEl || !container) return;

    const nextLeft = activeEl.offsetLeft;
    const nextWidth = activeEl.offsetWidth;

    setIndicatorStyle((prev) => {
      if (
        prev.ready &&
        Math.abs(prev.left - nextLeft) < 0.5 &&
        Math.abs(prev.width - nextWidth) < 0.5
      ) {
        return prev;
      }
      return {
        left: nextLeft,
        width: nextWidth,
        ready: true,
      };
    });
  }, [activeIndex]);

  useEffect(() => {
    updateIndicator();

    // Observe size changes on all dock items & container so while the label
    // animates from width: 0 -> auto (and previous label shrinks), the pill
    // tracks the exact final dimensions without clipping "Mais" or any label.
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateIndicator();
      });
      if (dockRef.current) ro.observe(dockRef.current);
      itemRefs.current.forEach((el) => {
        if (el) ro.observe(el);
      });
    }

    // Fallback multi-step checks across the 200ms label transition
    const t1 = setTimeout(updateIndicator, 50);
    const t2 = setTimeout(updateIndicator, 150);
    const t3 = setTimeout(updateIndicator, 240);
    const t4 = setTimeout(updateIndicator, 350);

    window.addEventListener('resize', updateIndicator);

    return () => {
      if (ro) ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeIndex, location.pathname, updateIndicator]);

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
        className="dock-container pointer-events-auto relative flex items-center gap-0.5 p-1.5 rounded-full bg-surface/90 backdrop-blur-xl border border-primary-border shadow-xl shadow-pink-500/10"
      >
        {/* Sliding Indicator Pill */}
        {indicatorStyle.ready && (
          <motion.div
            initial={false}
            animate={{
              x: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 32,
            }}
            className="absolute top-1.5 bottom-1.5 left-0 rounded-full bg-primary-soft border border-primary/25 z-0 pointer-events-none"
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
              className={`relative z-10 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold select-none transition-colors duration-200 outline-none ${
                isActive ? 'text-primary' : 'text-text-3 hover:text-text-2'
              }`}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.12 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="shrink-0 flex items-center justify-center"
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    onUpdate={updateIndicator}
                    onAnimationComplete={updateIndicator}
                    className="overflow-hidden whitespace-nowrap pl-0.5 pr-1 text-primary inline-block"
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
