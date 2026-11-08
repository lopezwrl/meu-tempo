import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audio } from '../../utils/audio';

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
        onComplete?.();
        return;
      }
    }

    // Cycle morph words smoothly
    const wordInterval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % MORPH_WORDS.length);
    }, 700);

    // Play soft chime when clock hands snap in
    const chimeTimer = setTimeout(() => {
      audio.playChime();
    }, 750);

    // Auto dismiss splash after sequence
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('mt-splash-seen', 'true');
      }
      setTimeout(() => {
        onComplete?.();
      }, 500); // Wait for exit animation
    }, 2800);

    return () => {
      clearInterval(wordInterval);
      clearTimeout(chimeTimer);
      clearTimeout(dismissTimer);
    };
  }, [forceShow, onComplete]);

  const handleSkip = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mt-splash-seen', 'true');
    }
    setTimeout(() => {
      onComplete?.();
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
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.65, 0.3] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-pink-400/30 to-primary/25 blur-3xl pointer-events-none"
          />

          {/* Animated Official Meu Tempo Icon Badge */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.75, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center filter drop-shadow-[0_16px_36px_rgba(236,72,153,0.35)]"
            >
              {/* Outer soft card container */}
              <svg
                viewBox="0 0 64 64"
                className="w-full h-full"
              >
                <defs>
                  <linearGradient id="mtPinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EC4899" />
                    <stop offset="50%" stopColor="#F472B6" />
                    <stop offset="100%" stopColor="#FB7185" />
                  </linearGradient>
                  <linearGradient id="mtOuterBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(244,114,182,0.6)" />
                    <stop offset="100%" stopColor="rgba(236,72,153,0.2)" />
                  </linearGradient>
                  <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Outer Glassmorphic Squircle */}
                <motion.rect
                  width="64"
                  height="64"
                  rx="16"
                  className="fill-surface/80"
                  stroke="url(#mtOuterBorder)"
                  strokeWidth="1.5"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                {/* Inner Vibrant Pink Squircle Badge */}
                <motion.rect
                  x="8"
                  y="8"
                  width="48"
                  height="48"
                  rx="13"
                  fill="url(#mtPinkGradient)"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }}
                  style={{ transformOrigin: '32px 32px' }}
                />

                {/* Clock Face Circle - Strokes in smoothly */}
                <motion.circle
                  cx="32"
                  cy="32"
                  r="16"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.95 }}
                  transition={{ delay: 0.35, duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
                />

                {/* Clock Hour Hand (V22) */}
                <motion.path
                  d="M32 32V21"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  style={{ transformOrigin: '32px 32px' }}
                  initial={{ rotate: -120, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.65, type: 'spring', stiffness: 240, damping: 18 }}
                />

                {/* Clock Minute Hand (32,32 -> 41,37) */}
                <motion.path
                  d="M32 32L41 37"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  style={{ transformOrigin: '32px 32px' }}
                  initial={{ rotate: -240, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.85, duration: 0.75, type: 'spring', stiffness: 220, damping: 16 }}
                />

                {/* Center Pivot Dot */}
                <motion.circle
                  cx="32"
                  cy="32"
                  r="3.2"
                  fill="#FFF0F5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.95, duration: 0.35, type: 'spring', stiffness: 400, damping: 18 }}
                />
              </svg>

              {/* Twinkling 4-point Sparkle Star 1 */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.85] }}
                transition={{ delay: 1.1, duration: 0.6, ease: 'easeOut' }}
                className="absolute -top-1.5 -right-1.5 text-primary text-xl select-none pointer-events-none drop-shadow-md"
              >
                ✨
              </motion.div>

              {/* Twinkling 4-point Sparkle Star 2 */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.1, 0.9], opacity: [0, 0.8, 0.6] }}
                transition={{ delay: 1.3, duration: 0.6, ease: 'easeOut' }}
                className="absolute -bottom-1 -left-1 text-pink-400 text-sm select-none pointer-events-none"
              >
                🌸
              </motion.div>
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

