import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { audio } from '../../utils/audio';
import { Sparkles, ArrowRight } from 'lucide-react';

const SUBTITLES = [
  { icon: '🌸', text: 'Planejamento com leveza' },
  { icon: '⚡', text: 'Foco sem ansiedade' },
  { icon: '🌿', text: 'Seu ritmo, suas regras' },
  { icon: '✨', text: 'Tudo pronto para você' },
];

export function SplashScreen({ onComplete, forceShow = false }) {
  const [stage, setStage] = useState(0); // 0: enter, 1: check1, 2: check2, 3: ready
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // 3D Tilt on mouse move
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 15 });
  const rotateX = useTransform(springY, [-200, 200], [8, -8]);
  const rotateY = useTransform(springX, [-200, 200], [-8, 8]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

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

    // Choreographed entrance timeline
    const t0 = setTimeout(() => {
      setStage(1);
      audio.playCheckTick(1);
    }, 450);

    const t1 = setTimeout(() => {
      setStage(2);
      audio.playCheckTick(1.25);
    }, 900);

    const t2 = setTimeout(() => {
      setStage(3);
      audio.playWarmChord();
    }, 1350);

    // Rotate subtitle messages
    const subInterval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % SUBTITLES.length);
    }, 750);

    // Auto dismiss splash
    const dismissTimer = setTimeout(() => {
      handleExit();
    }, 3200);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(subInterval);
      clearTimeout(dismissTimer);
    };
  }, [forceShow, onComplete]);

  const handleExit = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mt-splash-seen', 'true');
    }
    setTimeout(() => {
      onComplete?.();
    }, 450);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMouseMove}
          onClick={handleExit}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg select-none overflow-hidden cursor-pointer"
          style={{ perspective: 1200 }}
        >
          {/* Ambient Multi-Layer Glow */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.65, 0.35] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-[#F9C6D0]/50 via-[#D63B6A]/30 to-[#F0A0B5]/40 blur-3xl pointer-events-none"
          />

          {/* Floating Stardust Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0,
                  scale: 0.5,
                }}
                animate={{
                  y: [null, '-=60'],
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
                className="absolute w-2 h-2 rounded-full bg-[#D63B6A]/30 blur-[1px]"
              />
            ))}
          </div>

          {/* Interactive 3D Favicon Emblem Card */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Outer Aura Ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: stage >= 3 ? [1, 1.06, 1] : 1,
                opacity: stage >= 3 ? [0.6, 0.9, 0.6] : 0.4,
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="absolute -inset-4 rounded-[42px] bg-gradient-to-tr from-[#D63B6A]/20 via-[#F9C6D0]/40 to-[#F0A0B5]/20 blur-xl pointer-events-none"
            />

            {/* The Animated SVG Icon Card */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-[36px] bg-white dark:bg-[#240D17] shadow-[0_20px_50px_rgba(214,59,106,0.28)] p-2.5 border border-[#D63B6A]/15 backdrop-blur-xl"
            >
              <svg
                viewBox="0 0 512 512"
                className="w-full h-full drop-shadow-sm"
              >
                {/* Background Squircle */}
                <rect width="512" height="512" rx="128" fill="#F9C6D0" />

                {/* ROW 1: First Task */}
                <motion.rect
                  x="128"
                  y="144"
                  width="64"
                  height="64"
                  rx="16"
                  fill="#D63B6A"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: stage >= 1 ? 1 : 0, opacity: stage >= 1 ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
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
                  animate={{ pathLength: stage >= 1 ? 1 : 0, opacity: stage >= 1 ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
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
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ transformOrigin: '224px 176px' }}
                />

                {/* ROW 2: Second Task */}
                <motion.rect
                  x="128"
                  y="240"
                  width="64"
                  height="64"
                  rx="16"
                  fill="#D63B6A"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: stage >= 2 ? 1 : 0, opacity: stage >= 2 ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
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
                  animate={{ pathLength: stage >= 2 ? 1 : 0, opacity: stage >= 2 ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
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
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ transformOrigin: '224px 272px' }}
                />

                {/* ROW 3: Pending Task with Active Pulsing Aura */}
                <motion.rect
                  x="128"
                  y="336"
                  width="64"
                  height="64"
                  rx="16"
                  fill="#F0A0B5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: stage >= 3 ? [1, 1.06, 1] : 0,
                    opacity: stage >= 3 ? [0.65, 0.95, 0.65] : 0,
                  }}
                  transition={{
                    scale: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
                    opacity: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
                  }}
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
                  animate={{ scaleX: stage >= 3 ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ transformOrigin: '224px 368px' }}
                />
              </svg>

              {/* Twinkling Accent Stars */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: [1, 1.25, 1], rotate: [0, 15, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute -top-2.5 -right-2.5 text-primary text-2xl select-none pointer-events-none drop-shadow-md"
              >
                ✨
              </motion.div>
            </motion.div>

            {/* Typography: Brand Title with Gradient Glow */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-6 flex flex-col items-center"
            >
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#D63B6A] via-[#E85280] to-[#F07297] bg-clip-text text-transparent drop-shadow-sm">
                Meu Tempo
              </h1>

              {/* Dynamic Kinetic Subtitle Pill */}
              <div className="mt-3 h-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={subtitleIndex}
                    initial={{ opacity: 0, y: 8, filter: 'blur(4px)', scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)', scale: 1.04 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/90 border border-primary/20 text-text-2 text-xs font-semibold shadow-sm backdrop-blur-md"
                  >
                    <span>{SUBTITLES[subtitleIndex].icon}</span>
                    <span>{SUBTITLES[subtitleIndex].text}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Interactive "Entrar no Meu Tempo" button pill */}
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExit();
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-lg shadow-[#D63B6A]/25 hover:shadow-xl hover:shadow-[#D63B6A]/35 transition-all group"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Entrar no Meu Tempo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Quick Skip hint */}
          <span className="absolute bottom-6 text-[11px] text-text-3 font-mono opacity-50">
            toque em qualquer lugar para pular
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
