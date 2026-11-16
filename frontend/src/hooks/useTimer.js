import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../services/api';
import { useTimerStore } from '../stores/timerStore';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/audio';

export function useTimer() {
  const queryClient = useQueryClient();
  const {
    activeTask,
    workedSeconds,
    isRunning,
    setActiveTask,
    tick,
    openCompletionModal,
    closeCompletionModal,
    showCompletionModal,
    completingTask,
    timerMode,
    focusMin,
    breakMin,
    pomodoroPhase,
    pomodoroRemaining,
    pomodoroPrompt,
    setPomodoroConfig,
    dismissPomodoroPrompt,
    skipPomodoroPhase,
  } = useTimerStore();

  // Fetch active timer from backend
  const { data: activeData } = useQuery({
    queryKey: queryKeys.activeTimer,
    queryFn: api.getActiveTimer,
    refetchInterval: isRunning ? 15000 : 30000,
    staleTime: 5000,
  });

  // Keep store in sync with active timer
  useEffect(() => {
    if (activeData) {
      if (activeData.active && activeData.task) {
        setActiveTask(activeData.task);
      } else if (!activeData.active && activeTask) {
        setActiveTask(null);
      }
    }
  }, [activeData, activeTask, setActiveTask]);

  // Tick timer every second when running (and ring Zen bell when Pomodoro phase completes)
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const completedPhase = tick();
      if (completedPhase === 'focus') {
        soundEffects.playTimerBell();
      } else if (completedPhase === 'break') {
        soundEffects.playChime();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Mutations
  const startMutation = useMutation({
    mutationFn: ({ taskId, force }) => api.startTaskTimer(taskId, force),
    onSuccess: (updatedTask) => {
      setActiveTask(updatedTask);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (taskId) => api.pauseTaskTimer(taskId),
    onSuccess: (updatedTask) => {
      setActiveTask(updatedTask);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer });
    },
  });

  const finishMutation = useMutation({
    mutationFn: ({ taskId, data }) => api.finishTaskTimer(taskId, data),
    onSuccess: () => {
      setActiveTask(null);
      closeCompletionModal();
      soundEffects.playTimerBell();
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.6, x: 0.5 },
        colors: ['#D63B6A', '#F9C6D0', '#F0A0B5', '#FFFFFF'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeTimer });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const formatTime = useCallback((totalSeconds) => {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, []);

  const toggleTimer = useCallback(
    async (taskId) => {
      const idToToggle = taskId || activeTask?.id;
      if (!idToToggle) return;

      if (activeTask?.id === idToToggle && isRunning) {
        await pauseMutation.mutateAsync(idToToggle);
      } else {
        await startMutation.mutateAsync({ taskId: idToToggle, force: true });
      }
    },
    [activeTask, isRunning, pauseMutation, startMutation]
  );

  const displayedSeconds =
    timerMode === 'pomodoro' ? pomodoroRemaining : workedSeconds;

  const pomodoroTotalSeconds =
    (pomodoroPhase === 'focus' ? focusMin : breakMin) * 60;
  const pomodoroProgress =
    timerMode === 'pomodoro' && pomodoroTotalSeconds > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((pomodoroTotalSeconds - pomodoroRemaining) / pomodoroTotalSeconds) * 100
          )
        )
      : 0;

  return {
    activeTask,
    workedSeconds,
    isRunning,
    formattedTime: formatTime(displayedSeconds),
    elapsedFormattedTime: formatTime(workedSeconds),
    timerMode,
    focusMin,
    breakMin,
    pomodoroPhase,
    pomodoroRemaining,
    pomodoroProgress,
    pomodoroPrompt,
    setPomodoroConfig,
    dismissPomodoroPrompt,
    skipPomodoroPhase,
    startTimer: (taskId, force = false) => startMutation.mutateAsync({ taskId, force }),
    pauseTimer: (taskId) => pauseMutation.mutateAsync(taskId),
    finishTimer: (taskId, data) => finishMutation.mutateAsync({ taskId, data }),
    toggleTimer,
    openCompletionModal,
    closeCompletionModal,
    showCompletionModal,
    completingTask,
    formatTime,
  };
}
