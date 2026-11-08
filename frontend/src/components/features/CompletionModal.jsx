import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useTimer } from '../../hooks/useTimer';
import { Smile, Zap, Coffee, Clock } from 'lucide-react';

const MOODS = [
  { id: 'produtivo', label: 'Produtivo', icon: Zap, color: 'text-amber-500' },
  { id: 'leve', label: 'Leve', icon: Smile, color: 'text-pink-500' },
  { id: 'arrastado', label: 'Arrastado', icon: Coffee, color: 'text-blue-500' },
  { id: 'pesado', label: 'Pesado', icon: Clock, color: 'text-rose-500' },
];

const DELAY_REASONS = [
  { id: 'subestimada', label: 'Subestimei o tempo' },
  { id: 'interrupcoes', label: 'Muitas interrupções' },
  { id: 'dificuldade_tecnica', label: 'Dificuldade técnica' },
  { id: 'procrastinacao', label: 'Demorei a engatar' },
  { id: 'outros', label: 'Outro motivo' },
];

export function CompletionModal() {
  const {
    showCompletionModal,
    closeCompletionModal,
    completingTask,
    finishTimer,
    workedSeconds,
  } = useTimer();

  const [selectedMood, setSelectedMood] = useState('produtivo');
  const [selectedReason, setSelectedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!completingTask) return null;

  const currentMinutes = Math.round(workedSeconds / 60);
  const estimated = completingTask.estimated_minutes || 0;
  const isOverdue = estimated > 0 && currentMinutes > estimated;

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await finishTimer(completingTask.id, {
        mood: selectedMood,
        delay_reason: isOverdue ? selectedReason || null : null,
      });
      closeCompletionModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={showCompletionModal}
      onClose={closeCompletionModal}
      title="Concluir tarefa"
      description={`Como foi trabalhar em "${completingTask.name}"?`}
    >
      <div className="space-y-5">
        {/* Comparison card if estimated */}
        {estimated > 0 && (
          <div className="p-3.5 rounded-2xl bg-surface-2 border border-primary-border/60 flex items-center justify-around text-center">
            <div>
              <span className="text-[11px] text-text-3 font-medium uppercase tracking-wider">
                Estimado
              </span>
              <p className="text-lg font-bold text-text mt-0.5">{estimated} min</p>
            </div>
            <div className="h-8 w-px bg-primary-border/40" />
            <div>
              <span className="text-[11px] text-text-3 font-medium uppercase tracking-wider">
                Tempo Real
              </span>
              <p
                className={`text-lg font-bold mt-0.5 ${
                  isOverdue ? 'text-amber-500' : 'text-primary'
                }`}
              >
                {currentMinutes} min
              </p>
            </div>
          </div>
        )}

        {/* Mood selection */}
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-2">
            Como você se sentiu durante a tarefa?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-primary-soft border-primary text-primary shadow-sm shadow-pink-500/10'
                      : 'bg-surface border-primary-border/50 text-text-3 hover:border-primary/40'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${m.color}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Delay reason if overdue */}
        {isOverdue && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400">
              Levou um pouco mais que o previsto. O que aconteceu?
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-xl bg-surface border border-primary-border/70 px-3.5 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Selecione um motivo (opcional)</option>
              {DELAY_REASONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-primary-border/40">
          <Button variant="ghost" onClick={closeCompletionModal} disabled={isSubmitting}>
            Voltar
          </Button>
          <Button onClick={handleFinish} loading={isSubmitting}>
            Finalizar e Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

