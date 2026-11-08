import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Pin,
  Download,
  Trash2,
  Columns,
  Check,
  Eye,
} from 'lucide-react';

export function NoteEditor({
  note,
  notebooks = [],
  onSave,
  onDelete,
  onTogglePin,
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [notebookId, setNotebookId] = useState(note?.notebook_id || '');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [showSplitView, setShowSplitView] = useState(true);
  const saveTimeoutRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Escreva suas anotações aqui...',
      }),
    ],
    content: note?.content || '',
    onUpdate: ({ editor }) => {
      triggerAutoSave(title, editor.getHTML(), notebookId);
    },
  });

  // When selected note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setNotebookId(note.notebook_id || '');
      if (editor && editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content || '');
      }
    }
  }, [note?.id, editor]);

  const triggerAutoSave = useCallback(
    (newTitle, newContent, newNotebookId) => {
      if (!note?.id) return;
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await onSave({
            id: note.id,
            title: newTitle,
            content: newContent,
            notebook_id: newNotebookId ? parseInt(newNotebookId, 10) : null,
          });
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          setSaveStatus('idle');
        }
      }, 700);
    },
    [note?.id, onSave]
  );

  const handleTitleChange = (e) => {
    const nextTitle = e.target.value;
    setTitle(nextTitle);
    const content = editor ? editor.getHTML() : note?.content || '';
    triggerAutoSave(nextTitle, content, notebookId);
  };

  const handleNotebookChange = (e) => {
    const nextNotebookId = e.target.value;
    setNotebookId(nextNotebookId);
    const content = editor ? editor.getHTML() : note?.content || '';
    triggerAutoSave(title, content, nextNotebookId);
  };

  const handleExport = () => {
    if (!note) return;
    window.open(`/api/notes/${note.id}/export`, '_blank');
  };

  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-3">
        <p className="text-sm">Selecione uma nota ou crie uma nova para editar.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface rounded-3xl border border-primary-border/60 shadow-sm overflow-hidden">
      {/* Top action toolbar */}
      <div className="px-6 py-3 border-b border-primary-border/40 flex flex-wrap items-center justify-between gap-3 bg-surface/80 backdrop-blur-sm">
        {/* Notebook selection & save indicator */}
        <div className="flex items-center gap-3">
          <select
            value={notebookId || ''}
            onChange={handleNotebookChange}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-surface-2 border border-primary-border/60 text-text-2 focus:outline-none focus:border-primary"
          >
            <option value="">Sem caderno</option>
            {notebooks.map((nb) => (
              <option key={nb.id} value={nb.id}>
                {nb.name}
              </option>
            ))}
          </select>

          {/* Autosave badge indicator */}
          <AnimatePresence>
            {saveStatus === 'saving' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11px] font-medium text-text-3 flex items-center gap-1"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Salvando...</span>
              </motion.span>
            )}
            {saveStatus === 'saved' && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvo</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Right actions (pin, split view, export, delete) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTogglePin && onTogglePin(note)}
            className={`p-2 rounded-xl transition-colors ${
              note.pinned
                ? 'text-primary bg-primary-soft border border-primary/25'
                : 'text-text-3 hover:text-text hover:bg-surface-2'
            }`}
            title={note.pinned ? 'Desafixar nota' : 'Fixar nota no topo'}
          >
            <Pin className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowSplitView(!showSplitView)}
            className={`hidden md:flex p-2 rounded-xl transition-colors ${
              showSplitView
                ? 'text-primary bg-primary-soft border border-primary/25'
                : 'text-text-3 hover:text-text hover:bg-surface-2'
            }`}
            title="Alternar split view (editor + preview)"
          >
            <Columns className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="p-2 rounded-xl text-text-3 hover:text-text hover:bg-surface-2 transition-colors"
            title="Exportar como .md"
          >
            <Download className="w-4 h-4" />
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              className="p-2 rounded-xl text-text-3 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Excluir nota"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor title input */}
      <div className="px-6 pt-4 pb-2">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Título da nota..."
          className="w-full text-xl sm:text-2xl font-bold bg-transparent text-text placeholder:text-text-3/50 focus:outline-none"
        />
      </div>

      {/* Formatting toolbar */}
      {editor && (
        <div className="px-6 py-1.5 border-b border-primary-border/30 flex items-center gap-1 overflow-x-auto text-text-3">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg hover:text-text hover:bg-surface-2 transition-colors ${
              editor.isActive('bold') ? 'text-primary bg-primary-soft' : ''
            }`}
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg hover:text-text hover:bg-surface-2 transition-colors ${
              editor.isActive('italic') ? 'text-primary bg-primary-soft' : ''
            }`}
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-lg hover:text-text hover:bg-surface-2 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'text-primary bg-primary-soft' : ''
            }`}
            title="Título 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg hover:text-text hover:bg-surface-2 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'text-primary bg-primary-soft' : ''
            }`}
            title="Título 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg hover:text-text hover:bg-surface-2 transition-colors ${
              editor.isActive('bulletList') ? 'text-primary bg-primary-soft' : ''
            }`}
            title="Lista com marcadores"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg hover:text-text hover:bg-surface-2 transition-colors ${
              editor.isActive('orderedList') ? 'text-primary bg-primary-soft' : ''
            }`}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg hover:text-text hover:bg-surface-2 transition-colors ${
              editor.isActive('blockquote') ? 'text-primary bg-primary-soft' : ''
            }`}
            title="Citação"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded-lg hover:text-text hover:bg-surface-2 transition-colors ${
              editor.isActive('codeBlock') ? 'text-primary bg-primary-soft' : ''
            }`}
            title="Código"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main editor area (single view or split view on desktop) */}
      <div className="flex-1 overflow-y-auto p-6 flex">
        <div className={`w-full ${showSplitView ? 'md:w-1/2 md:pr-4 md:border-r md:border-primary-border/30' : ''}`}>
          <EditorContent editor={editor} className="prose prose-pink max-w-none focus:outline-none min-h-[350px]" />
        </div>

        {/* Markdown preview split view */}
        {showSplitView && (
          <div className="hidden md:block w-1/2 pl-4 overflow-y-auto">
            <div className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </div>
            <div
              className="prose prose-pink max-w-none text-text text-sm"
              dangerouslySetInnerHTML={{ __html: editor ? editor.getHTML() : note.content || '' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

