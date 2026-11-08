import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../services/api';

export function useTasks() {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: api.getTasks,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.getCategories,
  });

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects,
    queryFn: api.getProjects,
  });

  const createTaskMutation = useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ id, data }) => api.completeTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeSummary });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const reopenTaskMutation = useMutation({
    mutationFn: api.reopenTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const postponeTaskMutation = useMutation({
    mutationFn: api.postponeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    categories: categoriesQuery.data || [],
    projects: projectsQuery.data || [],
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    completeTask: completeTaskMutation.mutateAsync,
    reopenTask: reopenTaskMutation.mutateAsync,
    postponeTask: postponeTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
  };
}

