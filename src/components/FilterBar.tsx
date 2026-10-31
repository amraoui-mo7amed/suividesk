import React from 'react';
import { 
  Search, 
  RotateCcw
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskFilters, Employee } from '../types';
import { CustomSelect, Option } from './CustomSelect';

interface FilterBarProps {
  filters: TaskFilters;
  onChangeFilters: (filters: TaskFilters) => void;
  onResetFilters: () => void;
  employees: Employee[];
  totalFilteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
  employees,
  totalFilteredCount
}) => {
  const { theme } = useTheme();

  const handleInputChange = (key: keyof TaskFilters, value: any) => {
    onChangeFilters({
      ...filters,
      [key]: value
    });
  };

  const isFiltered = 
    filters.search !== '' ||
    filters.statut !== 'Tous' ||
    filters.alerte !== 'Toutes' ||
    filters.service !== 'Tous' ||
    filters.priorite !== 'Toutes' ||
    filters.agent_id !== 'Tous' ||
    filters.periode !== 'Toutes';

  // Filter options definitions
  const statutOptions: Option[] = [
    { value: 'Tous', label: 'Statut : Tous' },
    { value: 'En attente', label: 'En attente' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Terminée', label: 'Terminée' },
    { value: 'En retard', label: 'En retard' },
    { value: 'Bloquée', label: 'Bloquée' }
  ];

  const alerteOptions: Option[] = [
    { value: 'Toutes', label: 'Alerte : Toutes' },
    { value: 'j-3', label: '🟡 Échéances J-3', subtitle: 'Alerte préventive 72h' },
    { value: 'overdue', label: '🔴 En retard', subtitle: 'Délai d’échéance dépassé' }
  ];

  const serviceOptions: Option[] = [
    { value: 'Tous', label: 'Pôle : Tous' },
    { value: 'Recouvrement', label: 'Recouvrement' },
    { value: 'Prestations', label: 'Prestations' },
    { value: 'Contrôle Médical', label: 'Contrôle Médical' },
    { value: 'Contentieux', label: 'Contentieux' },
    { value: 'Informatique', label: 'Informatique' },
    { value: 'Ressources Humaines', label: 'Ressources Humaines (RH)' }
  ];

  const prioriteOptions: Option[] = [
    { value: 'Toutes', label: 'Priorité : Toutes' },
    { value: 'Urgente', label: 'Urgente' },
    { value: 'Haute', label: 'Haute' },
    { value: 'Moyenne', label: 'Moyenne' },
    { value: 'Basse', label: 'Basse' }
  ];

  const agentOptions: Option[] = [
    { value: 'Tous', label: 'Agent : Tous' },
    ...employees.map((emp) => ({
      value: String(emp.id),
      label: `${emp.nom} ${emp.prenom}`,
      subtitle: `${emp.service} • ${emp.matricule}`
    }))
  ];

  const periodeOptions: Option[] = [
    { value: 'Toutes', label: 'Période : Toutes' },
    { value: 'aujourdhui', label: 'Aujourd’hui' },
    { value: 'semaine', label: 'Cette semaine' },
    { value: 'mois', label: 'Ce mois-ci' }
  ];

  return (
    <div className={`p-3.5 rounded-2xl border transition-all duration-200 mb-5 overflow-visible relative z-20 ${
      theme === 'dark' 
        ? 'glass-panel-dark border-slate-800/80 bg-slate-900/50' 
        : 'glass-panel-light border-slate-200/90 bg-white/80'
    }`}>
      {/* Top Line: Search & Counter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 overflow-visible">
        
        {/* Minimal Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder="Rechercher tâche, matricule, agent..."
            className={`w-full pl-9 pr-7 py-1.5 rounded-xl text-xs font-medium transition-all ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          />
          {filters.search && (
            <button
              onClick={() => handleInputChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Counter & Reset */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            <strong className="text-[#0055A5] dark:text-cyan-400 font-bold">{totalFilteredCount}</strong> dossier(s)
          </span>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>

      </div>

      {/* Selects Grid: Replaced with CustomSelect for full overflow, zero truncation, non-transparent solid popups */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 overflow-visible">
        
        {/* Statut CustomSelect */}
        <div className="overflow-visible">
          <CustomSelect
            compact
            options={statutOptions}
            value={filters.statut}
            onChange={(v) => handleInputChange('statut', v)}
          />
        </div>

        {/* Alerte Échéance CustomSelect */}
        <div className="overflow-visible">
          <CustomSelect
            compact
            options={alerteOptions}
            value={filters.alerte}
            onChange={(v) => handleInputChange('alerte', v)}
          />
        </div>

        {/* Service CustomSelect */}
        <div className="overflow-visible">
          <CustomSelect
            compact
            options={serviceOptions}
            value={filters.service}
            onChange={(v) => handleInputChange('service', v)}
          />
        </div>

        {/* Priorité CustomSelect */}
        <div className="overflow-visible">
          <CustomSelect
            compact
            options={prioriteOptions}
            value={filters.priorite}
            onChange={(v) => handleInputChange('priorite', v)}
          />
        </div>

        {/* Collaborateur CustomSelect with search and right align */}
        <div className="overflow-visible">
          <CustomSelect
            compact
            searchable
            menuAlign="right"
            options={agentOptions}
            value={String(filters.agent_id)}
            onChange={(v) => handleInputChange('agent_id', v)}
          />
        </div>

        {/* Période CustomSelect with right align */}
        <div className="overflow-visible">
          <CustomSelect
            compact
            menuAlign="right"
            options={periodeOptions}
            value={filters.periode}
            onChange={(v) => handleInputChange('periode', v)}
          />
        </div>

      </div>
    </div>
  );
};
