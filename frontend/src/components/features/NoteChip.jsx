import React from 'react';
import { motion } from 'framer-motion';
import { Pin } from 'lucide-react';

export function NoteChip({ note, notebook, onClick }) {
  // Strip html tags for snippet preview
  const plainText = (note.content || '').replace(/<[^>]*>?/gm, '').trim();

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick && onClick(note)}
      className="shrink-0 w-64 p-4 rounded-2xl bg-surface border border-primary-border/60 shadow-sm cursor-pointer flex flex-col justify-between hover:border-primary/50 transition-colors"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          {notebook ? (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md truncate max-w-[140px]"
              style={{
                backgroundColor: `${notebook.color || '#D9648F'}20`,
                color: notebook.color || '#D9648F',
              }}
            >
              {notebook.name}
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-2 text-text-3">
              Sem caderno
            </span>
          )}

          {note.pinned && (
            <Pin className="w-3.5 h-3.5 text-primary fill-primary/30 shrink-0" />
          )}
        </div>

        <h4 className="text-sm font-semibold text-text truncate">
          {note.title || 'Sem título'}
        </h4>

        {plainText && (
          <p className="text-xs text-text-3 line-clamp-2 mt-1 leading-relaxed">
            {plainText}
          </p>
        )}
      </div>

      <div className="text-[10px] text-text-3 mt-3 pt-2 border-t border-primary-border/30">
        {note.updated_at ? new Date(note.updated_at).toLocaleDateString('pt-BR') : 'Hoje'}
      </div>
    </motion.div>
  );
}

