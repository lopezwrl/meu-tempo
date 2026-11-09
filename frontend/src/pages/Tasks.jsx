import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useNotes } from '../hooks/useNotes';
import { useEnergyStore } from '../stores/energyStore';
import { api } from '../services/api';
import { TaskCard } from '../components/features/TaskCard';
import { TaskModal } from '../components/features/TaskModal';
import { CategoryIcon, ENERGY_LEVELS } from '../components/ui/CategoryIcon';
import { Sheet } from '../components/ui/Sheet';
import { NoteEditor } from '../components/features/NoteEditor';
import {
  Plus,
  Filter,
  BatteryCharging,
} from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  'Um passo de cada vez constrói grandes jornadas.',
  'Foco no processo, clareza na execução.',
  'Celebre cada entrega concluída no seu dia.',
  'Seu tempo é seu ativo mais valioso. Cuide bem dele.',
  'Respire fundo e comece pelo que realmente importa.',
];

export function Tasks() {
  const [statusFilter, setStatusFilter] = useState('pendentes'); // 'todas' | 'pendentes' | 'concluidas'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [selectedTaskNote, setSelectedTaskNote] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');

  const getTaskEnergy = useEnergyStore((s) => s.getTaskEnergy);

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

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (statusFilter === 'pendentes' && task.status === 'concluida') return false;
    if (statusFilter === 'concluidas' && task.status !== 'concluida') return false;

    // Category filter
    if (selectedCategory && task.category_id !== selectedCategory) return false;

    // Project filter
    if (selectedProject && task.project_id !== selectedProject) return false;

    // Circadian Energy filter
    if (selectedEnergy && getTaskEnergy(task) !== selectedEnergy) return false;

    return true;
  });

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    await createTask({
      name: quickTitle.trim(),
      priority: 'media',
      date: new Date().toISOString().split('T')[0],
      category_id: selectedCategory || null,
      project_id: selectedProject || null,
    });
    setQuickTitle('');
  };

  const handleOpenNoteSheet = (task) => {
    const linkedNote = notes.find((n) => n.task_id === task.id);
    if (linkedNote) {
      setSelectedTaskNote(linkedNote);
    } else {
      createNoteForTask(task);
    }
  };

  const createNoteForTask = async (task) => {
    const newNote = await api.createNote({
      title: `Nota: ${task.name}`,
      content: '',
      task_id: task.id,
    });
    setSelectedTaskNote(newNote);
  };

  // Pick motivational quote based on date
  const quoteIndex = new Date().getDate() % MOTIVATIONAL_QUOTES.length;
  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
            Tarefas
          </h1>
          <p className="text-xs text-text-3 mt-0.5">
            Organize suas entregas com foco, clareza e respeito ao seu ritmo
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-md shadow-pink-500/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova tarefa</span>
        </button>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 p-2 rounded-2xl bg-surface border border-primary-border/70 shadow-sm"
      >
        <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
          <Plus className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Adicionar tarefa rápida para hoje... (Pressione Enter)"
          className="flex-1 bg-transparent text-sm text-text placeholder:text-text-3/60 focus:outline-none px-2"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-light disabled:opacity-30 transition-all shrink-0"
        >
          Salvar
        </button>
      </form>

      {/* Status filter tabs & Category/Project/Energy Chips */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-2/60 border border-primary-border/40 w-fit">
            <button
              type="button"
              onClick={() => setStatusFilter('pendentes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'pendentes'
                  ? 'bg-surface text-primary shadow-sm shadow-pink-500/10'
                  : 'text-text-3 hover:text-text'
              }`}
            >
              Pendentes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'todas'
                  ? 'bg-surface text-primary shadow-sm shadow-pink-500/10'
                  : 'text-text-3 hover:text-text'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('concluidas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'concluidas'
                  ? 'bg-surface text-primary shadow-sm shadow-pink-500/10'
                  : 'text-text-3 hover:text-text'
              }`}
            >
              Concluídas
            </button>
          </div>

          {/* Circadian Energy Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-text-3 flex items-center gap-1 mr-1 shrink-0">
              <BatteryCharging className="w-3.5 h-3.5 text-primary" />
              <span>Energia:</span>
            </span>
            {ENERGY_LEVELS.map((tier) => {
              const Icon = tier.icon;
              const isSelected = selectedEnergy === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedEnergy(isSelected ? null : tier.id)}
                  className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm shadow-[#D63B6A]/20'
                      : 'bg-surface border-primary-border/50 text-text-3 hover:border-primary/40'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tier.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal scrollable category & project filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none overscroll-x-contain">
          <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filtros:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null);
              setSelectedProject(null);
              setSelectedEnergy(null);
            }}
            className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
              selectedCategory === null && selectedProject === null && selectedEnergy === null
                ? 'bg-primary-soft border-primary/40 text-primary'
                : 'bg-surface border-primary-border/50 text-text-3 hover:border-primary/40'
            }`}
          >
            Todos
          </button>

          {categories.map((c) => (
            <button
              key={`cat-${c.id}`}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
              className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                selectedCategory === c.id
                  ? 'bg-primary-soft border-primary/40 text-primary'
                  : 'bg-surface border-primary-border/50 text-text-3 hover:border-primary/40'
              }`}
            >
              <CategoryIcon
                icon={c.icon}
                name={c.name}
                className="w-3.5 h-3.5 text-primary"
              />
              <span>{c.name}</span>
            </button>
          ))}

          {projects.map((p) => (
            <button
              key={`proj-${p.id}`}
              type="button"
              onClick={() => setSelectedProject(selectedProject === p.id ? null : p.id)}
              className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                selectedProject === p.id
                  ? 'bg-pink-100 dark:bg-pink-950/60 border-primary text-primary'
                  : 'bg-surface border-primary-border/50 text-text-3 hover:border-primary/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task List or Empty State */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 rounded-3xl bg-surface border border-primary-border/60 text-center flex flex-col items-center justify-center">
            {/* SVG Illustration */}
            <div className="w-20 h-20 rounded-full bg-primary-soft/60 flex items-center justify-center mb-4 text-primary">
              <svg
                className="w-10 h-10 stroke-current"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <h3 className="text-base font-bold text-text">
              {statusFilter === 'concluidas'
                ? 'Nenhuma tarefa concluída neste filtro'
                : 'Tudo limpo por aqui!'}
            </h3>
            <p className="text-xs text-text-3 mt-1.5 max-w-sm italic">
              "{currentQuote}"
            </p>

            <button
              type="button"
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="mt-6 px-4 py-2.5 rounded-2xl bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-all shadow-md shadow-pink-500/20"
            >
              Criar nova tarefa
            </button>
          </div>
        ) : (
          filteredTasks.map((task, idx) => (
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

      {/* Task Modal for Creating / Editing */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        categories={categories}
        projects={projects}
        onSave={async (data) => {
          if (taskToEdit) {
            return await updateTask({ id: taskToEdit.id, data });
          }
          return await createTask(data);
        }}
      />

      {/* Bottom Sheet for Linked Task Note */}
      <Sheet
        isOpen={Boolean(selectedTaskNote)}
        onClose={() => setSelectedTaskNote(null)}
        title={selectedTaskNote?.title || 'Nota vinculada'}
      >
        {selectedTaskNote && (
          <div className="h-[65vh]">
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
