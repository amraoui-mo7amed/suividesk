import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Search,
  Download,
  FileDown,
  FileSpreadsheet,
  ChevronDown,
  FileText,
  ClipboardList,
  Loader2,
  User,
  Eye
} from 'lucide-react';
import { Employee, TaskItem } from '../../types';
import { DocumentPreviewWidget } from '../DocumentPreviewWidget';
import { TaskCard } from '../TaskCard';
import { CustomSelect } from '../CustomSelect';
import { PortalDropdown } from '../PortalDropdown';

interface EmployeeDetailsViewProps {
  employee: Employee;
  tasks: TaskItem[];
  onBack: () => void;
  onEditEmployee: (emp: Employee) => void;
  onAddTask: () => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  onExportTasksPdf: (employee: Employee, tasks: TaskItem[]) => void;
  onExportTasksCsv: (employee: Employee, tasks: TaskItem[]) => void;
  isExportingPdf: boolean;
  isExportingCsv: boolean;
}

type EmployeePageTab = 'tasks' | 'details' | 'preview';

const ETAT_FILTER_OPTIONS = [
  { value: 'Tous', label: 'État : Tous' },
  { value: 'traite', label: 'Traité' },
  { value: 'en_cours', label: 'En cours de traitement' },
  { value: 'non_traite', label: 'Non traité' },
  { value: 'non_specifie', label: 'Non spécifié' }
];

const PRIORITE_FILTER_OPTIONS = [
  { value: 'Toutes', label: 'Priorité : Toutes' },
  { value: 'Urgente', label: 'Urgente' },
  { value: 'Haute', label: 'Haute' },
  { value: 'Moyenne', label: 'Moyenne' },
  { value: 'Basse', label: 'Basse' }
];

export const EmployeeDetailsView: React.FC<EmployeeDetailsViewProps> = ({
  employee,
  tasks,
  onBack,
  onEditEmployee,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onExportTasksPdf,
  onExportTasksCsv,
  isExportingPdf,
  isExportingCsv
}) => {
  // Default tab is ALWAYS the Tasks tab ('tasks')
  const [activeTab, setActiveTab] = useState<EmployeePageTab>('tasks');
  const [taskSearch, setTaskSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState<string>('Tous');
  const [prioriteFilter, setPrioriteFilter] = useState<string>('Toutes');

  useEffect(() => {
    setActiveTab('tasks');
  }, [employee.id]);

  const displayName =
    [employee.civilite, employee.full_name || `Employé #${employee.id}`]
      .filter(Boolean)
      .join(' ') || `Employé #${employee.id}`;

  const getInitials = () => {
    const clean = (employee.full_name || '').trim();
    if (!clean) return '#';
    const words = clean.split(/\s+/);
    return words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : clean.slice(0, 2).toUpperCase();
  };

  const traiteCount = tasks.filter((t) => t.etat_courrier === 'traite').length;
  const enCoursCount = tasks.filter((t) => t.etat_courrier === 'en_cours').length;
  const nonTraiteCount = tasks.filter((t) => t.etat_courrier === 'non_traite').length;
  const totalTaskDocsCount = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.documents ? t.documents.length : 0), 0);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    return tasks.filter((t) => {
      if (etatFilter !== 'Tous') {
        if (etatFilter === 'non_specifie') {
          if (t.etat_courrier) return false;
        } else if (t.etat_courrier !== etatFilter) {
          return false;
        }
      }
      if (prioriteFilter !== 'Toutes' && t.priorite !== prioriteFilter) {
        return false;
      }
      if (q) {
        const hay = [
          t.titre,
          t.sujet,
          t.personne_cible,
          t.reference_dossier,
          t.wilaya,
          t.note,
          t.note_finale
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, taskSearch, etatFilter, prioriteFilter]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 text-slate-900">
      {/* Top Employee Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            title="Retour aux employés"
            aria-label="Retour aux employés"
            className="p-2.5 rounded-xl cnas-btn-secondary shadow-sm active:scale-95 cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>

          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#005A9E] to-[#0077C2] text-white font-black text-sm flex items-center justify-center shadow-md shadow-[#005A9E]/25 flex-shrink-0">
            {getInitials()}
          </div>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#003A6B] truncate">
              {displayName}
            </h1>
            <p className="text-xs font-semibold text-slate-700 truncate">
              Suivi des tâches, fiche collaborateur et aperçu du document associé
            </p>
          </div>
        </div>

        {/* Right: Export Employee's Tasks + Add Task Button */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <PortalDropdown
            widthClass="w-56"
            align="right"
            trigger={({ isOpen, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                disabled={isExportingPdf || isExportingCsv}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold cnas-btn-secondary shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isExportingPdf || isExportingCsv ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#005A9E]" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[#005A9E]" />
                )}
                <span>Exporter Tâches</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#005A9E] transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
          >
            {({ close }) => (
              <div className="p-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onExportTasksPdf(employee, filteredTasks);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold hover:bg-[#E6F2FC] cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-rose-600" />
                  <span className="text-[#003A6B] font-bold">Exporter en PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onExportTasksCsv(employee, filteredTasks);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold hover:bg-[#E6F2FC] cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#15803D]" />
                  <span className="text-[#003A6B] font-bold">Exporter en CSV</span>
                </button>
              </div>
            )}
          </PortalDropdown>

          <button
            type="button"
            onClick={onAddTask}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Tâche</span>
          </button>
        </div>
      </div>

      {/* Tabbed Navigation Bar (Default Tab = Tasks) */}
      <div className="p-1.5 rounded-2xl cnas-panel flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-[#005A9E] text-white shadow-md shadow-[#005A9E]/25'
              : 'text-[#003A6B] hover:bg-[#E6F2FC]'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Tâches Assignées</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'tasks'
                ? 'bg-white text-[#005A9E]'
                : 'bg-[#DCEBFA] text-[#003A6B]'
            }`}
          >
            {tasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'details'
              ? 'bg-[#005A9E] text-white shadow-md shadow-[#005A9E]/25'
              : 'text-[#003A6B] hover:bg-[#E6F2FC]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Détails de l&apos;Employé</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-[#005A9E] text-white shadow-md shadow-[#005A9E]/25'
              : 'text-[#003A6B] hover:bg-[#E6F2FC]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Aperçu des Documents</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'preview'
                ? 'bg-white text-[#005A9E]'
                : 'bg-[#DCEBFA] text-[#003A6B]'
            }`}
          >
            {totalTaskDocsCount}
          </span>
        </button>
      </div>

      {/* TAB 1 (DEFAULT): TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 cnas-panel">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-4.5 h-4.5 text-[#005A9E]" />
              <h2 className="text-sm font-black text-[#003A6B]">
                Liste des Tâches ({filteredTasks.length} / {tasks.length})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 overflow-visible">
              {/* Search Tasks */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#005A9E]" />
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Rechercher tâche, référence, wilaya..."
                  className="w-full pl-8.5 pr-3 py-2.5 rounded-xl text-xs font-semibold cnas-input"
                />
              </div>

              {/* Filter by État de courrier (Portal Overflowed) */}
              <div className="w-48">
                <CustomSelect
                  options={ETAT_FILTER_OPTIONS}
                  value={etatFilter}
                  onChange={(val) => setEtatFilter(val)}
                />
              </div>

              {/* Filter by Priorité (Portal Overflowed) */}
              <div className="w-44">
                <CustomSelect
                  options={PRIORITE_FILTER_OPTIONS}
                  value={prioriteFilter}
                  onChange={(val) => setPrioriteFilter(val)}
                />
              </div>
            </div>
          </div>

          {/* Tasks Cards Grid */}
          {filteredTasks.length === 0 ? (
            <div className="rounded-3xl p-10 text-center cnas-panel">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center mb-3">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-[#003A6B]">
                {tasks.length === 0
                  ? 'Aucune tâche assignée à cet employé'
                  : 'Aucune tâche ne correspond aux filtres sélectionnés'}
              </h3>
              <p className="text-xs font-medium text-slate-700 mt-1 mb-4">
                Cliquez sur « Ajouter une Tâche » pour enregistrer un courrier ou un dossier à traiter.
              </p>
              <button
                type="button"
                onClick={onAddTask}
                className="px-4 py-2 rounded-xl text-xs font-bold cnas-btn-primary cursor-pointer"
              >
                + Ajouter une Tâche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMPLOYEE DETAILS TAB */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Employee Profile Card */}
          <div className="lg:col-span-6 rounded-2xl p-6 space-y-5 cnas-panel">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#005A9E] to-[#0077C2] text-white font-black text-xl flex items-center justify-center shadow-lg shadow-[#005A9E]/25 flex-shrink-0">
                  {getInitials()}
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#DCEBFA] text-[#003A6B] border border-[#93C0E8]">
                    {employee.civilite || 'Civilité non spécifiée'}
                  </span>
                  <h2 className="text-lg font-black text-[#003A6B] mt-1 break-words">
                    {employee.full_name || `Employé sans nom #${employee.id}`}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEditEmployee(employee)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 flex-shrink-0 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#C6DDF2]">
              <div className="p-3.5 rounded-xl bg-[#F2F8FE] border border-[#9CC0E2]">
                <div className="text-[10px] font-extrabold uppercase text-[#1E3A5F]">Civilité</div>
                <div className="text-xs font-black text-[#003A6B] mt-0.5">
                  {employee.civilite || 'Non renseignée'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F2F8FE] border border-[#9CC0E2]">
                <div className="text-[10px] font-extrabold uppercase text-[#1E3A5F]">
                  Nom Complet
                </div>
                <div className="text-xs font-black text-[#003A6B] mt-0.5">
                  {employee.full_name || 'Non renseigné'}
                </div>
              </div>
            </div>

            {/* Document Info Summary with direct jump to Preview Tab */}
            <div className="p-4 rounded-xl border bg-[#EAF4FC] border-[#9CC0E2] flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#005A9E] text-white flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase text-[#1E3A5F]">
                    Documents des Tâches
                  </div>
                  <div className="text-xs font-black text-[#003A6B] truncate">
                    {totalTaskDocsCount > 0
                      ? `${totalTaskDocsCount} document(s) rattaché(s) aux tâches`
                      : 'Aucun document joint aux tâches'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cnas-btn-secondary flex-shrink-0 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Voir les documents</span>
              </button>
            </div>
          </div>

          {/* Employee Tasks KPI Summary Card */}
          <div className="lg:col-span-6 rounded-2xl p-6 space-y-4 cnas-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#003A6B]">
                Bilan des Tâches & Courriers
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-bold text-[#005A9E] hover:underline cursor-pointer"
              >
                Ouvrir l&apos;onglet Tâches →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border bg-[#F2F8FE] border-[#9CC0E2]">
                <div className="text-2xl font-black text-[#003A6B]">{tasks.length}</div>
                <div className="text-xs font-extrabold text-[#1E3A5F] mt-0.5">Total Tâches</div>
              </div>

              <div className="p-4 rounded-2xl border bg-[#DCFCE7] border-[#86EFAC]">
                <div className="text-2xl font-black text-[#14532D]">{traiteCount}</div>
                <div className="text-xs font-extrabold text-[#166534] mt-0.5">Courriers Traités</div>
              </div>

              <div className="p-4 rounded-2xl border bg-[#DBEAFE] border-[#93C5FD]">
                <div className="text-2xl font-black text-[#003A6B]">{enCoursCount}</div>
                <div className="text-xs font-extrabold text-[#004B87] mt-0.5">En Cours de Traitement</div>
              </div>

              <div className="p-4 rounded-2xl border bg-[#FFE4E6] border-[#FDA4AF]">
                <div className="text-2xl font-black text-[#881337]">{nonTraiteCount}</div>
                <div className="text-xs font-extrabold text-[#9F1239] mt-0.5">Non Traités</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENT PREVIEW TAB */}
      {activeTab === 'preview' && (
        <DocumentPreviewWidget
          employee={employee}
          tasks={tasks}
          onAddTask={onAddTask}
          onEditTask={onEditTask}
        />
      )}
    </div>
  );
};
