import React from 'react';
import { 
  Inbox, 
  Plus, 
  Sparkles, 
  SlidersHorizontal,
  ClockAlert,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { TaskAssignment, TaskFilters, Employee, TaskStatus } from '../../types';
import { FilterBar } from '../FilterBar';
import { TaskCard } from '../TaskCard';

interface TaskTrackingViewProps {
  tasks: TaskAssignment[];
  filters: TaskFilters;
  onChangeFilters: (filters: TaskFilters) => void;
  onResetFilters: () => void;
  employees: Employee[];
  onUpdateStatus: (id: number, nextStatus: TaskStatus) => void;
  onEditTask: (task: TaskAssignment) => void;
  onViewDetails: (task: TaskAssignment) => void;
  onOpenAssignModal: () => void;
}

export const TaskTrackingView: React.FC<TaskTrackingViewProps> = ({
  tasks,
  filters,
  onChangeFilters,
  onResetFilters,
  employees,
  onUpdateStatus,
  onEditTask,
  onViewDetails,
  onOpenAssignModal
}) => {
  const { theme } = useTheme();

  const j3Count = tasks.filter(t => t.alert_level === 'j-3').length;
  const overdueCount = tasks.filter(t => t.alert_level === 'overdue').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Quick Highlights */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Suivi Opérationnel des Tâches
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800">
              Grille Liquid Glass
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Surveillance en temps réel des flux de dossiers et gestion préventive des échéances CNAS
          </p>
        </div>

        {/* Quick Highlights Summary */}
        <div className="flex items-center space-x-2 self-stretch sm:self-auto">
          {j3Count > 0 && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <ClockAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>{j3Count} à échéance J-3</span>
            </div>
          )}

          {overdueCount > 0 && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{overdueCount} en retard</span>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Multi-Filter Bar */}
      <FilterBar
        filters={filters}
        onChangeFilters={onChangeFilters}
        onResetFilters={onResetFilters}
        employees={employees}
        totalFilteredCount={tasks.length}
      />

      {/* Cards Grid */}
      {tasks.length === 0 ? (
        <div className={`p-16 rounded-3xl border text-center transition-all ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 text-[#0055A5] dark:text-cyan-400 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Aucun dossier ne correspond aux critères
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Ajustez vos filtres de recherche ou affectez un nouveau dossier à un collaborateur.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={onResetFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
            >
              Réinitialiser les filtres
            </button>
            <button
              onClick={onOpenAssignModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-md hover:scale-[1.02] active:scale-95 transition-all"
            >
              Affecter une Tâche
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdateStatus={onUpdateStatus}
              onEdit={onEditTask}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}

    </div>
  );
};
