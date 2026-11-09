import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getCircadianPhase } from '../../stores/energyStore';
import { EnergyBadge } from '../ui/CategoryIcon';
import { soundscapeEngine } from '../../utils/audio';
import {
  BatteryCharging,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  Wind,
  Moon,
  FastForward,
  Activity,
} from 'lucide-react';

export function WellbeingHub({
  todayTasks = [],
  availableMinutes = 360,
  onPostponeTask,
  onOpenSanctuary,
  onOpenWindDown,
  selectedEnergyFilter = null,
  onSelectEnergyFilter,
}) {
  const [isRebalancing, setIsRebalancing] = useState(false);
  const circadian = getCircadianPhase();
  const soundState = soundscapeEngine.getState();

  const activeTodayTasks = todayTasks.filter((t) => t.status !== 'cancelada');
  const pendingTodayTasks = todayTasks.filter(
    (t) => t.status !== 'concluida' && t.status !== 'cancelada'
  );

  const plannedMinutes = activeTodayTasks.reduce(
    (acc, t) => acc + (t.estimated_minutes || 25),
    0
  );
  const safeCapacity = Math.max(120, availableMinutes || 360);
  const loadRatio = Math.round((plannedMinutes / safeCapacity) * 100);
  const isOverloaded = plannedMinutes > safeCapacity && pendingTodayTasks.length > 0;
  const isModerate = !isOverloaded && loadRatio >= 80;

  const handleRebalanceDay = async () => {
    if (!onPostponeTask || pendingTodayTasks.length === 0) return;
    setIsRebalancing(true);
    try {
      // Sort pending tasks so lower priority ('baixa', 'media') are postponed first until load <= safeCapacity
      const priorityWeight = { baixa: 1, media: 2, alta: 3 };
      const sortedPending = [...pendingTodayTasks].sort(
        (a, b) =>
          (priorityWeight[a.priority] || 2) - (priorityWeight[b.priority] || 2)
      );

      let currentTotal = plannedMinutes;
      for (const task of sortedPending) {
        if (currentTotal <= safeCapacity) break;
        await onPostponeTask(task.id);
        currentTotal -= task.estimated_minutes || 25;
      }
    } finally {
      setIsRebalancing(false);
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Card 1: Ritmo de Energia Circadiana ("Bateria Humana") */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="lg:col-span-7 p-5 rounded-3xl bg-surface border border-primary-border/70 shadow-sm backdrop-blur-sm flex flex-col justify-between gap-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-text tracking-tight">
                  Ritmo Circadiano: {circadian.phase}
                </h3>
                <EnergyBadge level={circadian.recommendedEnergy} size="sm" />
              </div>
              <p className="text-xs text-text-3 mt-1 leading-relaxed">
                {circadian.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Energy Filter Pills & Quick Sanctuary Triggers */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-primary-border/40">
          {onSelectEnergyFilter ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-text-3 mr-1">
                Filtrar por energia:
              </span>
              {[
                { id: null, label: 'Todas' },
                { id: 'alta', label: 'Foco Profundo' },
                { id: 'media', label: 'Fluxo Normal' },
                { id: 'baixa', label: 'Modo Leve' },
              ].map((tier) => (
                <button
                  key={tier.id || 'all'}
                  type="button"
                  onClick={() =>
                    onSelectEnergyFilter(
                      selectedEnergyFilter === tier.id ? null : tier.id
                    )
                  }
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                    selectedEnergyFilter === tier.id
                      ? 'bg-primary text-white border-primary shadow-sm shadow-[#D63B6A]/20'
                      : 'bg-surface-2/70 text-text-2 border-primary-border/50 hover:border-primary/40'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
              <Activity className="w-3.5 h-3.5" />
              <span>Sintonia biológica ativa</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => onOpenSanctuary?.('sound')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                soundState.isPlaying
                  ? 'bg-primary text-white border-primary shadow-sm shadow-[#D63B6A]/20'
                  : 'bg-surface-2 text-text-2 border-primary-border/60 hover:text-primary hover:border-primary/40'
              }`}
              title="Abrir Santuário de Paisagens Sonoras Offline"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{soundState.isPlaying ? 'Som Ativo' : 'Santuário Sonoro'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSanctuary?.('breath')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 text-text-2 border border-primary-border/60 hover:text-primary hover:border-primary/40 text-xs font-semibold transition-all"
              title="Pausa de Respiração Guiada 4-4-4-4"
            >
              <Wind className="w-3.5 h-3.5 text-primary" />
              <span>Respirar</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Medidor Anti-Burnout & Ritual de Fechamento */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="lg:col-span-5 p-5 rounded-3xl bg-surface border border-primary-border/70 shadow-sm backdrop-blur-sm flex flex-col justify-between gap-4"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {isOverloaded ? (
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              )}
              <h3 className="text-sm font-extrabold text-text tracking-tight">
                Medidor Anti-Burnout
              </h3>
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOverloaded
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30'
                  : isModerate
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-primary-soft text-primary border-primary/25'
              }`}
            >
              {isOverloaded
                ? 'Sobrecarga Detectada'
                : isModerate
                ? 'Ritmo Intenso'
                : 'Carga Saudável'}
            </span>
          </div>

          <p className="text-xs text-text-3 mb-3">
            Planejado hoje:{' '}
            <strong className="text-text">{(plannedMinutes / 60).toFixed(1)}h</strong>{' '}
            de{' '}
            <strong className="text-text">{(safeCapacity / 60).toFixed(1)}h</strong>{' '}
            de capacidade saudável ({loadRatio}%)
          </p>

          {/* Animated Load Bar */}
          <div className="w-full h-2.5 rounded-full bg-surface-2 overflow-hidden border border-primary-border/40">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, loadRatio)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                isOverloaded
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-[#F0A0B5] via-[#E85280] to-[#D63B6A]'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-primary-border/40">
          {isOverloaded ? (
            <button
              type="button"
              onClick={handleRebalanceDay}
              disabled={isRebalancing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 shadow-sm transition-all disabled:opacity-50"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>
                {isRebalancing ? 'Reequilibrando...' : 'Reequilibrar Dia (1-Clique)'}
              </span>
            </button>
          ) : (
            <span className="text-[11px] text-text-3 font-medium">
              Seu ritmo respeita seus limites hoje.
            </span>
          )}

          {onOpenWindDown && (
            <button
              type="button"
              onClick={onOpenWindDown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-soft text-primary border border-primary/25 hover:bg-primary hover:text-white text-xs font-bold transition-all ml-auto shrink-0"
              title="Abrir Ritual de Fechamento do Dia"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Fechar Dia</span>
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
}

