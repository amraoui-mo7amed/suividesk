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
  getEmployeeFilePreview: (employeeId: number) => ipcRenderer.invoke('files:getEmployeePreview', employeeId),
  openEmployeeFileExternal: (employeeId: number) => ipcRenderer.invoke('files:openEmployeeExternal', employeeId),

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
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
