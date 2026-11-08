import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../../hooks/useTimer';
import { Play, Pause, Square } from 'lucide-react';

export function TimerPill() {
  const {
    activeTask,
    isRunning,
    formattedTime,
    toggleTimer,
    openCompletionModal,
  } = useTimer();

  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);

  if (!activeTask) return null;

  const handlePointerDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      openCompletionModal(activeTask);
    }, 700); // 700ms long press to finish
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = (e) => {
    if (isLongPress.current) {
      e.preventDefault();
      return;
    }
    toggleTimer();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0, scale: 0.9 }}
        animate={{
          y: 0,
          opacity: 1,
          scale: [1, 1.02, 1],
        }}
        exit={{ y: -40, opacity: 0, scale: 0.9 }}
        transition={{
          y: { type: 'spring', stiffness: 450, damping: 25 },
          scale: {
            repeat: Infinity,
            repeatType: 'reverse',
            duration: 2,
            ease: 'easeInOut',
          },
        }}
        className="fixed top-3 sm:top-4 right-4 sm:right-8 z-40 flex items-center select-none"
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleClick}
          title="Clique para pausar/retomar • Segure para finalizar"
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface/90 border border-primary/40 shadow-lg shadow-pink-500/15 backdrop-blur-md cursor-pointer hover:border-primary transition-colors group"
        >
          {/* Pulsing indicator dot */}
          <span className="relative flex h-2.5 w-2.5">
            {isRunning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isRunning ? 'bg-primary' : 'bg-amber-400'
              }`}
            />
          </span>

          {/* Action icon */}
          <div className="w-5 h-5 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            {isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </div>

          {/* Task Info & Time */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold text-text-3 truncate max-w-[120px] sm:max-w-[160px] leading-tight">
              {activeTask.name}
            </span>
            <span className="font-mono text-xs font-bold text-primary tracking-tight">
              {formattedTime}
            </span>
          </div>

          {/* Stop / Finish button on pill */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openCompletionModal(activeTask);
            }}
            title="Finalizar tarefa"
            aria-label="Finalizar tarefa"
            className="p-1 rounded-full text-text-3 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

