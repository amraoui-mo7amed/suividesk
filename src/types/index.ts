export type Civilite = 'Monsieur' | 'Madame' | '';

export type EtatCourrier = 'traite' | 'non_traite' | 'en_cours' | '';

export type TaskPriority = 'Basse' | 'Moyenne' | 'Haute' | 'Urgente' | '';

export interface Employee {
  id: number;
  civilite: Civilite;
  full_name: string;
  file_name?: string;
  file_path?: string;
  file_type?: string;
  created_at?: string;
  updated_at?: string;
  // Computed task summary counts
  tasks_count?: number;
  traite_count?: number;
  en_cours_count?: number;
  non_traite_count?: number;
}

export interface EmployeeInput {
  civilite?: Civilite;
  full_name?: string;
  file_data?: {
    name: string;
    base64?: string;
    sourcePath?: string;
  } | null;
  remove_file?: boolean;
}

export interface TaskDocument {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  created_at: string;
}

export interface TaskAttachmentInput {
  name: string;
  base64?: string;
  sourcePath?: string;
  size?: number;
}

export interface TaskItem {
  id: number;
  agent_id: number | null;
  titre: string; // Task Name
  sujet: string; // Task Subject
  personne_cible: string; // Target person (to whom this task is going to be done)
  reference_dossier: string; // Reference
  wilaya: string; // Wilaya
  priorite: TaskPriority | string; // Priority
  date_courrier: string; // date de courrier
  date_distribution: string; // date de distribution de courrier
  date_debut: string; // date de debut
  date_finale: string; // date de finale
  etat_courrier: EtatCourrier; // treate | non-treate | en cours de treatement | ''
  note: string; // la note
  note_finale: string; // la note finale
  created_at?: string;
  updated_at?: string;
  // Computed fields
  duree_traitement_jours?: number | null;
  agent_full_name?: string;
  agent_civilite?: string;
  documents?: TaskDocument[];
}

export type EmployeeSortOption =
  | 'alpha-asc'
  | 'alpha-desc'
  | 'tasks-desc'
  | 'tasks-asc'
  | 'recent';

export interface EmployeeFilters {
  search: string;
  civilite: 'Tous' | 'Monsieur' | 'Madame' | 'Non spécifié';
  hasFile: 'Tous' | 'with-file' | 'without-file';
  taskState: 'Tous' | 'with-tasks' | 'without-tasks' | 'has-non-traite' | 'has-en-cours' | 'has-traite';
  sortBy: EmployeeSortOption;
}

export interface FilePreviewResult {
  success: boolean;
  kind?: 'pdf' | 'docx' | 'excel' | 'image' | 'unsupported' | 'empty';
  fileName?: string;
  filePath?: string;
  createdAt?: string;
  fileSize?: number;
  base64?: string;
  html?: string;
  sheets?: Array<{
    name: string;
    rows: string[][];
  }>;
  error?: string;
}

export const ALGERIA_WILAYAS: string[] = [
  '01 - Adrar',
  '02 - Chlef',
  '03 - Laghouat',
  '04 - Oum El Bouaghi',
  '05 - Batna',
  '06 - Béjaïa',
  '07 - Biskra',
  '08 - Béchar',
  '09 - Blida',
  '10 - Bouira',
  '11 - Tamanrasset',
  '12 - Tébessa',
  '13 - Tlemcen',
  '14 - Tiaret',
  '15 - Tizi Ouzou',
  '16 - Alger',
  '17 - Djelfa',
  '18 - Jijel',
  '19 - Sétif',
  '20 - Saïda',
  '21 - Skikda',
  '22 - Sidi Bel Abbès',
  '23 - Annaba',
  '24 - Guelma',
  '25 - Constantine',
  '26 - Médéa',
  '27 - Mostaganem',
  '28 - M\'Sila',
  '29 - Mascara',
  '30 - Ouargla',
  '31 - Oran',
  '32 - El Bayadh',
  '33 - Illizi',
  '34 - Bordj Bou Arréridj',
  '35 - Boumerdès',
  '36 - El Tarf',
  '37 - Tindouf',
  '38 - Tissemsilt',
  '39 - El Oued',
  '40 - Khenchela',
  '41 - Souk Ahras',
  '42 - Tipaza',
  '43 - Mila',
  '44 - Aïn Defla',
  '45 - Naâma',
  '46 - Aïn Témouchent',
  '47 - Ghardaïa',
  '48 - Relizane',
  '49 - Timimoun',
  '50 - Bordj Badji Mokhtar',
  '51 - Ouled Djellal',
  '52 - Béni Abbès',
  '53 - In Salah',
  '54 - In Guezzam',
  '55 - Touggourt',
  '56 - Djanet',
  '57 - El M\'Ghair',
  '58 - El Meniaa',
  '59 - Aflou',
  '60 - Barika',
  '61 - El Kantara',
  '62 - Bir El Ater',
  '63 - El Aricha',
  '64 - Ksar Chellala',
  '65 - Aïn Oussara',
  '66 - Messaad',
  '67 - Ksar El Boukhari',
  '68 - Bou Saâda',
  '69 - El Abiodh Sidi Cheikh'
];

export function computeTreatmentDays(dateDebut?: string, dateFinale?: string): number | null {
  if (!dateDebut || !dateFinale) return null;
  const d1Parts = dateDebut.trim().split('-').map(Number);
  const d2Parts = dateFinale.trim().split('-').map(Number);
  if (d1Parts.length !== 3 || d2Parts.length !== 3) return null;
  if (d1Parts.some(isNaN) || d2Parts.some(isNaN)) return null;

  const startUtc = Date.UTC(d1Parts[0], d1Parts[1] - 1, d1Parts[2]);
  const endUtc = Date.UTC(d2Parts[0], d2Parts[1] - 1, d2Parts[2]);
  return Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24));
}

export function formatDateFr(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return '—';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getEtatCourrierLabel(etat?: EtatCourrier | string): string {
  switch (etat) {
    case 'traite':
      return 'Traité';
    case 'non_traite':
      return 'Non traité';
    case 'en_cours':
      return 'En cours de traitement';
    default:
      return 'Non spécifié';
  }
}

declare global {
  interface Window {
    electronAPI?: {
      // Employees
      getEmployees: () => Promise<Employee[]>;
      getEmployeeById: (id: number) => Promise<Employee | null>;
      createEmployee: (data: EmployeeInput) => Promise<{ success: boolean; id?: number; error?: string }>;
      updateEmployee: (id: number, data: EmployeeInput) => Promise<{ success: boolean; error?: string }>;
      deleteEmployee: (id: number) => Promise<{ success: boolean; error?: string }>;

      // Tasks
      getTasksByEmployee: (employeeId: number) => Promise<TaskItem[]>;
      getAllTasks: () => Promise<TaskItem[]>;
      createTask: (data: Partial<TaskItem> & { attachments?: TaskAttachmentInput[] }) => Promise<{ success: boolean; id?: number; error?: string }>;
      updateTask: (id: number, data: Partial<TaskItem> & { attachments?: TaskAttachmentInput[]; removedDocIds?: number[] }) => Promise<{ success: boolean; error?: string }>;
      deleteTask: (id: number) => Promise<{ success: boolean; error?: string }>;

      // Files & Preview
      pickDocumentFile: () => Promise<{ canceled: boolean; name?: string; sourcePath?: string }>;
      pickMultipleDocuments: () => Promise<{ canceled: boolean; files: Array<{ name: string; sourcePath: string; size: number }> }>;
      getEmployeeFilePreview: (employeeId: number) => Promise<FilePreviewResult>;
      openEmployeeFileExternal: (employeeId: number) => Promise<{ success: boolean; error?: string }>;
      getTaskDocumentPreview: (docId: number) => Promise<FilePreviewResult>;
      openTaskDocumentExternal: (docId: number) => Promise<{ success: boolean; error?: string }>;

      // Exports (Employees or Tasks -> PDF / CSV)
      exportEmployeesPdf: (employees: Employee[], filterSummary?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      exportEmployeesCsv: (employees: Employee[]) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      exportEmployeeTasksPdf: (employee: Employee, tasks: TaskItem[]) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      exportEmployeeTasksCsv: (employee: Employee, tasks: TaskItem[]) => Promise<{ success: boolean; filePath?: string; error?: string }>;

      openExternal: (url: string) => Promise<void>;
      backupDatabase: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
      restoreDatabase: () => Promise<{ success: boolean; error?: string }>;
    };
  }
}
