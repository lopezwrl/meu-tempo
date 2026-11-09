import React, { useState } from 'react';
import { useNotes } from '../hooks/useNotes';
import { NoteEditor } from '../components/features/NoteEditor';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Plus,
  Book,
  FileText,
  Pin,
  FolderPlus,
  Download,
  Trash2,
  Search,
} from 'lucide-react';

export function Notes() {
  const {
    notes,
    notebooks,
    createNote,
    updateNote,
    deleteNote,
    togglePinNote,
    createNotebook,
    deleteNotebook,
  } = useNotes();

  const [selectedNoteId, setSelectedNoteId] = useState(notes[0]?.id || null);
  const [selectedNotebookFilter, setSelectedNotebookFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookColor, setNewNotebookColor] = useState('#D63B6A');

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (selectedNotebookFilter !== 'all' && n.notebook_id !== selectedNotebookFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchContent = (n.content || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

  // Sort notes: pinned first, then updated_at descending
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
  });

  // Active note
  const currentNote = notes.find((n) => n.id === selectedNoteId) || sortedNotes[0];

  const handleCreateNewNote = async () => {
    const created = await createNote({
      title: 'Sem título',
      content: '',
      notebook_id: selectedNotebookFilter !== 'all' ? selectedNotebookFilter : undefined,
    });
    setSelectedNoteId(created.id);
  };

  const handleCreateNotebook = async (e) => {
    e.preventDefault();
    if (!newNotebookName.trim()) return;
    await createNotebook({
      name: newNotebookName.trim(),
      color: newNotebookColor,
    });
    setNewNotebookName('');
    setIsNotebookModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
            Notas
          </h1>
          <p className="text-xs text-text-3 mt-0.5">
            Cadernos, pensamentos e documentação em Markdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/export?notebook=all"
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-primary-border/60 text-xs font-semibold text-text-2 hover:text-primary hover:border-primary transition-all"
            title="Exportar todas as notas em .zip"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar .zip</span>
          </a>

          <button
            type="button"
            onClick={() => setIsNotebookModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-2 border border-primary-border/60 text-xs font-semibold text-text-2 hover:text-primary transition-all"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Novo Caderno</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNewNote}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-light shadow-md shadow-pink-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Nota</span>
          </button>
        </div>
      </div>

      {/* Notebooks Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setSelectedNotebookFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
            selectedNotebookFilter === 'all'
              ? 'bg-primary-soft border-primary text-primary shadow-sm shadow-pink-500/10'
              : 'bg-surface border-primary-border/60 text-text-2 hover:border-primary/40'
          }`}
        >
          <Book className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs font-bold truncate">Todos os cadernos</p>
            <span className="text-[10px] text-text-3">{notes.length} notas</span>
          </div>
        </button>

        {notebooks.map((nb) => {
          const isSelected = selectedNotebookFilter === nb.id;
          const count = notes.filter((n) => n.notebook_id === nb.id).length;

          return (
            <button
              key={nb.id}
              type="button"
              onClick={() => setSelectedNotebookFilter(nb.id)}
              className={`group relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
                isSelected
                  ? 'border-primary shadow-sm shadow-pink-500/10'
                  : 'bg-surface border-primary-border/60 hover:border-primary/40'
              }`}
              style={{
                backgroundColor: isSelected ? `${nb.color || '#EC4899'}15` : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-4 h-4 rounded-md shrink-0 shadow-sm"
                  style={{ backgroundColor: nb.color || '#EC4899' }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Excluir caderno "${nb.name}"?`)) {
                      deleteNotebook(nb.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-text-3 hover:text-rose-500 transition-opacity"
                  title="Excluir caderno"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div>
                <p className="text-xs font-bold text-text truncate">{nb.name}</p>
                <span className="text-[10px] text-text-3">{count} notas</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace: Left notes sidebar & Right TipTap editor */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left Notes List */}
        <div className="md:col-span-4 bg-surface rounded-3xl border border-primary-border/60 p-4 shadow-sm flex flex-col max-h-[700px]">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nas notas..."
              className="w-full bg-surface-2 border border-primary-border/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-text-3/60 focus:outline-none focus:border-primary"
            />
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {sortedNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-3">
                Nenhuma nota encontrada.
              </div>
            ) : (
              sortedNotes.map((note) => {
                const isSelected = currentNote?.id === note.id;
                const notebook = notebooks.find((nb) => nb.id === note.notebook_id);

                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-3 rounded-2xl cursor-pointer text-left transition-all ${
                      isSelected
                        ? 'bg-primary-soft border border-primary/30 text-primary shadow-sm shadow-pink-500/5'
                        : 'hover:bg-surface-2 text-text border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {notebook && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: notebook.color || '#EC4899' }}
                          />
                        )}
                        <h4 className="text-xs font-bold text-text truncate">
                          {note.title || 'Sem título'}
                        </h4>
                      </div>

                      {note.pinned && (
                        <Pin className="w-3 h-3 text-primary fill-primary/40 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-text-3 line-clamp-2">
                      {(note.content || '').replace(/<[^>]*>?/gm, '').trim() ||
                        'Nota vazia...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right TipTap Editor */}
        <div className="md:col-span-8 flex flex-col h-[700px]">
          {currentNote ? (
            <NoteEditor
              note={currentNote}
              notebooks={notebooks}
              onSave={updateNote}
              onDelete={deleteNote}
              onTogglePin={togglePinNote}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-3 bg-surface rounded-3xl border border-primary-border/60">
              <FileText className="w-12 h-12 text-primary/40 mb-3" />
              <p className="text-sm font-semibold text-text">Nenhuma nota selecionada</p>
              <p className="text-xs mt-1">Crie uma nova nota ou selecione da lista à esquerda.</p>
              <button
                type="button"
                onClick={handleCreateNewNote}
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors"
              >
                Criar nota agora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Notebook Modal */}
      <Modal
        isOpen={isNotebookModalOpen}
        onClose={() => setIsNotebookModalOpen(false)}
        title="Novo Caderno"
        description="Organize suas notas em grupos com cores exclusivas"
      >
        <form onSubmit={handleCreateNotebook} className="space-y-4">
          <Input
            label="Nome do caderno"
            placeholder="Ex.: Ideias de Produto, Estudos..."
            value={newNotebookName}
            onChange={(e) => setNewNotebookName(e.target.value)}
            required
            autoFocus
          />

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-2">Cor da capa</label>
            <div className="flex gap-2">
              {['#D63B6A', '#F07297', '#F0A0B5', '#A855F7', '#6366F1', '#10B981', '#F59E0B'].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewNotebookColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      newNotebookColor === c ? 'scale-125 border-text' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-primary-border/40">
            <Button variant="ghost" onClick={() => setIsNotebookModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar caderno</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
