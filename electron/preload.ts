import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  // Tasks
  getTasks: (filters?: any) => ipcRenderer.invoke('tasks:getAll', filters),
  getTaskById: (id: number) => ipcRenderer.invoke('tasks:getById', id),
  createTask: (data: any) => ipcRenderer.invoke('tasks:create', data),
  updateTask: (id: number, data: any) => ipcRenderer.invoke('tasks:update', id, data),
  updateTaskStatus: (id: number, status: string, notes?: string, motifBlocage?: string, progression?: number) =>
    ipcRenderer.invoke('tasks:updateStatus', id, status, notes, motifBlocage, progression),
  deleteTask: (id: number) => ipcRenderer.invoke('tasks:delete', id),

  // Employees
  getEmployees: () => ipcRenderer.invoke('employees:getAll'),
  getEmployeeById: (id: number) => ipcRenderer.invoke('employees:getById', id),
  createEmployee: (data: any) => ipcRenderer.invoke('employees:create', data),
  updateEmployee: (id: number, data: any) => ipcRenderer.invoke('employees:update', id, data),
  deleteEmployee: (id: number) => ipcRenderer.invoke('employees:delete', id),

  // Templates (Catalogue)
  getTemplates: (service?: string) => ipcRenderer.invoke('templates:getAll', service),
  createTemplate: (data: any) => ipcRenderer.invoke('templates:create', data),
  updateTemplate: (id: number, data: any) => ipcRenderer.invoke('templates:update', id, data),
  deleteTemplate: (id: number) => ipcRenderer.invoke('templates:delete', id),

  // Alerts & Dashboard
  getActiveAlerts: () => ipcRenderer.invoke('alerts:getActive'),
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
  triggerNotification: (title: string, body: string) => ipcRenderer.invoke('alerts:notify', title, body),

  // Export
  generatePdfReport: (options: any) => ipcRenderer.invoke('export:generatePdf', options),
  exportCsvReport: (tasks: any[]) => ipcRenderer.invoke('export:generateCsv', tasks),

  // App Utilities
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
