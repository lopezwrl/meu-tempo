import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../../hooks/useTimer';
import { Play, Pause, Square, Headphones, Timer, Wind, X } from 'lucide-react';

export function TimerPill() {
  const {
    activeTask,
    isRunning,
    formattedTime,
    elapsedFormattedTime,
    timerMode,
    focusMin,
    pomodoroPhase,
    pomodoroProgress,
    pomodoroPrompt,
    setPomodoroConfig,
    dismissPomodoroPrompt,
    skipPomodoroPhase,
    toggleTimer,
    openCompletionModal,
  } = useTimer();

  const [showModeMenu, setShowModeMenu] = useState(false);
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);

  if (!activeTask) return null;

  const handlePointerDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      openCompletionModal(activeTask);
    }, 700);
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
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -40, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        className="fixed top-3 sm:top-4 right-3 sm:right-8 z-40 flex flex-col items-end gap-2 select-none max-w-[calc(100vw-1.5rem)]"
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleClick}
          title="Clique para pausar/retomar • Segure para finalizar"
          className="relative overflow-hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/95 border border-primary/40 shadow-md backdrop-blur-md cursor-pointer hover:border-primary transition-colors group max-w-full"
        >
          {/* Pomodoro phase progress bar along bottom edge */}
          {timerMode === 'pomodoro' && (
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-700"
              style={{ width: `${pomodoroProgress}%` }}
            />
          )}

          {/* Status Dot */}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 shrink-0 ${
              isRunning
                ? pomodoroPhase === 'break' && timerMode === 'pomodoro'
                  ? 'bg-emerald-500'
                  : 'bg-primary'
                : 'bg-amber-400'
            }`}
          />

          {/* Play/Pause Icon */}
          <div className="w-5 h-5 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
            {isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </div>

          {/* Task Info & Time */}
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[10px] font-semibold text-text-3 truncate max-w-[90px] sm:max-w-[150px] leading-tight">
              {timerMode === 'pomodoro'
                ? `${pomodoroPhase === 'focus' ? 'Foco' : 'Pausa'} · ${activeTask.name}`
                : activeTask.name}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs font-bold text-primary tracking-tight">
                {formattedTime}
              </span>
              {timerMode === 'pomodoro' && (
                <span className="hidden sm:inline font-mono text-[10px] text-text-3">
                  ({elapsedFormattedTime})
                </span>
              )}
            </div>
          </div>

          {/* Mode / Pomodoro Picker Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowModeMenu((prev) => !prev);
            }}
            title="Alternar Cronômetro Livre / Pomodoro"
            aria-label="Modo do cronômetro"
            className={`p-1 rounded-full transition-colors shrink-0 ${
              timerMode === 'pomodoro'
                ? 'bg-primary-soft text-primary'
                : 'text-text-3 hover:text-primary hover:bg-primary-soft'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
          </button>

          {/* Ambient Soundscape shortcut on pill */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent('mt-open-sanctuary', { detail: 'sound' })
              );
            }}
            title="Sons de Foco"
            aria-label="Sons de Foco"
            className="hidden sm:inline-flex p-1 rounded-full text-text-3 hover:text-primary hover:bg-primary-soft transition-colors shrink-0"
          >
            <Headphones className="w-3.5 h-3.5" />
          </button>

          {/* Stop / Finish button on pill */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openCompletionModal(activeTask);
            }}
            title="Finalizar tarefa"
            aria-label="Finalizar tarefa"
            className="p-1 rounded-full text-text-3 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Pomodoro Mode Popover */}
        {showModeMenu && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowModeMenu(false)}
            />
            <div className="relative z-40 w-56 rounded-2xl bg-surface border border-primary-border/80 shadow-lg p-2 text-xs space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-text-3">
                Modo do cronômetro
              </div>
              <button
                type="button"
                onClick={() => {
                  setPomodoroConfig('free', 25, 5);
                  setShowModeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                  timerMode === 'free'
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-text-2 hover:bg-surface-2'
                }`}
              >
                <span>Cronômetro Livre</span>
                <span className="text-[10px] text-text-3">Contínuo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPomodoroConfig('pomodoro', 25, 5);
                  setShowModeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                  timerMode === 'pomodoro' && focusMin === 25
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-text-2 hover:bg-surface-2'
                }`}
              >
                <span>Pomodoro Clássico</span>
                <span className="text-[10px] font-mono text-text-3">25/5</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPomodoroConfig('pomodoro', 50, 10);
                  setShowModeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                  timerMode === 'pomodoro' && focusMin === 50
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-text-2 hover:bg-surface-2'
                }`}
              >
                <span>Pomodoro Profundo</span>
                <span className="text-[10px] font-mono text-text-3">50/10</span>
              </button>
              {timerMode === 'pomodoro' && (
                <button
                  type="button"
                  onClick={() => {
                    skipPomodoroPhase();
                    setShowModeMenu(false);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl text-center text-[11px] font-semibold text-primary border-t border-primary-border/30 mt-1 pt-2 hover:bg-primary-soft/50"
                >
                  {pomodoroPhase === 'focus' ? 'Ir para pausa agora' : 'Voltar ao foco'}
                </button>
              )}
            </div>
          </>
        )}

        {/* Break Prompt Banner after completing a Pomodoro Focus Cycle */}
        {pomodoroPrompt === 'break_ready' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface border border-primary/40 shadow-md text-xs"
          >
            <Wind className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-medium text-text">Bloco concluído.</span>
            <button
              type="button"
              onClick={() => {
                dismissPomodoroPrompt();
                window.dispatchEvent(
                  new CustomEvent('mt-open-sanctuary', { detail: 'breath' })
                );
              }}
              className="px-2 py-1 rounded-lg bg-primary text-white text-[11px] font-semibold hover:bg-primary-light transition-colors"
            >
              Respirar 4-4-4-4
            </button>
            <button
              type="button"
              onClick={dismissPomodoroPrompt}
              className="p-1 text-text-3 hover:text-text"
              aria-label="Fechar aviso"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
