import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, queryKeys } from '../services/api';
import { useTasks } from '../hooks/useTasks';
import { StatCard } from '../components/features/StatCard';
import { TaskCard } from '../components/features/TaskCard';
import { TaskModal } from '../components/features/TaskModal';
import { NoteChip } from '../components/features/NoteChip';
import { Sheet } from '../components/ui/Sheet';
import { NoteEditor } from '../components/features/NoteEditor';
import { useNotes } from '../hooks/useNotes';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Clock,
  CheckCircle2,
  Target,
  Plus,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function Home() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskNote, setSelectedTaskNote] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const navigate = useNavigate();

  const {
    tasks,
    categories,
    projects,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    postponeTask,
  } = useTasks();

  const { notes, notebooks, updateNote, togglePinNote } = useNotes();

  const { data: timeSummary } = useQuery({
    queryKey: queryKeys.timeSummary,
    queryFn: api.getTimeSummary,
  });

  const { data: weekHours } = useQuery({
    queryKey: queryKeys.hoursPerDay(7),
    queryFn: () => api.getHoursPerDay(7),
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const { data: planningDay } = useQuery({
    queryKey: queryKeys.planningDay(todayStr),
    queryFn: () => api.getPlanningDay(todayStr),
  });

  // Calculate today stats
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedToday = todayTasks.filter((t) => t.status === 'concluida');
  const workedTodayMinutes = timeSummary?.daily?.worked_minutes || 0;
  const workedTodayHours = (workedTodayMinutes / 60).toFixed(1);

  const plannedTodayMinutes = todayTasks.reduce(
    (acc, t) => acc + (t.estimated_minutes || 0),
    0
  );

  const precisionRate =
    plannedTodayMinutes > 0
      ? Math.min(100, Math.round((workedTodayMinutes / plannedTodayMinutes) * 100))
      : 100;

  const handleOpenNoteSheet = (task) => {
    // Find note linked to this task or prompt to open notes
    const linkedNote = notes.find((n) => n.task_id === task.id);
    if (linkedNote) {
      setSelectedTaskNote(linkedNote);
    } else {
      navigate('/notas');
    }
  };

  const chartData = (weekHours || []).map((item) => ({
    dia: item.day_label || item.day || item.date,
    horas: Number((item.hours || 0).toFixed(1)),
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Overload Alert if day is overloaded */}
      {planningDay?.overload?.overload_minutes > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Atenção para sobrecarga:</span> Você tem{' '}
              {planningDay.overload.overload_minutes} min a mais do que a capacidade disponível hoje.
            </div>
          </div>
          <Link
            to="/tarefas"
            className="text-xs font-semibold text-amber-700 dark:text-amber-300 underline hover:no-underline"
          >
            Ajustar
          </Link>
        </div>
      )}

      {/* Stats Cards Section */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Hoje"
          value={Number(workedTodayHours)}
          suffix="h"
          description={`De ${Math.round(plannedTodayMinutes / 60)}h previstas`}
          icon={Clock}
          progress={plannedTodayMinutes > 0 ? (workedTodayMinutes / plannedTodayMinutes) * 100 : 0}
          progressLabel="Meta diária"
          delay={0}
        />
        <StatCard
          title="Tarefas"
          value={completedToday.length}
          description={`${todayTasks.length} planejadas para hoje`}
          icon={CheckCircle2}
          progress={todayTasks.length > 0 ? (completedToday.length / todayTasks.length) * 100 : 0}
          progressLabel="Concluídas"
          delay={1}
        />
        <StatCard
          title="Precisão"
          value={precisionRate}
          suffix="%"
          description="Aderência às estimativas"
          icon={Target}
          progress={precisionRate}
          progressLabel="Taxa de acerto"
          delay={2}
        />
      </section>

      {/* Main 2-column Grid for Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Meu Dia (Today's Tasks) */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text tracking-tight flex items-center gap-2">
                <span>Meu Dia</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-soft text-primary text-xs font-semibold">
                  {todayTasks.length}
                </span>
              </h2>
              <p className="text-xs text-text-3 mt-0.5">Foco para hoje</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-sm shadow-pink-500/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova tarefa</span>
            </button>
          </div>

          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface border border-primary-border/60 text-center">
                <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-text">Nenhuma tarefa agendada para hoje</h4>
                <p className="text-xs text-text-3 mt-1">Que tal planejar algo produtivo ou relaxar?</p>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors"
                >
                  Adicionar primeira tarefa
                </button>
              </div>
            ) : (
              todayTasks.map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  categories={categories}
                  projects={projects}
                  onComplete={completeTask}
                  onReopen={reopenTask}
                  onPostpone={postponeTask}
                  onEdit={(t) => {
                    setTaskToEdit(t);
                    setIsTaskModalOpen(true);
                  }}
                  onDelete={deleteTask}
                  onOpenNoteSheet={handleOpenNoteSheet}
                  delay={idx}
                />
              ))
            )}
          </div>
        </section>

        {/* Right Column: Weekly Chart & Recent Notes */}
        <section className="lg:col-span-5 space-y-6">
          {/* Weekly Hours Recharts Card */}
          <div className="p-5 rounded-2xl bg-surface border border-primary-border/60 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-text">Horas da semana</h3>
                <p className="text-xs text-text-3">Distribuição do tempo trabalhado</p>
              </div>
              <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded-full bg-primary-soft">
                {Number((timeSummary?.weekly?.worked_minutes || 0) / 60).toFixed(1)}h total
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="dia"
                    stroke="var(--color-text-3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-text-3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-primary-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--color-text)',
                      boxShadow: '0 4px 12px rgba(236,72,153,0.1)',
                    }}
                    cursor={{ fill: 'var(--color-surface-2)', opacity: 0.5 }}
                    formatter={(val) => [`${val} horas`, 'Trabalhado']}
                  />
                  <Bar
                    dataKey="horas"
                    fill="var(--color-primary)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Notes Horizontal Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text">Notas recentes</h3>
                <p className="text-xs text-text-3">Ideias e anotações rápidas</p>
              </div>
              <Link
                to="/notas"
                className="text-xs font-semibold text-primary hover:text-primary-light flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none overscroll-x-contain">
              {notes.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface border border-primary-border/60 text-xs text-text-3 w-full text-center">
                  Nenhuma nota cadastrada ainda.
                </div>
              ) : (
                notes.slice(0, 5).map((note) => {
                  const notebook = notebooks.find((nb) => nb.id === note.notebook_id);
                  return (
                    <NoteChip
                      key={note.id}
                      note={note}
                      notebook={notebook}
                      onClick={() => navigate('/notas')}
                    />
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Task Modal for Creating / Editing */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        categories={categories}
        projects={projects}
        onSave={async (data) => {
          if (taskToEdit) {
            await updateTask({ id: taskToEdit.id, data });
          } else {
            await createTask(data);
          }
        }}
      />

      {/* Bottom Sheet for Linked Task Note */}
      <Sheet
        isOpen={Boolean(selectedTaskNote)}
        onClose={() => setSelectedTaskNote(null)}
        title={selectedTaskNote?.title || 'Nota vinculada'}
      >
        {selectedTaskNote && (
          <div className="h-[60vh]">
            <NoteEditor
              note={selectedTaskNote}
              notebooks={notebooks}
              onSave={updateNote}
              onTogglePin={togglePinNote}
            />
          </div>
        )}
      </Sheet>
    </div>
  );
}

