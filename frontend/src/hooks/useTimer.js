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
  }, [activeData, setActiveTask]);

  // Tick timer every second when running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tick();
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
        colors: ['#EC4899', '#F472B6', '#FFF0F5', '#c084fc', '#fb7185'],
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

  return {
    activeTask,
    workedSeconds,
    isRunning,
    formattedTime: formatTime(workedSeconds),
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

