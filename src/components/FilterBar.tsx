import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskFilters } from '../types';
import { FilterModal } from './FilterModal';

interface FilterBarProps {
  filters: TaskFilters;
  onChangeFilters: (filters: TaskFilters) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
  totalFilteredCount
}) => {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInputChange = (key: keyof TaskFilters, value: any) => {
    onChangeFilters({
      ...filters,
      [key]: value
    });
  };

  const activeFiltersCount = [
    filters.statut !== 'Tous',
    filters.alerte !== 'Toutes',
    filters.service !== 'Tous',
    filters.priorite !== 'Toutes',
    filters.periode !== 'Toutes'
  ].filter(Boolean).length;

  const isFiltered = activeFiltersCount > 0 || filters.search !== '';

  return (
    <>
      <div className={`p-3 rounded-2xl border transition-all duration-200 mb-5 relative ${
        theme === 'dark' 
          ? 'glass-panel-dark border-slate-800/80 bg-slate-900/50' 
          : 'glass-panel-light border-slate-200/90 bg-white/80'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              placeholder="Rechercher par intitulé, référence..."
              className={`w-full pl-9 pr-7 py-2 rounded-xl text-xs font-medium transition-all ${
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

          {/* Action Buttons: Filter Modal Button & Reset */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-between sm:justify-end">
            
            {/* Filter Modal Trigger Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                activeFiltersCount > 0
                  ? 'bg-[#0055A5] text-white border-[#0055A5] shadow-sm'
                  : theme === 'dark'
                    ? 'bg-slate-900 border-slate-700/80 text-slate-200 hover:border-slate-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtres</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-[#0055A5]">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Total Results Count */}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
              <strong className="text-[#0055A5] dark:text-cyan-400 font-bold">{totalFilteredCount}</strong> dossier(s)
            </span>

            {/* Reset All Filters */}
            {isFiltered && (
              <button
                onClick={onResetFilters}
                title="Réinitialiser tous les filtres"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Réinitialiser</span>
              </button>
            )}

          </div>

        </div>

        {/* Active Filter Chips / Pills */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Filtres actifs :
            </span>

            {filters.statut !== 'Tous' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-500/10 text-[#0055A5] dark:text-cyan-400 border border-blue-500/20">
                <span>Statut : {filters.statut}</span>
                <button onClick={() => handleInputChange('statut', 'Tous')} className="hover:text-rose-500 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.alerte !== 'Toutes' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <span>Alerte : {filters.alerte === 'j-3' ? 'Échéances J-3' : 'En retard'}</span>
                <button onClick={() => handleInputChange('alerte', 'Toutes')} className="hover:text-rose-500 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.service !== 'Tous' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-500/10 text-[#0055A5] dark:text-cyan-400 border border-blue-500/20">
                <span>Pôle : {filters.service}</span>
                <button onClick={() => handleInputChange('service', 'Tous')} className="hover:text-rose-500 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.priorite !== 'Toutes' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <span>Priorité : {filters.priorite}</span>
                <button onClick={() => handleInputChange('priorite', 'Toutes')} className="hover:text-rose-500 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.periode !== 'Toutes' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span>Période : {filters.periode}</span>
                <button onClick={() => handleInputChange('periode', 'Toutes')} className="hover:text-rose-500 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        filters={filters}
        onChangeFilters={onChangeFilters}
        onResetFilters={onResetFilters}
        totalResultsCount={totalFilteredCount}
      />
    </>
  );
};
