import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../../services/api';
import { Check, Plus, Trash2, ChevronDown } from 'lucide-react';

export function SubtaskAccordion({ taskId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const queryClient = useQueryClient();

  const { data: extras } = useQuery({
    queryKey: queryKeys.taskExtras(taskId),
    queryFn: () => api.getTaskExtras(taskId),
    enabled: isOpen,
  });

  const subtasks = extras?.subtasks || [];
  const completedCount = subtasks.filter((s) => s.done).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const createMutation = useMutation({
    mutationFn: (title) => api.createSubtask(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskExtras(taskId) });
      setNewTitle('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ subId, done }) => api.updateSubtask(subId, { done }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskExtras(taskId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (subId) => api.deleteSubtask(subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskExtras(taskId) });
    },
  });

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMutation.mutate(newTitle.trim());
  };

  return (
    <div className="mt-2.5 border-t border-primary-border/40 pt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-xs text-text-3 hover:text-text py-1 transition-colors group"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <span>Subtarefas</span>
          {totalCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-surface-2 text-[10px] text-text-2 font-mono">
              {completedCount}/{totalCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-3 group-hover:text-primary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Internal progress bar */}
      {totalCount > 0 && (
        <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden my-1.5">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1.5 pt-1.5"
          >
            {subtasks.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 group transition-colors"
              >
                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => updateMutation.mutate({ subId: sub.id, done: !sub.done })}
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      sub.done
                        ? 'bg-primary border-primary text-white'
                        : 'border-primary-border/80 hover:border-primary'
                    }`}
                  >
                    {sub.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                  <span
                    className={`text-xs truncate ${
                      sub.done ? 'line-through text-text-3 opacity-70' : 'text-text-2'
                    }`}
                  >
                    {sub.title}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(sub.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-3 hover:text-rose-500 transition-opacity"
                  title="Excluir subtarefa"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add subtask input */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Adicionar subtarefa..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-surface-2 border border-primary-border/40 rounded-lg px-2.5 py-1 text-xs text-text placeholder:text-text-3/60 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!newTitle.trim() || createMutation.isPending}
                className="p-1 rounded-lg bg-primary text-white disabled:opacity-40 hover:bg-primary-light transition-colors"
                title="Adicionar"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

