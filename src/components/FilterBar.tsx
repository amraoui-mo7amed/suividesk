import React from 'react';
import { 
  Search, 
  RotateCcw, 
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskFilters, Employee } from '../types';

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

      {/* Selects Grid: Explicitly overflow-visible so native dropdown menus are never clipped */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 overflow-visible">
        
        {/* Statut Select */}
        <div className="relative overflow-visible">
          <select
            value={filters.statut}
            onChange={(e) => handleInputChange('statut', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium appearance-none pr-6 cursor-pointer ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Tous">Statut : Tous</option>
            <option value="En attente">En attente</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminée</option>
            <option value="En retard">En retard</option>
            <option value="Bloquée">Bloquée</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Alerte Échéance Select */}
        <div className="relative overflow-visible">
          <select
            value={filters.alerte}
            onChange={(e) => handleInputChange('alerte', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold appearance-none pr-6 cursor-pointer ${
              filters.alerte !== 'Toutes'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40'
                : theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Toutes">Alerte : Toutes</option>
            <option value="j-3">🟡 Échéance J-3 (72h)</option>
            <option value="overdue">🔴 En retard</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Service Select */}
        <div className="relative overflow-visible">
          <select
            value={filters.service}
            onChange={(e) => handleInputChange('service', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium appearance-none pr-6 cursor-pointer ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Tous">Pôle : Tous</option>
            <option value="Recouvrement">Recouvrement</option>
            <option value="Prestations">Prestations</option>
            <option value="Contrôle Médical">Contrôle Médical</option>
            <option value="Contentieux">Contentieux</option>
            <option value="Informatique">Informatique</option>
            <option value="Ressources Humaines">RH</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Priorité Select */}
        <div className="relative overflow-visible">
          <select
            value={filters.priorite}
            onChange={(e) => handleInputChange('priorite', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium appearance-none pr-6 cursor-pointer ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Toutes">Priorité : Toutes</option>
            <option value="Urgente">Urgente</option>
            <option value="Haute">Haute</option>
            <option value="Moyenne">Moyenne</option>
            <option value="Basse">Basse</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Collaborateur Select */}
        <div className="relative overflow-visible">
          <select
            value={filters.agent_id}
            onChange={(e) => handleInputChange('agent_id', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium appearance-none pr-6 cursor-pointer ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Tous">Agent : Tous</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nom} {emp.prenom}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Période Select */}
        <div className="relative overflow-visible">
          <select
            value={filters.periode}
            onChange={(e) => handleInputChange('periode', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium appearance-none pr-6 cursor-pointer ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Toutes">Période : Toutes</option>
            <option value="aujourdhui">Aujourd'hui</option>
            <option value="semaine">Cette semaine</option>
            <option value="mois">Ce mois-ci</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

      </div>
    </div>
  );
};
