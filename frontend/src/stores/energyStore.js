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
      phase: 'Manhã · Pico cognitivo',
      recommendedEnergy: 'alta',
      energyLabel: 'Foco Profundo',
      summary: 'Janela 7h–12h · Melhor momento para tarefas exigentes.',
    };
  }
  if (hour >= 12 && hour < 15) {
    return {
      phase: 'Início da tarde · Ritmo leve',
      recommendedEnergy: 'baixa',
      energyLabel: 'Modo Leve',
      summary: 'Janela 12h–15h · Bom para organização, revisões ou pausa.',
    };
  }
  if (hour >= 15 && hour < 18) {
    return {
      phase: 'Tarde · Segundo fôlego',
      recommendedEnergy: 'media',
      energyLabel: 'Fluxo Normal',
      summary: 'Janela 15h–18h · Ideal para execução contínua e reuniões.',
    };
  }
  return {
    phase: 'Noite · Encerramento',
    recommendedEnergy: 'baixa',
    energyLabel: 'Modo Leve',
    summary: 'Após 18h · Feche o dia e desacelere aos poucos.',
  };
}

