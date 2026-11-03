import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  FileDown,
  FileSpreadsheet,
  RotateCcw,
  ChevronDown,
  Loader2,
  Users,
  Briefcase,
  Pencil,
  Eye,
  Trash2,
  FileText
} from 'lucide-react';
import {
  Employee,
  EmployeeFilters,
  EmployeeSortOption
} from '../../types';
import { CustomSelect } from '../CustomSelect';
import { PortalDropdown } from '../PortalDropdown';

interface TaskTrackingViewProps {
  employees: Employee[];
  onSelectEmployee: (employeeId: number) => void;
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
  onExportEmployeesPdf: (filteredEmployees: Employee[], filterSummary: string) => void;
  onExportEmployeesCsv: (filteredEmployees: Employee[]) => void;
  isExportingPdf: boolean;
  isExportingCsv: boolean;
}

const defaultEmployeeFilters: EmployeeFilters = {
  search: '',
  civilite: 'Tous',
  hasFile: 'Tous',
  taskState: 'Tous',
  sortBy: 'alpha-asc' // Default MUST be Alphabetical
};

const SORT_OPTIONS = [
  { value: 'alpha-asc', label: 'Tri : Alphabétique (A → Z)' },
  { value: 'alpha-desc', label: 'Tri : Alphabétique (Z → A)' },
  { value: 'tasks-desc', label: 'Tri : Plus de tâches' },
  { value: 'tasks-asc', label: 'Tri : Moins de tâches' },
  { value: 'recent', label: 'Tri : Plus récent' }
];

const FILTER_CIVILITE_OPTIONS = [
  { value: 'Tous', label: 'Toutes' },
  { value: 'Monsieur', label: 'Monsieur' },
  { value: 'Madame', label: 'Madame' },
  { value: 'Non spécifié', label: 'Non spécifié' }
];

const FILTER_TASK_STATE_OPTIONS = [
  { value: 'Tous', label: 'Tous les collaborateurs' },
  { value: 'with-tasks', label: 'Ayant des tâches' },
  { value: 'without-tasks', label: 'Sans aucune tâche' },
  { value: 'has-non-traite', label: 'Ayant des courriers non traités' },
  { value: 'has-en-cours', label: 'Ayant des courriers en cours' },
  { value: 'has-traite', label: 'Ayant des courriers traités' }
];

export const TaskTrackingView: React.FC<TaskTrackingViewProps> = ({
  employees,
  onSelectEmployee,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onExportEmployeesPdf,
  onExportEmployeesCsv,
  isExportingPdf,
  isExportingCsv
}) => {
  const [filters, setFilters] = useState<EmployeeFilters>(defaultEmployeeFilters);

  const activeFilterCount = [
    filters.civilite !== 'Tous',
    filters.taskState !== 'Tous'
  ].filter(Boolean).length;

  const buildFilterSummary = () => {
    const parts: string[] = [];
    if (filters.search) parts.push(`Recherche: "${filters.search}"`);
    if (filters.civilite !== 'Tous') parts.push(`Civilité: ${filters.civilite}`);
    if (filters.taskState !== 'Tous') {
      const match = FILTER_TASK_STATE_OPTIONS.find((o) => o.value === filters.taskState);
      if (match) parts.push(`État: ${match.label}`);
    }
    return parts.length > 0 ? parts.join(' | ') : 'Tous les collaborateurs';
  };

  const getInitials = (emp: Employee) => {
    const clean = (emp.full_name || '').trim();
    if (!clean) return '#';
    const words = clean.split(/\s+/);
    return words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : clean.slice(0, 2).toUpperCase();
  };

  // Filtered & Sorted Employees (Alphabetical by default)
  const filteredAndSortedEmployees = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    const list = employees.filter((emp) => {
      if (q) {
        const nameMatch = (emp.full_name || '').toLowerCase().includes(q);
        const civMatch = (emp.civilite || '').toLowerCase().includes(q);
        if (!nameMatch && !civMatch) return false;
      }

      if (filters.civilite !== 'Tous') {
        if (filters.civilite === 'Non spécifié') {
          if (emp.civilite && emp.civilite.trim() !== '') return false;
        } else if (emp.civilite !== filters.civilite) {
          return false;
        }
      }

      const total = emp.tasks_count || 0;
      if (filters.taskState === 'with-tasks' && total === 0) return false;
      if (filters.taskState === 'without-tasks' && total > 0) return false;
      if (filters.taskState === 'has-non-traite' && (emp.non_traite_count || 0) === 0) return false;
      if (filters.taskState === 'has-en-cours' && (emp.en_cours_count || 0) === 0) return false;
      if (filters.taskState === 'has-traite' && (emp.traite_count || 0) === 0) return false;

      return true;
    });

    return [...list].sort((a, b) => {
      const nameA = (a.full_name || '').trim();
      const nameB = (b.full_name || '').trim();

      switch (filters.sortBy) {
        case 'alpha-asc': {
          if (!nameA && nameB) return 1;
          if (nameA && !nameB) return -1;
          return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' }) || a.id - b.id;
        }
        case 'alpha-desc': {
          if (!nameA && nameB) return 1;
          if (nameA && !nameB) return -1;
          return nameB.localeCompare(nameA, 'fr', { sensitivity: 'base' }) || b.id - a.id;
        }
        case 'tasks-desc':
          return (b.tasks_count || 0) - (a.tasks_count || 0) || a.id - b.id;
        case 'tasks-asc':
          return (a.tasks_count || 0) - (b.tasks_count || 0) || a.id - b.id;
        case 'recent':
        default:
          return b.id - a.id;
      }
    });
  }, [employees, filters]);

  // If no employees exist at all: prompt to add first employee
  if (employees.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#003A6B]">
              Tableau de Suivi
            </h1>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              0 collaborateur enregistré
            </p>
          </div>
        </div>

        <div className="rounded-3xl p-12 text-center cnas-panel my-8 max-w-2xl mx-auto shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center mb-4 shadow-sm">
            <Users className="w-8 h-8 text-[#005A9E]" />
          </div>
          <h3 className="text-lg font-black text-[#003A6B]">
            Aucun employé enregistré
          </h3>
          <p className="text-xs font-medium text-slate-700 mt-1.5 max-w-md mx-auto leading-relaxed">
            Commencez par ajouter un collaborateur pour gérer ses documents et suivre ses tâches.
            Ouvrez ensuite sa fiche pour lui assigner des tâches.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={onAddEmployee}
              className="px-5 py-2.5 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 cursor-pointer inline-flex items-center space-x-2 shadow-md shadow-[#005A9E]/25"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajouter un Employé</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#003A6B]">
            Tableau de Suivi des Collaborateurs
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            {filteredAndSortedEmployees.length} collaborateur(s) affiché(s) sur {employees.length} au total • Cliquez sur un collaborateur pour consulter et ajouter ses tâches
          </p>
        </div>

        <button
          type="button"
          onClick={onAddEmployee}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 cursor-pointer shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter Employé</span>
        </button>
      </div>

      {/* Toolbar: Search, Filters, Sort, Export */}
      <div className="p-3.5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 relative z-20 cnas-panel">
        {/* Search */}
        <div className="relative flex-1 min-w-0 md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#005A9E]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Rechercher par nom complet, civilité..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl text-xs font-semibold cnas-input"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 hover:text-rose-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Actions: Filter, Sort, Export */}
        <div className="flex flex-wrap items-center gap-2.5 overflow-visible">
          {/* Filter Dropdown */}
          <PortalDropdown
            widthClass="w-72"
            align="right"
            trigger={({ isOpen, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  activeFilterCount > 0
                    ? 'cnas-btn-primary shadow-sm'
                    : 'cnas-btn-secondary'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtres</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-[#005A9E]">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          >
            {() => (
              <div className="p-4 space-y-3.5 overflow-visible">
                <div className="flex items-center justify-between pb-2 border-b border-[#C6DDF2]">
                  <span className="text-xs font-black text-[#003A6B]">
                    Filtres des Collaborateurs
                  </span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          civilite: 'Tous',
                          taskState: 'Tous'
                        }))
                      }
                      className="text-[11px] font-bold text-rose-700 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Réinitialiser</span>
                    </button>
                  )}
                </div>

                <CustomSelect
                  label="Civilité"
                  options={FILTER_CIVILITE_OPTIONS}
                  value={filters.civilite}
                  onChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      civilite: val as EmployeeFilters['civilite']
                    }))
                  }
                />

                <CustomSelect
                  label="État des Tâches"
                  options={FILTER_TASK_STATE_OPTIONS}
                  value={filters.taskState}
                  onChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      taskState: val as EmployeeFilters['taskState']
                    }))
                  }
                />
              </div>
            )}
          </PortalDropdown>

          {/* Sort Dropdown (Default Alphabetical A-Z) */}
          <div className="w-60">
            <CustomSelect
              options={SORT_OPTIONS}
              value={filters.sortBy}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, sortBy: val as EmployeeSortOption }))
              }
              icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Export Dropdown (PDF / CSV) */}
          <PortalDropdown
            widthClass="w-60"
            align="right"
            trigger={({ isOpen, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                disabled={isExportingPdf || isExportingCsv}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold cnas-btn-secondary disabled:opacity-50 cursor-pointer"
              >
                {isExportingPdf || isExportingCsv ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#005A9E]" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[#005A9E]" />
                )}
                <span>Exporter</span>
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
                    onExportEmployeesPdf(filteredAndSortedEmployees, buildFilterSummary());
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold hover:bg-[#E6F2FC] transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FFE4E6] border border-[#FDA4AF] text-[#9F1239] flex items-center justify-center flex-shrink-0">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#003A6B]">Exporter en PDF</div>
                    <div className="text-[10px] font-medium text-slate-600">
                      Rapport officiel CNAS
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    close();
                    onExportEmployeesCsv(filteredAndSortedEmployees);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold hover:bg-[#E6F2FC] transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] border border-[#86EFAC] text-[#14532D] flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#003A6B]">Exporter en CSV</div>
                    <div className="text-[10px] font-medium text-slate-600">
                      Compatible Microsoft Excel
                    </div>
                  </div>
                </button>
              </div>
            )}
          </PortalDropdown>
        </div>
      </div>

      {/* Cards Grid of Employees (as required by workflow.md: cards not a table) */}
      {filteredAndSortedEmployees.length === 0 ? (
        <div className="rounded-3xl p-12 text-center cnas-panel">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-[#003A6B]">
            Aucun collaborateur ne correspond à votre recherche
          </h3>
          <p className="text-xs font-medium text-slate-700 mt-1 max-w-md mx-auto">
            Modifiez les filtres ou les termes de recherche ci-dessus.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setFilters(defaultEmployeeFilters)}
              className="px-4 py-2 rounded-xl text-xs font-bold cnas-btn-secondary cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedEmployees.map((emp) => {
            const totalTasks = emp.tasks_count || 0;
            const traiteCount = emp.traite_count || 0;
            const enCoursCount = emp.en_cours_count || 0;
            const nonTraiteCount = emp.non_traite_count || 0;

            return (
              <div
                key={emp.id}
                onDoubleClick={() => onSelectEmployee(emp.id)}
                className="rounded-2xl p-5 flex flex-col justify-between cnas-card transition-transform hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Employee Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#005A9E] to-[#0077C2] text-white font-black text-sm flex items-center justify-center shadow-md shadow-[#005A9E]/25 flex-shrink-0">
                        {getInitials(emp)}
                      </div>

                      <div className="min-w-0">
                        {emp.civilite ? (
                          <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#DCEBFA] text-[#003A6B] border border-[#93C0E8] mb-0.5">
                            {emp.civilite}
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-bold text-slate-600 mb-0.5">
                            Collaborateur
                          </span>
                        )}

                        <h3
                          className="text-sm font-black text-[#003A6B] truncate"
                          title={emp.full_name || `Employé #${emp.id}`}
                        >
                          {emp.full_name || `Employé sans nom #${emp.id}`}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Employee ID Chip */}
                  <div className="mt-3.5">
                    <div className="px-2.5 py-1.5 rounded-xl border bg-[#F4F9FF] border-[#C6DDF2] text-[#003A6B] text-[11px] flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <FileText className="w-3.5 h-3.5 text-[#005A9E] flex-shrink-0" />
                        <span>Fiche Collaborateur</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#005A9E] bg-[#DCEBFA] px-2 py-0.5 rounded-md">
                        ID #{emp.id}
                      </span>
                    </div>
                  </div>

                  {/* Tasks Summary Pills */}
                  <div className="mt-3.5 grid grid-cols-3 gap-1.5 text-center">
                    <div className="py-1.5 px-1 rounded-xl border bg-[#DCFCE7] border-[#86EFAC] text-[#14532D]">
                      <div className="text-xs font-black">{traiteCount}</div>
                      <div className="text-[9px] font-extrabold uppercase">Traités</div>
                    </div>

                    <div className="py-1.5 px-1 rounded-xl border bg-[#DBEAFE] border-[#93C5FD] text-[#003A6B]">
                      <div className="text-xs font-black">{enCoursCount}</div>
                      <div className="text-[9px] font-extrabold uppercase">En cours</div>
                    </div>

                    <div className="py-1.5 px-1 rounded-xl border bg-[#FFE4E6] border-[#FDA4AF] text-[#881337]">
                      <div className="text-xs font-black">{nonTraiteCount}</div>
                      <div className="text-[9px] font-extrabold uppercase">Non traités</div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Total Tasks + 3 Required Icon Buttons (Edit, View Details, Delete) */}
                <div className="mt-4 pt-3 border-t border-[#C6DDF2] flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#1E3A5F]">
                    <Briefcase className="w-3.5 h-3.5 text-[#005A9E]" />
                    <span>
                      {totalTasks} tâche{totalTasks > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onEditEmployee(emp)}
                      title="Modifier les informations de l'employé"
                      aria-label="Modifier"
                      className="p-2 rounded-xl cnas-btn-secondary active:scale-95 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectEmployee(emp.id)}
                      title="Consulter les tâches et détails de ce collaborateur"
                      aria-label="Voir Détails"
                      className="p-2 rounded-xl cnas-btn-primary active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteEmployee(emp)}
                      title="Supprimer cet employé"
                      aria-label="Supprimer"
                      className="p-2 rounded-xl border bg-[#FFE4E6] border-[#FDA4AF] text-[#9F1239] hover:bg-rose-200 transition-colors active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
