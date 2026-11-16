import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api, queryKeys } from '../services/api';
import { useTasks } from '../hooks/useTasks';
import { useTimer } from '../hooks/useTimer';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import {
  Calendar,
  CalendarDays,
  FolderKanban,
  Wand2,
  Scale,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

const PROJECT_COLORS = [
  '#D63B6A',
  '#E85280',
  '#9E506B',
  '#6366F1',
  '#0F766E',
  '#B45309',
];

function getMondayISO(dateObj = new Date()) {
  const d = new Date(dateObj);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function addDaysISO(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function Planner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { tasks, projects, updateTask } = useTasks();
  const { activeTask, isRunning, toggleTimer } = useTimer();

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    initialTab === 'semana' || initialTab === 'projetos' ? initialTab : 'dia'
  );

  useEffect(() => {
    const paramTab = searchParams.get('tab');
    if (paramTab && ['dia', 'semana', 'projetos'].includes(paramTab)) {
      setActiveTab(paramTab);
    }
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // ==================== STATE: DAY TIMELINE ====================
  const todayISO = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [dayPreview, setDayPreview] = useState(null);

  const { data: dayTimeline, isLoading: isDayLoading } = useQuery({
    queryKey: queryKeys.planningDay(selectedDate),
    queryFn: () => api.getPlanningDay(selectedDate),
  });

  const organizeDayMutation = useMutation({
    mutationFn: ({ apply }) => api.organizeDay({ date: selectedDate, apply }),
    onSuccess: (res, variables) => {
      if (res.error) {
        addToast({ title: 'Dia não útil', message: res.error, type: 'warning' });
        return;
      }
      if (variables.apply) {
        setDayPreview(null);
        queryClient.invalidateQueries({ queryKey: queryKeys.planningDay(selectedDate) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
        addToast({
          title: 'Dia organizado',
          message: `${res.suggestions?.length || 0} tarefa(s) encaixadas na timeline.`,
          type: 'success',
        });
      } else {
        setDayPreview(res);
      }
    },
  });

  // ==================== STATE: WEEK OVERVIEW ====================
  const [weekStart, setWeekStart] = useState(() => getMondayISO(new Date()));
  const [selectedWeekDay, setSelectedWeekDay] = useState(todayISO);
  const [weekPreview, setWeekPreview] = useState(null);

  const { data: weekDays = [] } = useQuery({
    queryKey: queryKeys.planningWeek(weekStart),
    queryFn: () => api.getPlanningWeek(weekStart),
  });

  const balanceWeekMutation = useMutation({
    mutationFn: ({ apply }) => api.balanceWeek({ start: weekStart, apply }),
    onSuccess: (res, variables) => {
      if (variables.apply) {
        setWeekPreview(null);
        queryClient.invalidateQueries({ queryKey: queryKeys.planningWeek(weekStart) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
        addToast({
          title: 'Semana reequilibrada',
          message: `${res.suggestions?.length || 0} tarefa(s) redistribuídas.`,
          type: 'success',
        });
      } else {
        setWeekPreview(res);
      }
    },
  });

  const weekDayTasks = tasks.filter(
    (t) => t.date === selectedWeekDay && t.status !== 'cancelada'
  );

  const handleMoveTaskDate = async (task, offsetDays) => {
    const nextDate = addDaysISO(task.date || selectedWeekDay, offsetDays);
    await updateTask({ id: task.id, data: { date: nextDate, time: null } });
    queryClient.invalidateQueries({ queryKey: queryKeys.planningWeek(weekStart) });
    addToast({
      title: 'Tarefa movida',
      message: `"${task.name}" movida para ${nextDate}.`,
      type: 'success',
    });
  };

  // ==================== STATE: PROJECTS PANEL ====================
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projName, setProjName] = useState('');
  const [projDescription, setProjDescription] = useState('');
  const [projDeadline, setProjDeadline] = useState('');
  const [projEstHours, setProjEstHours] = useState('');
  const [projColor, setProjColor] = useState(PROJECT_COLORS[0]);

  const openProjectModal = (project = null) => {
    setEditingProject(project);
    if (project) {
      setProjName(project.name || '');
      setProjDescription(project.description || '');
      setProjDeadline(project.deadline || '');
      setProjEstHours(
        project.estimated_minutes ? String(Math.round(project.estimated_minutes / 60)) : ''
      );
      setProjColor(project.color || PROJECT_COLORS[0]);
    } else {
      setProjName('');
      setProjDescription('');
      setProjDeadline('');
      setProjEstHours('');
      setProjColor(PROJECT_COLORS[0]);
    }
    setIsProjectModalOpen(true);
  };

  const saveProjectMutation = useMutation({
    mutationFn: (payload) =>
      editingProject
        ? api.updateProject(editingProject.id, payload)
        : api.createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      setIsProjectModalOpen(false);
      addToast({
        title: editingProject ? 'Projeto atualizado' : 'Projeto criado',
        message: 'Lista de projetos atualizada.',
        type: 'success',
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      addToast({
        title: 'Projeto removido',
        message: 'As tarefas vinculadas continuam disponíveis.',
        type: 'success',
      });
    },
  });

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!projName.trim()) return;
    const estMinutes = projEstHours ? Math.max(1, parseInt(projEstHours, 10) * 60) : null;
    saveProjectMutation.mutate({
      name: projName.trim(),
      description: projDescription.trim() || null,
      deadline: projDeadline || null,
      estimated_minutes: estMinutes,
      color: projColor,
    });
  };

  // Merge timeline blocks + free slots sorted chronologically for a complete schedule view
  const mergedTimeline = React.useMemo(() => {
    if (!dayTimeline) return [];
    const blocks = (dayTimeline.blocks || []).map((b) => ({ ...b, kind: 'occupied' }));
    const free = (dayTimeline.free_slots || []).map((f) => ({
      ...f,
      kind: 'free',
      type: 'livre',
      label: `Espaço livre (${f.duration_minutes} min)`,
    }));
    return [...blocks, ...free].sort((a, b) => a.start.localeCompare(b.start));
  }, [dayTimeline]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header + Responsive View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
            Planejamento
          </h1>
          <p className="text-xs text-text-3 mt-0.5">
            Timeline diária, equilíbrio da semana e acompanhamento de projetos
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-2/80 border border-primary-border/50 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'dia', label: 'Meu Dia', Icon: Clock },
            { id: 'semana', label: 'Semana', Icon: CalendarDays },
            { id: 'projetos', label: 'Projetos', Icon: FolderKanban },
          ].map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => switchTab(id)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-surface text-primary shadow-sm border border-primary/20'
                    : 'text-text-3 hover:text-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ======================= TAB 1: MEU DIA TIMELINE ======================= */}
        {activeTab === 'dia' && (
          <motion.div
            key="tab-dia"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Date Picker & Auto-Organize Controls */}
            <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-primary-border/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDayPreview(null);
                    setSelectedDate(addDaysISO(selectedDate, -1));
                  }}
                  className="p-2 rounded-xl bg-surface-2 text-text-2 hover:text-primary border border-primary-border/40"
                  aria-label="Dia anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setDayPreview(null);
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-surface-2 border border-primary-border/60 text-xs font-semibold text-text focus:outline-none focus:border-primary"
                />

                <button
                  type="button"
                  onClick={() => {
                    setDayPreview(null);
                    setSelectedDate(addDaysISO(selectedDate, 1));
                  }}
                  className="p-2 rounded-xl bg-surface-2 text-text-2 hover:text-primary border border-primary-border/40"
                  aria-label="Próximo dia"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {selectedDate !== todayISO && (
                  <button
                    type="button"
                    onClick={() => {
                      setDayPreview(null);
                      setSelectedDate(todayISO);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary-soft border border-primary/20"
                  >
                    Hoje
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={organizeDayMutation.isPending}
                  onClick={() => organizeDayMutation.mutate({ apply: false })}
                >
                  <Wand2 className="w-3.5 h-3.5 text-primary" />
                  <span>Sugerir encaixe</span>
                </Button>

                <Button
                  size="sm"
                  loading={organizeDayMutation.isPending}
                  onClick={() => organizeDayMutation.mutate({ apply: true })}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Organizar meu dia</span>
                </Button>
              </div>
            </div>

            {/* Preview Box if user requested suggestion */}
            {dayPreview && (
              <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-primary/40 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-text">
                    Sugestão de encaixe ({dayPreview.suggestions?.length || 0} tarefas)
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setDayPreview(null)}>
                      Descartar
                    </Button>
                    {dayPreview.suggestions?.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => organizeDayMutation.mutate({ apply: true })}
                      >
                        Aplicar horários
                      </Button>
                    )}
                  </div>
                </div>

                {dayPreview.suggestions?.length === 0 ? (
                  <p className="text-xs text-text-3">
                    Todas as tarefas do dia já estão encaixadas ou não há tarefas pendentes sem horário.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dayPreview.suggestions.map((s) => (
                      <div
                        key={s.task_id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-primary-border/40 text-xs"
                      >
                        <span className="font-semibold text-text truncate pr-2">{s.name}</span>
                        <span className="font-mono text-primary font-bold shrink-0">
                          {s.suggested_time} ({s.estimated_minutes}m)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {dayPreview.unfit?.length > 0 && (
                  <p className="text-xs text-primary flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {dayPreview.unfit.length} tarefa(s) não couberam na janela útil de hoje.
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* 2-Column Responsive Split: Vertical Timeline + Unscheduled Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Vertical Hourly Timeline */}
              <div className="lg:col-span-7 p-5 rounded-3xl bg-surface border border-primary-border/70 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-text">Linha do tempo do dia</h2>
                    <p className="text-xs text-text-3">
                      {dayTimeline?.is_working_day
                        ? `Jornada: ${dayTimeline.work_start} às ${dayTimeline.work_end}`
                        : 'Dia configurado como descanso'}
                    </p>
                  </div>
                </div>

                {isDayLoading ? (
                  <div className="py-10 text-center text-xs text-text-3">
                    Carregando timeline...
                  </div>
                ) : mergedTimeline.length === 0 ? (
                  <div className="py-10 text-center text-xs text-text-3">
                    Nenhum bloco ou compromisso neste dia.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {mergedTimeline.map((item, idx) => {
                      const isFree = item.kind === 'free';
                      const isTask = item.type === 'tarefa';
                      const isDone = item.status === 'concluida';
                      const isCurrent = activeTask?.id === item.task_id;
                      const running = isCurrent && isRunning;

                      return (
                        <div
                          key={`${item.start}-${idx}`}
                          className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-colors ${
                            isFree
                              ? 'bg-surface-2/40 border-dashed border-primary-border/50 text-text-3'
                              : isTask
                              ? 'bg-surface-2/80 border-primary-border/60 text-text'
                              : 'bg-primary-soft/50 border-primary/25 text-text'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-xs font-bold text-primary shrink-0 w-24">
                              {item.start} – {item.end}
                            </span>
                            <div className="min-w-0">
                              <p
                                className={`text-xs font-semibold truncate ${
                                  isDone ? 'line-through text-text-3' : ''
                                }`}
                              >
                                {item.label}
                              </p>
                              <span className="text-[11px] text-text-3 capitalize">
                                {isFree ? 'Horário disponível' : item.type}
                              </span>
                            </div>
                          </div>

                          {isTask && !isDone && item.task_id && (
                            <button
                              type="button"
                              onClick={() => toggleTimer(item.task_id)}
                              className={`p-1.5 rounded-xl shrink-0 transition-colors ${
                                running
                                  ? 'bg-primary text-white'
                                  : 'bg-surface text-text-2 hover:text-primary border border-primary-border/50'
                              }`}
                              title={running ? 'Pausar' : 'Iniciar cronômetro'}
                            >
                              {running ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Unscheduled Tasks Column */}
              <div className="lg:col-span-5 p-5 rounded-3xl bg-surface border border-primary-border/70 shadow-sm space-y-4 h-fit">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-text">Sem horário definido</h2>
                    <p className="text-xs text-text-3">
                      {dayTimeline?.unscheduled_tasks?.length || 0} tarefa(s) aguardando encaixe
                    </p>
                  </div>
                </div>

                {(dayTimeline?.unscheduled_tasks || []).length === 0 ? (
                  <p className="text-xs text-text-3 py-6 text-center">
                    Nenhuma tarefa sem horário nesta data.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayTimeline.unscheduled_tasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-surface-2/70 border border-primary-border/50"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text truncate">{t.name}</p>
                          <span className="text-[11px] text-text-3">
                            {t.estimated_minutes ? `${t.estimated_minutes} min` : '30 min padrão'} · {t.priority}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleTimer(t.id)}
                          className="p-1.5 rounded-xl bg-surface text-text-2 hover:text-primary border border-primary-border/50 shrink-0"
                          title="Iniciar agora"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================= TAB 2: VISÃO SEMANAL ======================= */}
        {activeTab === 'semana' && (
          <motion.div
            key="tab-semana"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Week Header & Rebalance Actions */}
            <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-primary-border/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWeekPreview(null);
                    setWeekStart(addDaysISO(weekStart, -7));
                  }}
                  className="p-2 rounded-xl bg-surface-2 text-text-2 hover:text-primary border border-primary-border/40"
                  aria-label="Semana anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-text px-2">
                  Semana de {weekStart.split('-').reverse().join('/')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setWeekPreview(null);
                    setWeekStart(addDaysISO(weekStart, 7));
                  }}
                  className="p-2 rounded-xl bg-surface-2 text-text-2 hover:text-primary border border-primary-border/40"
                  aria-label="Próxima semana"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={balanceWeekMutation.isPending}
                  onClick={() => balanceWeekMutation.mutate({ apply: false })}
                >
                  <Scale className="w-3.5 h-3.5 text-primary" />
                  <span>Simular equilíbrio</span>
                </Button>
                <Button
                  size="sm"
                  loading={balanceWeekMutation.isPending}
                  onClick={() => balanceWeekMutation.mutate({ apply: true })}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reequilibrar semana</span>
                </Button>
              </div>
            </div>

            {weekPreview && (
              <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-primary/40 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-text">
                    Redistribuição sugerida ({weekPreview.suggestions?.length || 0})
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setWeekPreview(null)}>
                      Fechar
                    </Button>
                    {weekPreview.suggestions?.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => balanceWeekMutation.mutate({ apply: true })}
                      >
                        Aplicar tudo
                      </Button>
                    )}
                  </div>
                </div>
                {weekPreview.suggestions?.length === 0 ? (
                  <p className="text-xs text-text-3">
                    Sua semana já está equilibrada — nenhum dia ultrapassa 100% da capacidade.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {weekPreview.suggestions.map((s) => (
                      <div
                        key={s.task_id}
                        className="p-3 rounded-2xl bg-surface-2 border border-primary-border/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                      >
                        <span className="font-semibold text-text">{s.name}</span>
                        <span className="text-text-3">
                          {s.from_date.slice(5)} → {s.to_date.slice(5)} · {s.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Responsive 7-Day Load Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {weekDays.map((day) => {
                const isSelected = selectedWeekDay === day.date;
                const isOver = day.percent > 100;
                const barWidth = Math.min(100, day.percent || 0);

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedWeekDay(day.date)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-primary-soft/60 border-primary shadow-sm'
                        : 'bg-surface border-primary-border/70 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-text">{day.weekday_label}</span>
                      <span className="text-[11px] font-mono text-text-3">
                        {day.date.slice(8)}/{day.date.slice(5, 7)}
                      </span>
                    </div>

                    <div>
                      <p className="text-lg font-extrabold text-text">
                        {(day.planned_minutes / 60).toFixed(1)}h
                      </p>
                      <span className="text-[11px] text-text-3">
                        {day.task_count} tarefa(s) · {day.percent}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-primary' : 'bg-[#F0A0B5]'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Tasks Breakdown with Quick Move Next/Prev Day */}
            <div className="p-5 rounded-3xl bg-surface border border-primary-border/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Tarefas em {selectedWeekDay.split('-').reverse().join('/')}</span>
                </h3>
                <span className="text-xs text-text-3 font-medium">
                  {weekDayTasks.length} entrega(s)
                </span>
              </div>

              {weekDayTasks.length === 0 ? (
                <p className="text-xs text-text-3 py-4 text-center">
                  Nenhuma tarefa agendada para este dia.
                </p>
              ) : (
                <div className="space-y-2">
                  {weekDayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-2/70 border border-primary-border/40"
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold text-text truncate ${
                            t.status === 'concluida' ? 'line-through text-text-3' : ''
                          }`}
                        >
                          {t.name}
                        </p>
                        <span className="text-[11px] text-text-3">
                          {t.estimated_minutes ? `${t.estimated_minutes} min` : 'Sem estimativa'}
                          {t.time ? ` · ${t.time}` : ''}
                        </span>
                      </div>

                      {t.status !== 'concluida' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMoveTaskDate(t, -1)}
                            className="px-2 py-1 rounded-lg bg-surface border border-primary-border/50 text-[11px] font-medium text-text-2 hover:text-primary"
                            title="Mover para o dia anterior"
                          >
                            -1 dia
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTaskDate(t, 1)}
                            className="px-2 py-1 rounded-lg bg-surface border border-primary-border/50 text-[11px] font-medium text-text-2 hover:text-primary"
                            title="Mover para o próximo dia"
                          >
                            +1 dia
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ======================= TAB 3: PAINEL DE PROJETOS ======================= */}
        {activeTab === 'projetos' && (
          <motion.div
            key="tab-projetos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text">Seus Projetos</h2>
                <p className="text-xs text-text-3">
                  Acompanhe progresso de entregas, horas investidas e prazos
                </p>
              </div>
              <Button size="sm" onClick={() => openProjectModal(null)}>
                <Plus className="w-4 h-4" />
                <span>Novo projeto</span>
              </Button>
            </div>

            {projects.length === 0 ? (
              <div className="p-10 rounded-3xl bg-surface border border-primary-border/70 text-center space-y-3">
                <FolderKanban className="w-10 h-10 text-primary mx-auto opacity-80" />
                <h3 className="text-sm font-bold text-text">Nenhum projeto cadastrado</h3>
                <p className="text-xs text-text-3 max-w-sm mx-auto">
                  Agrupe tarefas em projetos para acompanhar metas, prazos e tempo total dedicado.
                </p>
                <Button size="sm" onClick={() => openProjectModal(null)}>
                  Criar primeiro projeto
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-3xl bg-surface border border-primary-border/70 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: p.color || '#D63B6A' }}
                          />
                          <h3 className="text-sm font-bold text-text truncate">{p.name}</h3>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openProjectModal(p)}
                            className="p-1.5 rounded-lg text-text-3 hover:text-primary hover:bg-surface-2"
                            title="Editar projeto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Excluir o projeto "${p.name}"?`)) {
                                deleteProjectMutation.mutate(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-text-3 hover:text-rose-500 hover:bg-surface-2"
                            title="Excluir projeto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {p.deadline && (
                        <p className="text-xs text-text-3">
                          Prazo: <strong className="text-text-2">{p.deadline}</strong>
                        </p>
                      )}

                      {p.risk && (
                        <p
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border ${
                            p.risk.level === 'atrasado' || p.risk.level === 'risco'
                              ? 'bg-primary-soft text-primary border-primary/25'
                              : 'bg-surface-2 text-text-2 border-primary-border/40'
                          }`}
                        >
                          {p.risk.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-3">
                            {p.done_tasks || 0} de {p.total_tasks || 0} tarefas
                          </span>
                          <span className="font-bold text-text">{p.progress_percent || 0}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${p.progress_percent || 0}%`,
                              backgroundColor: p.color || '#D63B6A',
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-primary-border/40 text-xs">
                        <span className="text-text-3">
                          Investido:{' '}
                          <strong className="text-text">
                            {((p.worked_minutes || 0) / 60).toFixed(1)}h
                          </strong>
                        </span>

                        <button
                          type="button"
                          onClick={() => navigate(`/tarefas?projeto=${p.id}`)}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                        >
                          <span>Ver tarefas</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Create/Edit Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={editingProject ? 'Editar Projeto' : 'Novo Projeto'}
        description="Defina meta, prazo e cor para acompanhar o andamento"
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <Input
            label="Nome do projeto"
            placeholder="Ex.: Lançamento v2, TCC, Reforma..."
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Descrição (opcional)"
            placeholder="Objetivo principal deste projeto..."
            value={projDescription}
            onChange={(e) => setProjDescription(e.target.value)}
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Prazo final (opcional)"
              type="date"
              value={projDeadline}
              onChange={(e) => setProjDeadline(e.target.value)}
            />
            <Input
              label="Estimativa total (horas)"
              type="number"
              min="1"
              placeholder="Ex.: 20"
              value={projEstHours}
              onChange={(e) => setProjEstHours(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-2">Cor do projeto</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setProjColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    projColor === c ? 'scale-125 border-text' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-primary-border/40">
            <Button variant="ghost" onClick={() => setIsProjectModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saveProjectMutation.isPending}>
              {editingProject ? 'Salvar alterações' : 'Criar projeto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
