export type TaskPriority = 'Basse' | 'Moyenne' | 'Haute' | 'Urgente';

export type TaskStatus = 'En attente' | 'En cours' | 'Terminée' | 'Bloquée';

export type CNASService = 
  | 'Recouvrement'
  | 'Prestations'
  | 'Contrôle Médical'
  | 'Contentieux'
  | 'Informatique'
  | 'Ressources Humaines';

export interface Employee {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  service: CNASService | string;
  poste: string;
  avatar?: string;
  max_capacity: number;
  active_tasks_count?: number;
  j3_alerts_count?: number;
  overdue_count?: number;
  workload_percentage?: number;
  created_at?: string;
}

export interface TaskTemplate {
  id: number;
  code: string;
  titre: string;
  description?: string;
  service: CNASService | string;
  priorite_defaut: TaskPriority;
  duree_estimee_jours: number;
  instructions_type?: string;
  created_at?: string;
}

export interface TaskAssignment {
  id: number;
  template_id?: number | null;
  titre: string;
  description?: string;
  service: CNASService | string;
  priorite: TaskPriority;
  statut: TaskStatus;
  agent_id?: number | null;
  date_debut: string;
  date_echeance: string;
  date_completion?: string | null;
  reference_dossier?: string | null;
  progression: number;
  notes?: string;
  motif_blocage?: string | null;
  created_at?: string;
  updated_at?: string;
  // Computed join fields
  agent_nom?: string;
  agent_prenom?: string;
  agent_matricule?: string;
  agent_service?: string;
  agent_avatar?: string;
  // Alert fields
  alert_level?: 'overdue' | 'j-3' | 'normal' | 'done';
  diff_days?: number;
  delay_text?: string;
  date_echeance_fr?: string;
  date_debut_fr?: string;
}

export interface TaskFilters {
  search: string;
  statut: string;
  alerte: string;
  service: string;
  priorite: string;
  agent_id: string;
  periode: string;
  date_debut?: string;
  date_fin?: string;
}

export interface DashboardStats {
  kpis: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    blocked: number;
    approachingJ3: number;
    overdue: number;
    completionRate: number;
  };
  serviceBreakdown: Array<{
    service: string;
    total: number;
    active: number;
    completed: number;
  }>;
  agentWorkload: Array<{
    name: string;
    service: string;
    active: number;
    j3: number;
    overdue: number;
    capacity: number;
  }>;
}

declare global {
  interface Window {
    electronAPI?: {
      getTasks: (filters?: any) => Promise<TaskAssignment[]>;
      getTaskById: (id: number) => Promise<TaskAssignment | null>;
      createTask: (data: Partial<TaskAssignment>) => Promise<{ success: boolean; id?: number }>;
      updateTask: (id: number, data: Partial<TaskAssignment>) => Promise<{ success: boolean }>;
      updateTaskStatus: (id: number, status: TaskStatus, notes?: string, motifBlocage?: string, progression?: number) => Promise<{ success: boolean }>;
      deleteTask: (id: number) => Promise<{ success: boolean }>;

      getEmployees: () => Promise<Employee[]>;
      getEmployeeById: (id: number) => Promise<Employee | null>;
      createEmployee: (data: Partial<Employee>) => Promise<{ success: boolean; id?: number }>;
      updateEmployee: (id: number, data: Partial<Employee>) => Promise<{ success: boolean }>;
      deleteEmployee: (id: number) => Promise<{ success: boolean }>;

      getTemplates: (service?: string) => Promise<TaskTemplate[]>;
      createTemplate: (data: Partial<TaskTemplate>) => Promise<{ success: boolean; id?: number }>;
      updateTemplate: (id: number, data: Partial<TaskTemplate>) => Promise<{ success: boolean }>;
      deleteTemplate: (id: number) => Promise<{ success: boolean }>;

      getActiveAlerts: () => Promise<TaskAssignment[]>;
      getDashboardStats: () => Promise<DashboardStats>;
      triggerNotification: (title: string, body: string) => Promise<boolean>;

      generatePdfReport: (options: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      exportCsvReport: (tasks: any[]) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}
