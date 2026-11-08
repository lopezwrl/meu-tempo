import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../services/api';

export function useNotes() {
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: queryKeys.notes,
    queryFn: api.getNotes,
  });

  const notebooksQuery = useQuery({
    queryKey: queryKeys.notebooks,
    queryFn: api.getNotebooks,
  });

  const createNoteMutation = useMutation({
    mutationFn: api.createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
      queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
      queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
    },
  });

  const createNotebookMutation = useMutation({
    mutationFn: api.createNotebook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
    },
  });

  const updateNotebookMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateNotebook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
    },
  });

  const deleteNotebookMutation = useMutation({
    mutationFn: api.deleteNotebook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
    },
  });

  const togglePinNote = async (note) => {
    return updateNoteMutation.mutateAsync({
      id: note.id,
      data: { pinned: !note.pinned },
    });
  };

  return {
    notes: notesQuery.data || [],
    notebooks: notebooksQuery.data || [],
    isLoading: notesQuery.isLoading || notebooksQuery.isLoading,
    createNote: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    togglePinNote,
    createNotebook: createNotebookMutation.mutateAsync,
    updateNotebook: updateNotebookMutation.mutateAsync,
    deleteNotebook: deleteNotebookMutation.mutateAsync,
  };
}

