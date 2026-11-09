import { create } from 'zustand';

const STORAGE_KEY = 'mt-task-energy-map';

function loadEnergyMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const useEnergyStore = create((set, get) => ({
  energyMap: loadEnergyMap(),

  setTaskEnergy: (taskId, energyLevel) => {
    if (!taskId) return;
    const next = { ...get().energyMap, [String(taskId)]: energyLevel };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    set({ energyMap: next });
  },

  getTaskEnergy: (task) => {
    if (!task) return 'media';
    const stored = get().energyMap[String(task.id)];
    if (stored) return stored;
    if (task.priority === 'alta') return 'alta';
    if (task.priority === 'baixa') return 'baixa';
    return 'media';
  },
}));

/**
 * Returns Circadian Rhythm recommendation based on the current hour of the day.
 */
export function getCircadianPhase(hour = new Date().getHours()) {
  if (hour >= 7 && hour < 12) {
    return {
      phase: 'Pico Cognitivo Matinal',
      recommendedEnergy: 'alta',
      energyLabel: 'Foco Profundo',
      summary:
        'Sua mente está no auge de clareza analítica. Priorize tarefas complexas e estratégicas agora.',
      badgeColor: 'text-[#D63B6A] bg-[#F9C6D0]/35 border-[#D63B6A]/30',
    };
  }
  if (hour >= 12 && hour < 15) {
    return {
      phase: 'Vale Pós-Almoço (Recuperação)',
      recommendedEnergy: 'baixa',
      energyLabel: 'Modo Leve',
      summary:
        'Queda natural de alerta biológico. Ideal para tarefas leves, organização, e-mails ou uma pausa de respiração.',
      badgeColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    };
  }
  if (hour >= 15 && hour < 18) {
    return {
      phase: 'Segundo Fôlego Colaborativo',
      recommendedEnergy: 'media',
      energyLabel: 'Fluxo Normal',
      summary:
        'Excelente janela para execução prática, reuniões, revisões e fechamento de entregas do dia.',
      badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30',
    };
  }
  return {
    phase: 'Desaceleração & Fechamento',
    recommendedEnergy: 'baixa',
    energyLabel: 'Modo Leve',
    summary:
      'Hora de reduzir estímulos, celebrar o que foi feito no Ritual de Fechamento e descansar a mente.',
    badgeColor: 'text-[#D63B6A] bg-[#F9C6D0]/25 border-[#D63B6A]/25',
  };
}
