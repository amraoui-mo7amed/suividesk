import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  FileDown,
  FileSpreadsheet,
  Pencil,
  Eye,
  Trash2,
  FileText,
  Users,
  RotateCcw,
  ChevronDown,
  Loader2,
  Briefcase
} from 'lucide-react';
import { Employee, EmployeeFilters, EmployeeSortOption } from '../../types';
import { CustomSelect } from '../CustomSelect';
import { PortalDropdown } from '../PortalDropdown';

interface EmployeesListViewProps {
  employees: Employee[];
  onAddEmployee: () => void;
  onEditEmployee: (emp: Employee) => void;
  onViewEmployeeDetails: (emp: Employee) => void;
  onDeleteEmployee: (emp: Employee) => void;
  onExportPdf: (filteredEmployees: Employee[], filterSummary: string) => void;
  onExportCsv: (filteredEmployees: Employee[]) => void;
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

const FILTER_FILE_OPTIONS = [
  { value: 'Tous', label: 'Tous' },
  { value: 'with-file', label: 'Avec document (PDF/DOCX/Excel)' },
  { value: 'without-file', label: 'Sans document joint' }
];

const FILTER_TASK_STATE_OPTIONS = [
  { value: 'Tous', label: 'Tous les employés' },
  { value: 'with-tasks', label: 'Ayant des tâches' },
  { value: 'without-tasks', label: 'Sans aucune tâche' },
  { value: 'has-non-traite', label: 'Ayant des courriers non traités' },
  { value: 'has-en-cours', label: 'Ayant des courriers en cours' },
  { value: 'has-traite', label: 'Ayant des courriers traités' }
];

export const EmployeesListView: React.FC<EmployeesListViewProps> = ({
  employees,
  onAddEmployee,
  onEditEmployee,
  onViewEmployeeDetails,
  onDeleteEmployee,
  onExportPdf,
  onExportCsv,
  isExportingPdf,
  isExportingCsv
}) => {
  const [filters, setFilters] = useState<EmployeeFilters>(defaultEmployeeFilters);

  const activeFilterCount = [
    filters.civilite !== 'Tous',
    filters.hasFile !== 'Tous',
    filters.taskState !== 'Tous'
  ].filter(Boolean).length;

  const filteredAndSortedEmployees = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    const list = employees.filter((emp) => {
      if (q) {
        const nameMatch = (emp.full_name || '').toLowerCase().includes(q);
        const civMatch = (emp.civilite || '').toLowerCase().includes(q);
        const fileMatch = (emp.file_name || '').toLowerCase().includes(q);
        if (!nameMatch && !civMatch && !fileMatch) return false;
      }

      if (filters.civilite !== 'Tous') {
        if (filters.civilite === 'Non spécifié') {
          if (emp.civilite && emp.civilite.trim() !== '') return false;
        } else if (emp.civilite !== filters.civilite) {
          return false;
        }
      }

      if (filters.hasFile === 'with-file') {
        if (!emp.file_name || emp.file_name.trim() === '') return false;
      } else if (filters.hasFile === 'without-file') {
        if (emp.file_name && emp.file_name.trim() !== '') return false;
      }

      const total = emp.tasks_count || 0;
      if (filters.taskState === 'with-tasks' && total === 0) return false;
      if (filters.taskState === 'without-tasks' && total > 0) return false;
      if (filters.taskState === 'has-non-traite' && (emp.non_traite_count || 0) === 0) return false;
      if (filters.taskState === 'has-en-cours' && (emp.en_cours_count || 0) === 0) return false;
      if (filters.taskState === 'has-traite' && (emp.traite_count || 0) === 0) return false;

      return true;
    });

    // Sort (Alphabetical A->Z by default)
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
          return (b.tasks_count || 0) - (a.tasks_count || 0) || nameA.localeCompare(nameB, 'fr');
        case 'tasks-asc':
          return (a.tasks_count || 0) - (b.tasks_count || 0) || nameA.localeCompare(nameB, 'fr');
        case 'recent':
          return b.id - a.id;
        default:
          return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
      }
    });
  }, [employees, filters]);

  const buildFilterSummary = () => {
    const parts: string[] = [];
    if (filters.civilite !== 'Tous') parts.push(`Civilité: ${filters.civilite}`);
    if (filters.hasFile === 'with-file') parts.push('Avec document');
    if (filters.hasFile === 'without-file') parts.push('Sans document');
    if (filters.search.trim()) parts.push(`Recherche: "${filters.search.trim()}"`);
    return parts.length > 0 ? parts.join(' • ') : 'Tous les employés (Tri alphabétique)';
  };

  const getInitials = (emp: Employee) => {
    const clean = (emp.full_name || '').trim();
    if (!clean) return '#';
    const words = clean.split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 text-slate-900">
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#003A6B]">
            Liste des Employés CNAS
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            {filteredAndSortedEmployees.length} collaborateur(s) affiché(s) sur {employees.length} •
            Triés par défaut par ordre alphabétique
          </p>
        </div>

        {/* Primary Add Employee Button */}
        <button
          onClick={onAddEmployee}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Employé</span>
        </button>
      </div>

      {/* Unified Toolbar: Search Bar + Filter + Sort + Export (PDF / CSV) */}
      <div className="p-3.5 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 relative z-20 cnas-panel">
        {/* 1. Search Bar */}
        <div className="relative flex-1 min-w-0 lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#005A9E]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Rechercher un employé (nom complet, civilité, document)..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl text-xs font-semibold cnas-input"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 hover:text-rose-600 cursor-pointer"
              title="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Controls: Filter, Sort, Export */}
        <div className="flex flex-wrap items-center gap-2.5 overflow-visible">
          {/* 2. Portal Filter Dropdown */}
          <PortalDropdown
            widthClass="w-80"
            align="right"
            trigger={({ isOpen, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilterCount > 0 || isOpen
                    ? 'cnas-btn-primary'
                    : 'cnas-btn-secondary'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtrer</span>
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
                    Filtres des Employés
                  </span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          civilite: 'Tous',
                          hasFile: 'Tous',
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

          {/* 3. Sort Select (Default Alphabetical, Portal Overflowed) */}
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

          {/* 4. Portal Export Dropdown (PDF or CSV) */}
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
                    onExportPdf(filteredAndSortedEmployees, buildFilterSummary());
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
                    onExportCsv(filteredAndSortedEmployees);
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

      {/* Responsive Employee Cards Grid (NOT a table) */}
      {filteredAndSortedEmployees.length === 0 ? (
        <div className="rounded-3xl p-12 text-center cnas-panel">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-[#003A6B]">
            {employees.length === 0
              ? 'Aucun employé enregistré'
              : 'Aucun employé ne correspond à votre recherche'}
          </h3>
          <p className="text-xs font-medium text-slate-700 mt-1 max-w-md mx-auto">
            {employees.length === 0
              ? 'Commencez par ajouter un collaborateur pour gérer ses documents et suivre ses tâches.'
              : 'Essayez de modifier les termes de recherche ou de réinitialiser les filtres actifs.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2.5">
            {(filters.search || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={() => setFilters(defaultEmployeeFilters)}
                className="px-4 py-2 rounded-xl text-xs font-bold cnas-btn-secondary cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
            <button
              type="button"
              onClick={onAddEmployee}
              className="px-4 py-2 rounded-xl text-xs font-bold cnas-btn-primary cursor-pointer"
            >
              + Ajouter un Employé
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
                onDoubleClick={() => onViewEmployeeDetails(emp)}
                className="rounded-2xl p-5 flex flex-col justify-between cnas-card"
              >
                {/* Top Card Section */}
                <div>
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

                  {/* Employee Info Badge */}
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

                  {/* Tasks Summary Pills (High Contrast WCAG AAA) */}
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

                {/* Card Footer: Total Tasks + Required Icon-Only Buttons (Edit, View Details, Delete) */}
                <div className="mt-4 pt-3 border-t border-[#C6DDF2] flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#1E3A5F]">
                    <Briefcase className="w-3.5 h-3.5 text-[#005A9E]" />
                    <span>
                      {totalTasks} tâche{totalTasks > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* 3 Required Icon-Only Buttons: Edit, View Details, Delete */}
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
                      onClick={() => onViewEmployeeDetails(emp)}
                      title="Voir les détails et la liste des tâches"
                      aria-label="Voir détails"
                      className="p-2 rounded-xl cnas-btn-primary active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteEmployee(emp)}
                      title="Supprimer cet employé"
                      aria-label="Supprimer"
                      className="p-2 rounded-xl border bg-[#FFE4E6] border-[#FDA4AF] text-[#9F1239] hover:bg-rose-200 transition-all active:scale-95 cursor-pointer"
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
