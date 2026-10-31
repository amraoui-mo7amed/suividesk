import React from 'react';
import { X, RotateCcw, Check, SlidersHorizontal } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskFilters, TaskPriority, CNASService } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TaskFilters;
  onChangeFilters: (filters: TaskFilters) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  onResetFilters,
  totalResultsCount
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const handleSelect = (key: keyof TaskFilters, value: any) => {
    onChangeFilters({
      ...filters,
      [key]: value
    });
  };

  const statuts = [
    { value: 'Tous', label: 'Tous les statuts' },
    { value: 'En attente', label: 'En attente' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Terminée', label: 'Terminée' },
    { value: 'En retard', label: 'En retard' },
    { value: 'Bloquée', label: 'Bloquée' }
  ];

  const alertes = [
    { value: 'Toutes', label: 'Toutes les échéances' },
    { value: 'j-3', label: '🟡 Échéances J-3 (72h)' },
    { value: 'overdue', label: '🔴 En retard critique' }
  ];

  const services = [
    { value: 'Tous', label: 'Tous les Pôles' },
    { value: 'Recouvrement', label: 'Recouvrement' },
    { value: 'Prestations', label: 'Prestations' },
    { value: 'Contrôle Médical', label: 'Contrôle Médical' },
    { value: 'Contentieux', label: 'Contentieux' },
    { value: 'Informatique', label: 'Informatique' },
    { value: 'Ressources Humaines', label: 'Ressources Humaines (RH)' }
  ];

  const priorites: { value: string; label: string }[] = [
    { value: 'Toutes', label: 'Toutes priorités' },
    { value: 'Urgente', label: 'Urgente' },
    { value: 'Haute', label: 'Haute' },
    { value: 'Moyenne', label: 'Moyenne' },
    { value: 'Basse', label: 'Basse' }
  ];

  const periodes = [
    { value: 'Toutes', label: 'Toute la période' },
    { value: 'aujourdhui', label: 'Aujourd’hui' },
    { value: 'semaine', label: 'Cette semaine' },
    { value: 'mois', label: 'Ce mois-ci' }
  ];

  const activeFiltersCount = [
    filters.statut !== 'Tous',
    filters.alerte !== 'Toutes',
    filters.service !== 'Tous',
    filters.priorite !== 'Toutes',
    filters.periode !== 'Toutes'
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all border border-slate-800 bg-[#090e1f] text-slate-100 glass-panel-dark">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Filtrer les Dossiers
              </h2>
              <p className="text-[11px] text-slate-300">
                {totalResultsCount} dossier(s) correspondant{totalResultsCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters Body */}
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          
          {/* Statut Section */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Statut d'Avancement
            </label>
            <div className="flex flex-wrap gap-1.5">
              {statuts.map((st) => {
                const isSelected = filters.statut === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => handleSelect('statut', st.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#0055A5] text-white border-[#0055A5] shadow-sm'
                        : theme === 'dark'
                          ? 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alerte Section */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Contrôle d'Échéance & Alertes
            </label>
            <div className="flex flex-wrap gap-1.5">
              {alertes.map((al) => {
                const isSelected = filters.alerte === al.value;
                return (
                  <button
                    key={al.value}
                    type="button"
                    onClick={() => handleSelect('alerte', al.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? al.value === 'j-3'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : al.value === 'overdue'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-[#0055A5] text-white border-[#0055A5] shadow-sm'
                        : theme === 'dark'
                          ? 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {al.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service / Pôle Section */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Pôle / Service CNAS
            </label>
            <div className="flex flex-wrap gap-1.5">
              {services.map((srv) => {
                const isSelected = filters.service === srv.value;
                return (
                  <button
                    key={srv.value}
                    type="button"
                    onClick={() => handleSelect('service', srv.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#0055A5] text-white border-[#0055A5] shadow-sm'
                        : theme === 'dark'
                          ? 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {srv.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priorité Section */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Niveau de Priorité
            </label>
            <div className="flex flex-wrap gap-1.5">
              {priorites.map((p) => {
                const isSelected = filters.priorite === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSelect('priorite', p.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#0055A5] text-white border-[#0055A5] shadow-sm'
                        : theme === 'dark'
                          ? 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Période Section */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Période Temporelle
            </label>
            <div className="flex flex-wrap gap-1.5">
              {periodes.map((per) => {
                const isSelected = filters.periode === per.value;
                return (
                  <button
                    key={per.value}
                    type="button"
                    onClick={() => handleSelect('periode', per.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#0055A5] text-white border-[#0055A5] shadow-sm'
                        : theme === 'dark'
                          ? 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {per.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onResetFilters}
            disabled={activeFiltersCount === 0}
            className="flex items-center space-x-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-md hover:opacity-95 active:scale-95 transition-all"
          >
            Appliquer les Filtres ({activeFiltersCount})
          </button>
        </div>

      </div>
    </div>
  );
};
