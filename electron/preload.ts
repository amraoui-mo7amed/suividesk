import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  // Employees
  getEmployees: () => ipcRenderer.invoke('employees:getAll'),
  getEmployeeById: (id: number) => ipcRenderer.invoke('employees:getById', id),
  createEmployee: (data: any) => ipcRenderer.invoke('employees:create', data),
  updateEmployee: (id: number, data: any) => ipcRenderer.invoke('employees:update', id, data),
  deleteEmployee: (id: number) => ipcRenderer.invoke('employees:delete', id),

  // Tasks
  getTasksByEmployee: (employeeId: number) => ipcRenderer.invoke('tasks:getByEmployee', employeeId),
  getAllTasks: () => ipcRenderer.invoke('tasks:getAll'),
  createTask: (data: any) => ipcRenderer.invoke('tasks:create', data),
  updateTask: (id: number, data: any) => ipcRenderer.invoke('tasks:update', id, data),
  deleteTask: (id: number) => ipcRenderer.invoke('tasks:delete', id),

  // Files & Preview
  pickDocumentFile: () => ipcRenderer.invoke('files:pickDocument'),
  pickMultipleDocuments: () => ipcRenderer.invoke('files:pickMultipleDocuments'),
  getEmployeeFilePreview: (employeeId: number) => ipcRenderer.invoke('files:getEmployeePreview', employeeId),
  openEmployeeFileExternal: (employeeId: number) => ipcRenderer.invoke('files:openEmployeeExternal', employeeId),
  getTaskDocumentPreview: (docId: number) => ipcRenderer.invoke('files:getTaskDocumentPreview', docId),
  openTaskDocumentExternal: (docId: number) => ipcRenderer.invoke('files:openTaskDocumentExternal', docId),

  // Exports
  exportEmployeesPdf: (employees: any[], filterSummary?: string) =>
    ipcRenderer.invoke('export:employeesPdf', employees, filterSummary),
  exportEmployeesCsv: (employees: any[]) =>
    ipcRenderer.invoke('export:employeesCsv', employees),
  exportEmployeeTasksPdf: (employee: any, tasks: any[]) =>
    ipcRenderer.invoke('export:employeeTasksPdf', employee, tasks),
  exportEmployeeTasksCsv: (employee: any, tasks: any[]) =>
    ipcRenderer.invoke('export:employeeTasksCsv', employee, tasks),

  // App Utilities
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),

  // Database Backup / Restore
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  restoreDatabase: () => ipcRenderer.invoke('db:restore')
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
