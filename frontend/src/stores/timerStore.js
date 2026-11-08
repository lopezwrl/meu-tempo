import { create } from 'zustand';

export const useTimerStore = create((set, get) => ({
  activeTask: null,
  workedSeconds: 0,
  isRunning: false,
  activeEntryStart: null,
  showCompletionModal: false,
  completingTask: null,

  setActiveTask: (task) => {
    if (!task) {
      set({
        activeTask: null,
        workedSeconds: 0,
        isRunning: false,
        activeEntryStart: null,
      });
      return;
    }

    const isRunning = task.is_running ?? (task.status === 'em_andamento');
    const startStr = task.active_entry_start || (task.active_entry?.start_time);
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

  tick: () => {
    const { isRunning, workedSeconds } = get();
    if (isRunning) {
      set({ workedSeconds: workedSeconds + 1 });
    }
  },

  setWorkedSeconds: (seconds) => set({ workedSeconds: seconds }),

  setIsRunning: (isRunning) => set({ isRunning }),

  openCompletionModal: (task) => set({
    showCompletionModal: true,
    completingTask: task || get().activeTask,
  }),

  closeCompletionModal: () => set({
    showCompletionModal: false,
    completingTask: null,
  }),
}));

