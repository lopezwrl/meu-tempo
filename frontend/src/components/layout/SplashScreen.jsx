import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audio } from '../../utils/audio';

export function SplashScreen({ onComplete, forceShow = false }) {
  // Phases:
  // 'clock'   -> Mostrador ao vivo (HH:MM) no centro com ":" pulsando
  // 'morph'   -> Recolhe os dígitos e abre o emblema oficial do Meu Tempo
  // 'check1'  -> Primeiro check animado + som mecânico sutil
  // 'check2'  -> Segundo check + linha pendente + nome Meu Tempo
  // 'curtain' -> Cortina horizontal dividida abre o palco para o app
  const [phase, setPhase] = useState('clock');
  const [isVisible, setIsVisible] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const exitingRef = useRef(false);

  const handleExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setPhase('curtain');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mt-splash-seen', 'true');
    }
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 620);
  }, [onComplete]);

  useEffect(() => {
    exitingRef.current = false;

    if (!forceShow && typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('mt-splash-seen');
      if (alreadyShown) {
        setIsVisible(false);
        onComplete?.();
        return;
      }
    }

    const clockTick = setInterval(() => {
      setNow(new Date());
    }, 1000);

    // Choreographed mechanical sequence
    const tMorph = setTimeout(() => {
      setPhase('morph');
      audio.playChime();
    }, 950);

    const tCheck1 = setTimeout(() => {
      setPhase('check1');
      audio.playCheckTick(1);
    }, 1350);

    const tCheck2 = setTimeout(() => {
      setPhase('check2');
      audio.playCheckTick(1.25);
      audio.playWarmChord();
    }, 1780);

    const tCurtain = setTimeout(() => {
      handleExit();
    }, 2850);

    return () => {
      clearInterval(clockTick);
      clearTimeout(tMorph);
      clearTimeout(tCheck1);
      clearTimeout(tCheck2);
      clearTimeout(tCurtain);
    };
  }, [forceShow, onComplete, handleExit]);

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const formattedDay = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(now);

  const isClock = phase === 'clock';
  const showCard = phase === 'morph' || phase === 'check1' || phase === 'check2' || phase === 'curtain';
  const stage =
    phase === 'check1' ? 1 : phase === 'check2' || phase === 'curtain' ? 2 : 0;
  const isCurtain = phase === 'curtain';

  if (!isVisible) return null;

  return (
    <div
      onClick={handleExit}
      className="fixed inset-0 z-[100] select-none overflow-hidden cursor-pointer pointer-events-auto"
      aria-label="Abertura Meu Tempo"
    >
      {/* Split Curtain Top Blade */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{ y: isCurtain ? '-100%' : '0%' }}
        transition={{ duration: 0.62, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-x-0 top-0 h-1/2 bg-bg border-b border-primary-border/30"
      />

      {/* Split Curtain Bottom Blade */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{ y: isCurtain ? '100%' : '0%' }}
        transition={{ duration: 0.62, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-bg border-t border-primary-border/30"
      />

      {/* Center Stage Content (fades swiftly as curtain opens) */}
      <motion.div
        animate={{
          opacity: isCurtain ? 0 : 1,
          scale: isCurtain ? 0.94 : 1,
        }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6"
      >
        <AnimatePresence mode="wait">
          {isClock ? (
            /* ACT 1: Exact Live Digital Timepiece */
            <motion.div
              key="live-clock"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.84, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center"
            >
              <div className="flex items-baseline font-mono font-extrabold tracking-tighter text-5xl sm:text-7xl text-text">
                <span>{hours}</span>
                <motion.span
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                  className="text-primary mx-1"
                >
                  :
                </motion.span>
                <span>{minutes}</span>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="mt-2 text-xs sm:text-sm font-medium text-text-3 capitalize"
              >
                {formattedDay}
              </motion.p>
            </motion.div>
          ) : (
            /* ACT 2: Unfolding into the Official Meu Tempo Checklist Emblem */
            <motion.div
              key="favicon-emblem"
              initial={{ opacity: 0, scale: 0.78 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[34px] sm:rounded-[40px] bg-surface border border-primary-border/70 shadow-lg p-2.5">
                <svg
                  viewBox="0 0 512 512"
                  className="w-full h-full rounded-[26px] sm:rounded-[30px]"
                >
                  {/* Squircle Base matching official favicon */}
                  <rect width="512" height="512" rx="128" fill="#F9C6D0" />

                  {/* Row 1 */}
                  <motion.rect
                    x="128"
                    y="144"
                    width="64"
                    height="64"
                    rx="16"
                    fill="#D63B6A"
                    initial={{ scale: 0 }}
                    animate={{ scale: showCard ? 1 : 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    style={{ transformOrigin: '160px 176px' }}
                  />
                  <motion.polyline
                    points="136,176 152,200 192,160"
                    fill="none"
                    stroke="white"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: stage >= 1 ? 1 : 0,
                      opacity: stage >= 1 ? 1 : 0,
                    }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  />
                  <motion.rect
                    x="224"
                    y="160"
                    width="176"
                    height="32"
                    rx="16"
                    fill="#D63B6A"
                    opacity="0.5"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: stage >= 1 ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ transformOrigin: '224px 176px' }}
                  />

                  {/* Row 2 */}
                  <motion.rect
                    x="128"
                    y="240"
                    width="64"
                    height="64"
                    rx="16"
                    fill="#D63B6A"
                    initial={{ scale: 0 }}
                    animate={{ scale: stage >= 1 ? 1 : 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.08 }}
                    style={{ transformOrigin: '160px 272px' }}
                  />
                  <motion.polyline
                    points="136,272 152,296 192,256"
                    fill="none"
                    stroke="white"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: stage >= 2 ? 1 : 0,
                      opacity: stage >= 2 ? 1 : 0,
                    }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  />
                  <motion.rect
                    x="224"
                    y="256"
                    width="136"
                    height="32"
                    rx="16"
                    fill="#D63B6A"
                    opacity="0.5"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: stage >= 2 ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ transformOrigin: '224px 272px' }}
                  />

                  {/* Row 3: Upcoming Focus Block */}
                  <motion.rect
                    x="128"
                    y="336"
                    width="64"
                    height="64"
                    rx="16"
                    fill="#F0A0B5"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: stage >= 2 ? 1 : 0,
                      opacity: stage >= 2 ? 0.7 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 360, damping: 22, delay: 0.1 }}
                    style={{ transformOrigin: '160px 368px' }}
                  />
                  <motion.rect
                    x="224"
                    y="352"
                    width="104"
                    height="32"
                    rx="16"
                    fill="#D63B6A"
                    opacity="0.3"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: stage >= 2 ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
                    style={{ transformOrigin: '224px 368px' }}
                  />
                </svg>
              </div>

              {/* Clean Brand Reveal */}
              <motion.div
                initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
                transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 text-center"
              >
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
                  Meu Tempo
                </h1>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle Skip Hint */}
        <span className="absolute bottom-6 text-[11px] text-text-3 font-medium opacity-60">
          Toque para entrar
        </span>
      </motion.div>
    </div>
  );
}
