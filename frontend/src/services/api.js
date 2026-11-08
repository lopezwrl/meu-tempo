import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const queryKeys = {
  tasks: ['tasks'],
  taskExtras: (id) => ['tasks', id, 'extras'],
  taskTimer: (id) => ['tasks', id, 'timer'],
  activeTimer: ['timer', 'active'],
  notes: ['notes'],
  notebooks: ['notebooks'],
  categories: ['categories'],
  projects: ['projects'],
  achievements: ['achievements'],
  timeSummary: ['reports', 'time'],
  hoursPerDay: (days) => ['reports', 'hoursPerDay', days],
  hoursPerCategory: ['reports', 'hoursPerCategory'],
  hoursPerProject: ['reports', 'hoursPerProject'],
  estimatedVsReal: ['reports', 'estimatedVsReal'],
  tasksPerWeek: (weeks) => ['reports', 'tasksPerWeek', weeks],
  productivityByHour: ['reports', 'productivityByHour'],
  precisionTrend: (weeks) => ['reports', 'precisionTrend', weeks],
  weekSummary: (date) => ['reports', 'weekSummary', date],
  planningDay: (date) => ['planning', 'day', date],
  planningWeek: (start) => ['planning', 'week', start],
  schedule: ['schedule'],
  commitments: ['commitments'],
  user: ['user'],
};

export const api = {
  // Tasks
  getTasks: async () => (await apiClient.get('/tasks')).data,
  createTask: async (data) => (await apiClient.post('/tasks', data)).data,
  updateTask: async (id, data) => (await apiClient.put(`/tasks/${id}`, data)).data,
  deleteTask: async (id) => (await apiClient.delete(`/tasks/${id}`)).data,
  completeTask: async (id, data) => (await apiClient.post(`/tasks/${id}/complete`, data || {})).data,
  reopenTask: async (id) => (await apiClient.post(`/tasks/${id}/reopen`)).data,
  postponeTask: async (id) => (await apiClient.post(`/tasks/${id}/postpone`)).data,
  getEstimate: async (name, category_id) =>
    (await apiClient.get('/tasks/estimate', { params: { name, category_id } })).data,
  
  // Timer
  startTaskTimer: async (id, force = false) => (await apiClient.post(`/tasks/${id}/start`, { force })).data,
  pauseTaskTimer: async (id) => (await apiClient.post(`/tasks/${id}/pause`)).data,
  finishTaskTimer: async (id, data) => (await apiClient.post(`/tasks/${id}/finish`, data || {})).data,
  getTaskTimer: async (id) => (await apiClient.get(`/tasks/${id}/timer`)).data,
  getActiveTimer: async () => (await apiClient.get('/timer/active')).data,
  respondToIdle: async (data) => (await apiClient.post('/timer/idle', data)).data,

  // Subtasks & Extras
  getTaskExtras: async (taskId) => (await apiClient.get(`/tasks/${taskId}/extras`)).data,
  createSubtask: async (taskId, title) => (await apiClient.post(`/tasks/${taskId}/subtasks`, { title })).data,
  updateSubtask: async (subId, data) => (await apiClient.put(`/subtasks/${subId}`, data)).data,
  deleteSubtask: async (subId) => (await apiClient.delete(`/subtasks/${subId}`)).data,

  // Notes
  getNotes: async () => (await apiClient.get('/notes')).data,
  createNote: async (data) => (await apiClient.post('/notes', data)).data,
  updateNote: async (id, data) => (await apiClient.put(`/notes/${id}`, data)).data,
  deleteNote: async (id) => (await apiClient.delete(`/notes/${id}`)).data,
  getNotebooks: async () => (await apiClient.get('/notebooks')).data,
  createNotebook: async (data) => (await apiClient.post('/notebooks', data)).data,
  updateNotebook: async (id, data) => (await apiClient.put(`/notebooks/${id}`, data)).data,
  deleteNotebook: async (id) => (await apiClient.delete(`/notebooks/${id}`)).data,

  // Categories & Projects
  getCategories: async () => (await apiClient.get('/categories')).data,
  createCategory: async (data) => (await apiClient.post('/categories', data)).data,
  deleteCategory: async (id) => (await apiClient.delete(`/categories/${id}`)).data,
  getProjects: async () => (await apiClient.get('/projects')).data,
  createProject: async (data) => (await apiClient.post('/projects', data)).data,
  updateProject: async (id, data) => (await apiClient.put(`/projects/${id}`, data)).data,
  deleteProject: async (id) => (await apiClient.delete(`/projects/${id}`)).data,

  // Reports
  getTimeEntries: async (params) => (await apiClient.get('/time-entries', { params })).data,
  getTimeSummary: async () => (await apiClient.get('/reports/time')).data,
  getHoursPerDay: async (days = 30) => (await apiClient.get('/reports/charts/hours-per-day', { params: { days } })).data,
  getHoursPerCategory: async () => (await apiClient.get('/reports/charts/hours-per-category')).data,
  getHoursPerProject: async () => (await apiClient.get('/reports/charts/hours-per-project')).data,
  getEstimatedVsReal: async () => (await apiClient.get('/reports/charts/estimated-vs-real')).data,
  getTasksPerWeek: async (weeks = 8) => (await apiClient.get('/reports/charts/tasks-per-week', { params: { weeks } })).data,
  getProductivityByHour: async () => (await apiClient.get('/reports/productivity-by-hour')).data,
  getPrecisionTrend: async (weeks = 8) => (await apiClient.get('/reports/precision-trend', { params: { weeks } })).data,
  getWeekSummary: async (date) => (await apiClient.get('/reports/week-summary', { params: { date } })).data,
  getAchievements: async () => (await apiClient.get('/achievements')).data,

  // Planning
  getPlanningDay: async (date) => (await apiClient.get('/planning/day', { params: { date } })).data,
  organizeDay: async (data) => (await apiClient.post('/planning/day/organize', data)).data,
  getPlanningWeek: async (start) => (await apiClient.get('/planning/week', { params: { start } })).data,
  balanceWeek: async (data) => (await apiClient.post('/planning/week/balance', data)).data,

  // Settings & User
  getUser: async () => (await apiClient.get('/user')).data,
  updateUser: async (data) => (await apiClient.put('/user', data)).data,
  getSchedule: async () => (await apiClient.get('/schedule')).data,
  updateSchedule: async (data) => (await apiClient.put('/schedule', data)).data,
  getCommitments: async () => (await apiClient.get('/commitments')).data,
  createCommitment: async (data) => (await apiClient.post('/commitments', data)).data,
  deleteCommitment: async (id) => (await apiClient.delete(`/commitments/${id}`)).data,
  setIdleMinutes: async (minutes) => (await apiClient.post('/settings/idle', { minutes })).data,

  // Backup & Restore
  restoreBackup: async (payload) => (await apiClient.post('/backup/restore', payload)).data,
};

