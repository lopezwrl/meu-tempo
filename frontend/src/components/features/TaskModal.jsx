import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { api } from '../../services/api';
import { useEnergyStore } from '../../stores/energyStore';
import { ENERGY_LEVELS } from '../ui/CategoryIcon';
import { Sparkles } from 'lucide-react';

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  taskToEdit = null,
  categories = [],
  projects = [],
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState('media');
  const [energyLevel, setEnergyLevel] = useState('media');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { getTaskEnergy, setTaskEnergy } = useEnergyStore();

  useEffect(() => {
    if (taskToEdit) {
      setName(taskToEdit.name || '');
      setDescription(taskToEdit.description || '');
      setEstimatedMinutes(taskToEdit.estimated_minutes ? String(taskToEdit.estimated_minutes) : '');
      setDate(taskToEdit.date || '');
      setTime(taskToEdit.time || '');
      setPriority(taskToEdit.priority || 'media');
      setEnergyLevel(getTaskEnergy(taskToEdit));
      setCategoryId(taskToEdit.category_id ? String(taskToEdit.category_id) : '');
      setProjectId(taskToEdit.project_id ? String(taskToEdit.project_id) : '');
    } else {
      setName('');
      setDescription('');
      setEstimatedMinutes('');
      // Default to today
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      setTime('');
      setPriority('media');
      setEnergyLevel('media');
      setCategoryId('');
      setProjectId('');
    }
    setSuggestion(null);
  }, [taskToEdit, isOpen, getTaskEnergy]);

  // Debounced estimation fetch
  useEffect(() => {
    if (!name || name.length < 3 || taskToEdit) {
      setSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.getEstimate(name, categoryId || undefined);
        if (res && res.suggested_minutes) {
          setSuggestion(res);
        } else {
          setSuggestion(null);
        }
      } catch {
        // silent
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [name, categoryId, taskToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const saved = await onSave({
        name: name.trim(),
        description: description.trim(),
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
        date: date || null,
        time: time || null,
        priority,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        project_id: projectId ? parseInt(projectId, 10) : null,
      });
      const targetId = saved?.id || taskToEdit?.id;
      if (targetId) {
        setTaskEnergy(targetId, energyLevel);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
      description="Organize seus compromissos alinhados ao seu ritmo de energia"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome da tarefa"
          placeholder="Ex.: Revisar proposta de design"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        {suggestion && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-primary/20 text-xs text-text-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>
                Sugestão baseada em tarefas similares:{' '}
                <strong>{suggestion.suggested_minutes} minutos</strong>
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setEstimatedMinutes(String(suggestion.suggested_minutes));
                setSuggestion(null);
              }}
              className="px-2 py-0.5 rounded-lg bg-primary text-white font-semibold text-[11px] hover:bg-primary-light transition-colors"
            >
              Aplicar
            </button>
          </div>
        )}

        <Textarea
          label="Descrição ou notas (opcional)"
          placeholder="Detalhes adicionais..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        {/* Circadian Energy Tier Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-text-2">
            Ritmo de Energia Necessário (Bateria Humana)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ENERGY_LEVELS.map((tier) => {
              const Icon = tier.icon;
              const isSelected = energyLevel === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setEnergyLevel(tier.id)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-primary-soft border-primary text-primary shadow-sm shadow-[#D63B6A]/10'
                      : 'bg-surface border-primary-border/60 text-text-3 hover:border-primary/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tier.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Estimativa (minutos)"
            type="number"
            min="1"
            placeholder="Ex.: 30"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-2">Prioridade</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl bg-surface border border-primary-border/70 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Input
            label="Horário (opcional)"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-2">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl bg-surface border border-primary-border/70 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Nenhuma categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-2">Projeto</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-xl bg-surface border border-primary-border/70 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Nenhum projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-primary-border/40">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSaving}>
            {taskToEdit ? 'Salvar alterações' : 'Criar tarefa'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
