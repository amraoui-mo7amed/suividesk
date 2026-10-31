import React from 'react';
import { 
  Inbox, 
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
    <div className="space-y-4 overflow-visible">
      
      {/* Clean Top Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">
            Suivi Opérationnel
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Gestion préventive et suivi des échéances en temps réel
          </p>
        </div>

        {/* Minimal Alert Tags */}
        <div className="flex items-center space-x-2">
          {j3Count > 0 && (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ClockAlert className="w-3.5 h-3.5" />
              <span>{j3Count} J-3</span>
            </div>
          )}

          {overdueCount > 0 && (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{overdueCount} en retard</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar with Modal Dialog */}
      <FilterBar
        filters={filters}
        onChangeFilters={onChangeFilters}
        onResetFilters={onResetFilters}
        totalFilteredCount={tasks.length}
      />

      {/* Cards Grid */}
      {tasks.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-800 glass-panel-dark text-center transition-all">
          <div className="mx-auto w-10 h-10 rounded-xl bg-blue-500/15 text-cyan-400 flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">
            Aucun dossier trouvé
          </h3>
          <p className="text-xs text-slate-300 mt-1 mb-4">
            Modifiez vos filtres ou affectez un nouveau dossier.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
            >
              Réinitialiser
            </button>
            <button
              onClick={onOpenAssignModal}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Nouvelle Tâche
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
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
