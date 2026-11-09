import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import confetti from 'canvas-confetti';
import { soundEffects } from '../../utils/audio';
import { SubtaskAccordion } from './SubtaskAccordion';
import { useTimer } from '../../hooks/useTimer';
import { useEnergyStore } from '../../stores/energyStore';
import { CategoryIcon, EnergyBadge } from '../ui/CategoryIcon';
import {
  Check,
  Play,
  Pause,
  Clock,
  Calendar,
  FileText,
  MoreVertical,
  FastForward,
  Edit2,
  Trash2,
} from 'lucide-react';

function firePinkConfetti(event) {
  let origin = { y: 0.6, x: 0.5 };
  if (event && event.clientX) {
    origin = {
      x: event.clientX / window.innerWidth,
      y: event.clientY / window.innerHeight,
    };
  }

  confetti({
    particleCount: 30,
    spread: 60,
    origin,
    colors: ['#D63B6A', '#F9C6D0', '#F0A0B5', '#E85280', '#FFFFFF'],
    ticks: 45, // 600ms duration
    gravity: 1.2,
    scalar: 0.8,
    shapes: ['circle'],
  });
}

const PRIORITY_COLORS = {
  alta: 'border-l-[#D63B6A]',
  media: 'border-l-amber-500',
  baixa: 'border-l-sky-400',
  nenhuma: 'border-l-primary-border',
};

export function TaskCard({
  task,
  categories = [],
  projects = [],
  onComplete,
  onReopen,
  onPostpone,
  onEdit,
  onDelete,
  onOpenNoteSheet,
  delay = 0,
}) {
  const [isCompletedState, setIsCompletedState] = useState(task.status === 'concluida');
  const [showMenu, setShowMenu] = useState(false);
  const { activeTask, isRunning, toggleTimer } = useTimer();
  const getTaskEnergy = useEnergyStore((s) => s.getTaskEnergy);
  const taskEnergy = getTaskEnergy(task);

  const isCurrentActive = activeTask?.id === task.id;
  const isCurrentlyRunning = isCurrentActive && isRunning;

  const category = categories.find((c) => c.id === task.category_id);
  const project = projects.find((p) => p.id === task.project_id);

  const handleToggleComplete = (e) => {
    if (isCompletedState) {
      setIsCompletedState(false);
      onReopen?.(task.id);
    } else {
      setIsCompletedState(true);
      firePinkConfetti(e);
      soundEffects.playTaskCompleted();
      onComplete?.(task.id);
    }
  };

  // Mobile swipeable to complete
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (!isCompletedState) {
        setIsCompletedState(true);
        firePinkConfetti({ clientX: eventData.event.clientX, clientY: eventData.event.clientY });
        soundEffects.playTaskCompleted();
        onComplete?.(task.id);
      }
    },
    trackMouse: false,
    delta: 50,
  });

  const priorityBorder = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.media;

  return (
    <motion.div
      {...swipeHandlers}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`group relative bg-surface border border-primary-border/60 border-l-4 ${priorityBorder} rounded-2xl p-4 shadow-sm backdrop-blur-sm transition-all ${
        isCompletedState ? 'opacity-70 scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Animated Checkbox on Desktop */}
        <button
          type="button"
          onClick={handleToggleComplete}
          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all select-none ${
            isCompletedState
              ? 'bg-primary border-primary text-white shadow-sm shadow-pink-500/20'
              : 'border-primary-border/80 hover:border-primary hover:bg-primary-soft/40'
          }`}
          aria-label={isCompletedState ? 'Reabrir tarefa' : 'Concluir tarefa'}
        >
          {isCompletedState && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              onClick={handleToggleComplete}
              className={`text-sm font-semibold text-text leading-snug cursor-pointer select-none transition-all ${
                isCompletedState ? 'line-through text-text-3' : ''
              }`}
            >
              {task.name}
            </h4>

            {/* Quick Timer Toggle Button */}
            {!isCompletedState && (
              <button
                type="button"
                onClick={() => toggleTimer(task.id)}
                className={`p-1.5 rounded-xl transition-all ${
                  isCurrentlyRunning
                    ? 'bg-primary text-white shadow-sm shadow-pink-500/30'
                    : isCurrentActive
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'text-text-3 hover:text-primary hover:bg-primary-soft'
                }`}
                title={isCurrentlyRunning ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
              >
                {isCurrentlyRunning ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-text-3 mt-1 line-clamp-2">{task.description}</p>
          )}

          {/* Metadata badges & chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {/* Circadian Energy Badge */}
            <EnergyBadge level={taskEnergy} size="sm" />

            {category && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-2 text-text-2 border border-primary-border/40">
                <CategoryIcon
                  icon={category.icon}
                  name={category.name}
                  className="w-3 h-3 text-primary"
                />
                <span>{category.name}</span>
              </span>
            )}

            {project && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-950/40 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{project.name}</span>
              </span>
            )}

            {task.date && (
              <span className="inline-flex items-center gap-1 text-[11px] text-text-3 font-medium">
                <Calendar className="w-3 h-3 text-text-3" />
                <span>{task.date}</span>
                {task.time && <span>às {task.time}</span>}
              </span>
            )}

            {task.estimated_minutes && (
              <span className="inline-flex items-center gap-1 text-[11px] text-text-3 font-medium">
                <Clock className="w-3 h-3 text-text-3" />
                <span>{task.estimated_minutes} min est.</span>
              </span>
            )}

            {task.real_minutes !== null && task.real_minutes !== undefined && (
              <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold">
                <Clock className="w-3 h-3 text-primary" />
                <span>{task.real_minutes} min real</span>
              </span>
            )}

            {/* Note Sheet link button */}
            <button
              type="button"
              onClick={() => onOpenNoteSheet && onOpenNoteSheet(task)}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md text-text-3 hover:text-primary hover:bg-primary-soft/50 transition-colors ml-auto"
              title="Abrir nota vinculada"
            >
              <FileText className="w-3 h-3" />
              <span>Nota</span>
            </button>
          </div>

          {/* Subtasks Accordion */}
          <SubtaskAccordion taskId={task.id} />
        </div>

        {/* Action Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-text-3 hover:text-text hover:bg-surface-2 opacity-60 group-hover:opacity-100 transition-opacity"
            aria-label="Mais opções"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-6 z-40 w-36 rounded-xl bg-surface border border-primary-border shadow-lg p-1 text-xs">
                {onPostpone && !isCompletedState && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onPostpone(task.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-2 hover:text-primary hover:bg-surface-2 transition-colors text-left"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Adiar para amanhã</span>
                  </button>
                )}
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(task);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-2 hover:text-text hover:bg-surface-2 transition-colors text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(task.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
