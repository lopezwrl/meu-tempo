import React, { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { soundEffects } from '../../utils/audio';
import {
  Moon,
  CheckCircle2,
  FastForward,
  Award,
} from 'lucide-react';

export function WindDownModal({
  isOpen,
  onClose,
  todayTasks = [],
  workedTodayMinutes = 0,
  precisionRate = 100,
  onPostponeTask,
}) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migratedSuccess, setMigratedSuccess] = useState(false);

  const completedToday = todayTasks.filter((t) => t.status === 'concluida');
  const pendingToday = todayTasks.filter(
    (t) => t.status !== 'concluida' && t.status !== 'cancelada'
  );

  const handleMigrateAllAndCloseDay = async () => {
    setIsMigrating(true);
    try {
      for (const task of pendingToday) {
        if (onPostponeTask) {
          await onPostponeTask(task.id);
        }
      }
      soundEffects.playWarmChord();
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.6, x: 0.5 },
        colors: ['#D63B6A', '#F9C6D0', '#F0A0B5', '#FFFFFF'],
        ticks: 60,
      });
      setMigratedSuccess(true);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setMigratedSuccess(false);
        onClose();
      }}
      title="Encerramento do Dia"
      description="Resumo do que foi concluído e reagendamento rápido para amanhã"
    >
      <div className="space-y-5">
        {/* Top Banner */}
        <div className="p-4 rounded-2xl bg-surface-2 border border-primary-border/60 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text">
              {migratedSuccess
                ? 'Dia encerrado'
                : 'Resumo de hoje'}
            </h4>
            <p className="text-xs text-text-2 mt-0.5 leading-relaxed">
              {migratedSuccess
                ? 'As pendências foram movidas para amanhã.'
                : 'Veja suas entregas e mova o que ficou para amanhã.'}
            </p>
          </div>
        </div>

        {/* 3 Summary Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-surface-2/80 border border-primary-border/50 text-center">
            <p className="text-lg font-extrabold text-text">{completedToday.length}</p>
            <span className="text-[11px] font-medium text-text-3">
              Concluídas
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-2/80 border border-primary-border/50 text-center">
            <p className="text-lg font-extrabold text-primary">
              {(workedTodayMinutes / 60).toFixed(1)}h
            </p>
            <span className="text-[11px] font-medium text-text-3">
              Tempo focado
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-2/80 border border-primary-border/50 text-center">
            <p className="text-lg font-extrabold text-text">{precisionRate}%</p>
            <span className="text-[11px] font-medium text-text-3">
              Precisão
            </span>
          </div>
        </div>

        {/* Completed Victories List */}
        {completedToday.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-text-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span>Vitórias concluídas hoje ({completedToday.length})</span>
            </h5>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {completedToday.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2/60 border border-primary-border/40 text-xs text-text-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate font-medium">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Tasks Migration Section */}
        {pendingToday.length > 0 && !migratedSuccess ? (
          <div className="p-4 rounded-2xl bg-surface-2 border border-primary-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text">
                {pendingToday.length} tarefa(s) pendente(s) hoje
              </span>
              <span className="text-[11px] text-text-3">
                Replanejamento sem sobrecarga
              </span>
            </div>

            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
              {pendingToday.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-xs text-text-3 py-1 border-b border-primary-border/20 last:border-none"
                >
                  <span className="truncate">{t.name}</span>
                  <span className="text-[10px] font-mono shrink-0 ml-2">
                    {t.estimated_minutes ? `${t.estimated_minutes}m` : '—'}
                  </span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleMigrateAllAndCloseDay}
              loading={isMigrating}
              className="w-full"
            >
              <FastForward className="w-4 h-4 mr-2" />
              <span>Mover {pendingToday.length} pendente(s) para amanhã e encerrar</span>
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-primary-soft border border-primary/25 flex items-center gap-3 text-text"
          >
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs font-semibold">
              Nenhuma tarefa pendente para hoje.
            </p>
          </motion.div>
        )}

        <div className="flex justify-end pt-2 border-t border-primary-border/40">
          <Button
            variant="ghost"
            onClick={() => {
              setMigratedSuccess(false);
              onClose();
            }}
          >
            Fechar resumo
          </Button>
        </div>
      </div>
    </Modal>
  );
}

