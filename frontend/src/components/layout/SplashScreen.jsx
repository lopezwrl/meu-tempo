import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { audio } from '../../utils/audio';
import { Sparkles, ArrowRight, Heart, Zap, Compass, CheckCircle2 } from 'lucide-react';

const SUBTITLES = [
  { Icon: Heart, text: 'Planejamento com leveza e clareza' },
  { Icon: Zap, text: 'Foco profundo sem ansiedade' },
  { Icon: Compass, text: 'Seu ritmo biológico respeitado' },
  { Icon: CheckCircle2, text: 'Tudo pronto para o seu melhor dia' },
];

export function SplashScreen({ onComplete, forceShow = false }) {
  const [stage, setStage] = useState(0); // 0: enter, 1: check1, 2: check2, 3: ready
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // 3D Perspective Tilt on mouse move
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 18 });
  const rotateX = useTransform(springY, [-250, 250], [10, -10]);
  const rotateY = useTransform(springX, [-250, 250], [-10, 10]);

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
    }, 400);

    const t1 = setTimeout(() => {
      setStage(2);
      audio.playCheckTick(1.25);
    }, 850);

    const t2 = setTimeout(() => {
      setStage(3);
      audio.playWarmChord();
    }, 1300);

    // Rotate subtitle messages
    const subInterval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % SUBTITLES.length);
    }, 900);

    // Auto dismiss splash after presentation
    const dismissTimer = setTimeout(() => {
      handleExit();
    }, 3800);

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

  const CurrentSubtitleIcon = SUBTITLES[subtitleIndex].Icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(12px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMouseMove}
          onClick={handleExit}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF5F8] via-[#FFF9FA] to-[#FFF0F4] dark:from-[#15080e] dark:via-[#1c0b14] dark:to-[#12060c] select-none overflow-hidden cursor-pointer"
          style={{ perspective: 1400 }}
        >
          {/* Ambient Multi-Layer Radial Glows */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [1, 1.22, 1], opacity: [0.45, 0.75, 0.45] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#F9C6D0]/60 via-[#D63B6A]/25 to-[#F0A0B5]/40 blur-[90px] pointer-events-none"
          />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-[#D63B6A]/15 blur-[60px] pointer-events-none" />

          {/* Floating Subtle Ambient Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(14)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600),
                  opacity: 0,
                  scale: 0.4,
                }}
                animate={{
                  y: [null, '-=70'],
                  opacity: [0, 0.55, 0],
                  scale: [0.4, 0.9, 0.4],
                }}
                transition={{
                  duration: 2.8 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: 'easeInOut',
                }}
                className="absolute w-2 h-2 rounded-full bg-[#D63B6A]/40 blur-[0.8px]"
              />
            ))}
          </div>

          {/* Luxury 3D Floating Emblem Card */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Soft Ambient Ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: stage >= 3 ? [1, 1.08, 1] : 1,
                opacity: stage >= 3 ? [0.55, 0.85, 0.55] : 0.4,
              }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
              className="absolute -inset-6 rounded-[52px] bg-gradient-to-tr from-[#D63B6A]/30 via-[#F9C6D0]/40 to-[#F0A0B5]/30 blur-2xl pointer-events-none"
            />

            {/* The Favicon Shield Showcase */}
            <motion.div
              initial={{ scale: 0.65, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-[40px] bg-white/90 dark:bg-[#200B16]/90 shadow-[0_25px_60px_-10px_rgba(214,59,106,0.32)] p-3 border border-white/60 dark:border-white/10 backdrop-blur-2xl"
            >
              {/* Inner Glowing Border Gradient */}
              <div className="absolute inset-0 rounded-[40px] bg-gradient-to-tr from-[#D63B6A]/20 via-transparent to-[#F9C6D0]/40 pointer-events-none" />

              {/* Vector Favicon Artwork */}
              <svg
                viewBox="0 0 512 512"
                className="w-full h-full drop-shadow-md rounded-[30px] overflow-hidden"
              >
                {/* Background Squircle */}
                <rect width="512" height="512" rx="128" fill="#F9C6D0" />

                {/* ROW 1: First Task */}
                <motion.rect
                  x="128"
                  y="144"
                  width="64"
                  height="64"
                  rx="18"
                  fill="#D63B6A"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: stage >= 1 ? 1 : 0, opacity: stage >= 1 ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 20 }}
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
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
                <motion.rect
                  x="224"
                  y="160"
                  width="176"
                  height="32"
                  rx="16"
                  fill="#D63B6A"
                  opacity="0.55"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: stage >= 1 ? 1 : 0 }}
                  transition={{ duration: 0.38, ease: 'easeOut' }}
                  style={{ transformOrigin: '224px 176px' }}
                />

                {/* ROW 2: Second Task */}
                <motion.rect
                  x="128"
                  y="240"
                  width="64"
                  height="64"
                  rx="18"
                  fill="#D63B6A"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: stage >= 2 ? 1 : 0, opacity: stage >= 2 ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 20 }}
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
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
                <motion.rect
                  x="224"
                  y="256"
                  width="136"
                  height="32"
                  rx="16"
                  fill="#D63B6A"
                  opacity="0.55"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: stage >= 2 ? 1 : 0 }}
                  transition={{ duration: 0.38, ease: 'easeOut' }}
                  style={{ transformOrigin: '224px 272px' }}
                />

                {/* ROW 3: Active In-Progress Task */}
                <motion.rect
                  x="128"
                  y="336"
                  width="64"
                  height="64"
                  rx="18"
                  fill="#F0A0B5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: stage >= 3 ? [1, 1.07, 1] : 0,
                    opacity: stage >= 3 ? [0.75, 1, 0.75] : 0,
                  }}
                  transition={{
                    scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                    opacity: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                  }}
                  style={{ transformOrigin: '160px 368px' }}
                />
                <motion.rect
                  x="224"
                  y="352"
                  width="114"
                  height="32"
                  rx="16"
                  fill="#D63B6A"
                  opacity="0.35"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: stage >= 3 ? 1 : 0 }}
                  transition={{ duration: 0.38, ease: 'easeOut' }}
                  style={{ transformOrigin: '224px 368px' }}
                />
              </svg>

              {/* Shimmer Light Accent */}
              <div className="absolute top-2 right-2 w-8 h-8 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/20 flex items-center justify-center text-primary shadow-sm pointer-events-none">
                <Sparkles className="w-4 h-4 fill-primary/30" />
              </div>
            </motion.div>

            {/* Typography & Brand Identity */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-6 flex flex-col items-center text-center px-4"
            >
              <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-primary/80 mb-1">
                ORGANIZAÇÃO & BEM-ESTAR
              </span>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#D63B6A] via-[#E85280] to-[#F07297] bg-clip-text text-transparent drop-shadow-sm">
                Meu Tempo
              </h1>

              {/* Dynamic Kinetic Subtitle Pill */}
              <div className="mt-3.5 h-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={subtitleIndex}
                    initial={{ opacity: 0, y: 6, filter: 'blur(4px)', scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                    exit={{ opacity: 0, y: -6, filter: 'blur(4px)', scale: 1.04 }}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-[#200B16]/80 border border-primary/20 text-text text-xs font-semibold shadow-sm backdrop-blur-md"
                  >
                    <CurrentSubtitleIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{SUBTITLES[subtitleIndex].text}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Interactive "Entrar no Meu Tempo" Button */}
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExit();
              }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="mt-8 flex items-center gap-2.5 px-6 py-3 rounded-full bg-primary text-white text-xs font-bold shadow-xl shadow-[#D63B6A]/30 hover:shadow-2xl hover:shadow-[#D63B6A]/45 hover:bg-primary-light transition-all group border border-white/20"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Entrar no Meu Tempo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Quick Skip Hint */}
          <span className="absolute bottom-6 text-[11px] text-text-3 font-medium opacity-60">
            toque em qualquer lugar para pular
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
