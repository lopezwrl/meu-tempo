import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MORPH_WORDS = ['Meu Tempo', 'Organize', 'Foque', 'Acompanhe'];

export function SplashScreen({ onComplete, forceShow = false }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // If not forced and already shown in this session, skip immediately
    if (!forceShow && typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('mt-splash-seen');
      if (alreadyShown) {
        setIsVisible(false);
        onComplete && onComplete();
        return;
      }
    }

    // Cycle morph words smoothly
    const wordInterval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % MORPH_WORDS.length);
    }, 700);

    // Auto dismiss splash after sequence
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('mt-splash-seen', 'true');
      }
      setTimeout(() => {
        onComplete && onComplete();
      }, 500); // Wait for exit animation
    }, 2800);

    return () => {
      clearInterval(wordInterval);
      clearTimeout(dismissTimer);
    };
  }, [forceShow, onComplete]);

  const handleSkip = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mt-splash-seen', 'true');
    }
    setTimeout(() => {
      onComplete && onComplete();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleSkip}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg cursor-pointer select-none overflow-hidden"
          title="Clique para pular"
        >
          {/* Subtle Ambient Radial Glow */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.6, 0.35] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-pink-400/25 to-primary/20 blur-3xl pointer-events-none"
          />

          {/* Animated SVG Clock Mark */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center drop-shadow-[0_8px_24px_rgba(236,72,153,0.25)]"
            >
              <svg
                viewBox="0 0 64 64"
                fill="none"
                className="w-full h-full text-primary"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              >
                {/* Outer Clock Ring with stroke drawing */}
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.1, ease: [0.25, 1, 0.5, 1] }}
                />

                {/* Clock Hour Hand (rotating to 12) */}
                <motion.path
                  d="M32 32V17"
                  style={{ transformOrigin: '32px 32px' }}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.75, duration: 0.65, type: 'spring', stiffness: 220, damping: 18 }}
                />

                {/* Clock Minute Hand (rotating to 2:15) */}
                <motion.path
                  d="M32 32L43 39"
                  style={{ transformOrigin: '32px 32px' }}
                  initial={{ rotate: -270, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.85, duration: 0.75, type: 'spring', stiffness: 200, damping: 16 }}
                />

                {/* Center Pivot Dot */}
                <motion.circle
                  cx="32"
                  cy="32"
                  r="3.5"
                  className="fill-primary"
                  stroke="none"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.95, duration: 0.4, type: 'spring', stiffness: 350, damping: 20 }}
                />
              </svg>
            </motion.div>

            {/* Morphing Word Mark */}
            <div className="mt-6 h-10 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 14, filter: 'blur(8px)', scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(8px)', scale: 1.05 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary whitespace-nowrap"
                >
                  {MORPH_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Subtle Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="text-xs text-text-3 font-medium tracking-widest uppercase mt-2"
            >
              Controle real do seu tempo
            </motion.p>
          </div>

          {/* Skip hint */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            className="absolute bottom-8 text-[11px] text-text-3 font-mono"
          >
            toque para entrar
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

