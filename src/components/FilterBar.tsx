import React from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar, 
  Building2, 
  User, 
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Flame
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
    filters.periode !== 'Toutes' ||
    Boolean(filters.date_debut) ||
    Boolean(filters.date_fin);

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200 mb-6 ${
      theme === 'dark' 
        ? 'glass-panel-dark border-slate-800/80 bg-slate-900/40' 
        : 'glass-panel-light border-slate-200/90 bg-white/70'
    }`}>
      {/* Top Row: Search & Active Filter Count */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
        
        {/* Instant Live Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder="Rechercher par titre, matricule, collaborateur, réf..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium transition-all ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          />
          {filters.search && (
            <button
              onClick={() => handleInputChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Indicator & Reset Button */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#00A3E0]" />
            <span>
              Résultats : <strong className="text-[#0055A5] dark:text-cyan-400">{totalFilteredCount}</strong> tâche(s)
            </span>
          </div>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition-all active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

      </div>

      {/* Bottom Grid: Dropdown Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        
        {/* Statut Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Statut
          </label>
          <select
            value={filters.statut}
            onChange={(e) => handleInputChange('statut', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Tous">Tous les statuts</option>
            <option value="En attente">En attente</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminée</option>
            <option value="En retard">En retard</option>
            <option value="Bloquée">Bloquée</option>
          </select>
        </div>

        {/* Alerte Échéance Filter (Key Feature) */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block flex items-center space-x-1">
            <span>Alerte Échéance</span>
          </label>
          <select
            value={filters.alerte}
            onChange={(e) => handleInputChange('alerte', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold ${
              filters.alerte !== 'Toutes'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                : theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Toutes">Toutes les alertes</option>
            <option value="j-3">🟡 Échéance dans 3 jours (J-3)</option>
            <option value="overdue">🔴 En retard uniquement</option>
          </select>
        </div>

        {/* Service / Pôle Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Pôle / Service
          </label>
          <select
            value={filters.service}
            onChange={(e) => handleInputChange('service', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Tous">Tous les services</option>
            <option value="Recouvrement">Recouvrement</option>
            <option value="Prestations">Prestations</option>
            <option value="Contrôle Médical">Contrôle Médical</option>
            <option value="Contentieux">Contentieux</option>
            <option value="Informatique">Informatique</option>
            <option value="Ressources Humaines">RH</option>
          </select>
        </div>

        {/* Priorité Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Priorité
          </label>
          <select
            value={filters.priorite}
            onChange={(e) => handleInputChange('priorite', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Toutes">Toutes priorités</option>
            <option value="Urgente">Urgente</option>
            <option value="Haute">Haute</option>
            <option value="Moyenne">Moyenne</option>
            <option value="Basse">Basse</option>
          </select>
        </div>

        {/* Collaborateur Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Collaborateur
          </label>
          <select
            value={filters.agent_id}
            onChange={(e) => handleInputChange('agent_id', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Tous">Tous les agents</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nom} {emp.prenom} ({emp.matricule})
              </option>
            ))}
          </select>
        </div>

        {/* Période Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Période
          </label>
          <select
            value={filters.periode}
            onChange={(e) => handleInputChange('periode', e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Toutes">Toutes les dates</option>
            <option value="aujourdhui">Aujourd'hui</option>
            <option value="semaine">Cette semaine</option>
            <option value="mois">Ce mois-ci</option>
          </select>
        </div>

      </div>
    </div>
  );
};
