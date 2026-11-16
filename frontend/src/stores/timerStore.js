import { create } from 'zustand';

const POMODORO_STORAGE_KEY = 'mt-pomodoro-prefs';

function loadPomodoroPrefs() {
  try {
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore storage errors
  }
  return { mode: 'free', focusMin: 25, breakMin: 5 };
}

function savePomodoroPrefs(prefs) {
  try {
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

const initialPrefs = loadPomodoroPrefs();

export const useTimerStore = create((set, get) => ({
  activeTask: null,
  workedSeconds: 0,
  isRunning: false,
  activeEntryStart: null,
  showCompletionModal: false,
  completingTask: null,

  // Pomodoro state
  timerMode: initialPrefs.mode || 'free', // 'free' | 'pomodoro'
  focusMin: initialPrefs.focusMin || 25,
  breakMin: initialPrefs.breakMin || 5,
  pomodoroPhase: 'focus', // 'focus' | 'break'
  pomodoroRemaining: (initialPrefs.focusMin || 25) * 60,
  pomodoroPrompt: null, // 'break_ready' | 'focus_ready' | null

  setActiveTask: (task) => {
    if (!task) {
      set((state) => ({
        activeTask: null,
        workedSeconds: 0,
        isRunning: false,
        activeEntryStart: null,
        pomodoroPhase: 'focus',
        pomodoroRemaining: state.focusMin * 60,
        pomodoroPrompt: null,
      }));
      return;
    }

    const isRunning = task.is_running ?? task.status === 'em_andamento';
    const startStr = task.active_entry_start || task.active_entry?.start_time;
    let calculatedSeconds = task.worked_seconds || 0;

    if (isRunning && startStr) {
      const startTime = new Date(startStr).getTime();
      const now = Date.now();
      const elapsedSinceStart = Math.max(0, Math.floor((now - startTime) / 1000));
      calculatedSeconds += elapsedSinceStart;
    }

    set({
      activeTask: task,
      workedSeconds: calculatedSeconds,
      isRunning,
      activeEntryStart: startStr,
    });
  },

  setPomodoroConfig: (mode, focusMin = 25, breakMin = 5) => {
    savePomodoroPrefs({ mode, focusMin, breakMin });
    set({
      timerMode: mode,
      focusMin,
      breakMin,
      pomodoroPhase: 'focus',
      pomodoroRemaining: focusMin * 60,
      pomodoroPrompt: null,
    });
  },

  dismissPomodoroPrompt: () => set({ pomodoroPrompt: null }),

  skipPomodoroPhase: () => {
    const { pomodoroPhase, focusMin, breakMin } = get();
    const nextPhase = pomodoroPhase === 'focus' ? 'break' : 'focus';
    set({
      pomodoroPhase: nextPhase,
      pomodoroRemaining: (nextPhase === 'focus' ? focusMin : breakMin) * 60,
      pomodoroPrompt: null,
    });
  },

  tick: () => {
    const {
      isRunning,
      workedSeconds,
      timerMode,
      pomodoroPhase,
      pomodoroRemaining,
      focusMin,
      breakMin,
    } = get();

    if (!isRunning) return null;

    let completedPhase = null;
    const updates = {
      workedSeconds: workedSeconds + 1,
    };

    if (timerMode === 'pomodoro') {
      const nextRem = pomodoroRemaining - 1;
      if (nextRem <= 0) {
        if (pomodoroPhase === 'focus') {
          completedPhase = 'focus';
          updates.pomodoroPhase = 'break';
          updates.pomodoroRemaining = breakMin * 60;
          updates.pomodoroPrompt = 'break_ready';
        } else {
          completedPhase = 'break';
          updates.pomodoroPhase = 'focus';
          updates.pomodoroRemaining = focusMin * 60;
          updates.pomodoroPrompt = 'focus_ready';
        }
      } else {
        updates.pomodoroRemaining = nextRem;
      }
    }

    set(updates);
    return completedPhase;
  },

  setWorkedSeconds: (seconds) => set({ workedSeconds: seconds }),

  setIsRunning: (isRunning) => set({ isRunning }),

  openCompletionModal: (task) =>
    set({
      showCompletionModal: true,
      completingTask: task || get().activeTask,
    }),

  closeCompletionModal: () =>
    set({
      showCompletionModal: false,
      completingTask: null,
    }),
}));
