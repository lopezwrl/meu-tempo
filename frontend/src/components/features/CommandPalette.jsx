import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, CheckSquare, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CommandPalette({
  isOpen,
  onClose,
  notes = [],
  tasks = [],
  onSelectNote,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter notes & tasks
  const q = query.toLowerCase().trim();
  const filteredNotes = notes.filter(
    (n) =>
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q))
  );

  const filteredTasks = tasks.filter(
    (t) =>
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
  );

  const combinedResults = [
    ...filteredNotes.slice(0, 5).map((n) => ({ ...n, itemType: 'note' })),
    ...filteredTasks.slice(0, 5).map((t) => ({ ...t, itemType: 'task' })),
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, combinedResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, combinedResults.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = combinedResults[selectedIndex];
      if (item) {
        handleSelect(item);
      }
    }
  };

  const handleSelect = (item) => {
    onClose();
    if (item.itemType === 'note') {
      if (onSelectNote) {
        onSelectNote(item);
      }
      navigate('/notas');
    } else {
      navigate('/tarefas');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Palette Box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-xl bg-surface border border-primary-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-primary-border/40 gap-3">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar notas, tarefas ou comandos..."
                className="w-full bg-transparent text-sm text-text placeholder:text-text-3/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-text-3 hover:text-text hover:bg-surface-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results list */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {combinedResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-3">
                  Nenhum resultado encontrado para "{query}"
                </div>
              ) : (
                combinedResults.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isNote = item.itemType === 'note';

                  return (
                    <div
                      key={`${item.itemType}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer text-xs transition-colors ${
                        isSelected
                          ? 'bg-primary-soft text-primary'
                          : 'text-text-2 hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isNote
                              ? 'bg-pink-100 dark:bg-pink-950/60 text-primary'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isNote ? (
                            <FileText className="w-3.5 h-3.5" />
                          ) : (
                            <CheckSquare className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-text truncate">
                            {isNote ? item.title || 'Sem título' : item.name}
                          </p>
                          <span className="text-[10px] text-text-3 capitalize">
                            {isNote ? 'Nota' : `Tarefa • ${item.status}`}
                          </span>
                        </div>
                      </div>

                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-primary" />}
                    </div>
                  );
                })
              )}
            </div>

            {/* Palette Footer */}
            <div className="px-4 py-2 border-t border-primary-border/30 bg-surface-2/40 text-[11px] text-text-3 flex items-center justify-between">
              <span>Navegue com ↑ ↓ e pressione Enter</span>
              <span>ESC para fechar</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

