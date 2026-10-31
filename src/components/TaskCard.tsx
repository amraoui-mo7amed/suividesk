import React from 'react';
import { 
  ClockAlert, 
  AlertTriangle, 
  CheckCircle2, 
  CircleDashed, 
  Ban, 
  Calendar, 
  ArrowRight,
  Edit3
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskAssignment, TaskStatus } from '../types';

interface TaskCardProps {
  task: TaskAssignment;
  onUpdateStatus: (id: number, nextStatus: TaskStatus) => void;
  onEdit: (task: TaskAssignment) => void;
  onViewDetails: (task: TaskAssignment) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  onEdit,
  onViewDetails
}) => {
  const { theme } = useTheme();

  // Priority Styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Haute':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Moyenne':
        return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  // Status Stepper: En attente ➔ En cours ➔ Terminée / Bloquée
  const handleNextStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.statut === 'En attente') {
      onUpdateStatus(task.id, 'En cours');
    } else if (task.statut === 'En cours') {
      onUpdateStatus(task.id, 'Terminée');
    } else if (task.statut === 'Bloquée') {
      onUpdateStatus(task.id, 'En cours');
    } else {
      onUpdateStatus(task.id, 'En cours'); // Re-open
    }
  };

  // Glow Border Class
  const getCardGlowClass = () => {
    if (task.statut === 'Terminée') return '';
    if (task.alert_level === 'overdue') {
      return theme === 'dark' ? 'card-overdue-glow-dark' : 'card-overdue-glow-light';
    }
    if (task.alert_level === 'j-3') {
      return theme === 'dark' ? 'card-j3-glow-dark' : 'card-j3-glow-light';
    }
    return '';
  };

  return (
    <div
      onClick={() => onViewDetails(task)}
      className={`group relative rounded-2xl p-4 cursor-pointer flex flex-col justify-between transition-all duration-150 ${
        theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
      } ${getCardGlowClass()}`}
    >
      {/* Top Header: Service, Priority, Ref */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-[#0055A5] dark:text-cyan-300">
              {task.service}
            </span>
            {task.reference_dossier && (
              <span className="text-[10px] font-mono text-slate-400">
                {task.reference_dossier}
              </span>
            )}
          </div>

          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getPriorityBadge(task.priorite)}`}>
            {task.priorite}
          </span>
        </div>

        {/* Task Title */}
        <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#0055A5] dark:group-hover:text-cyan-400 transition-colors">
          {task.titre}
        </h3>

        {/* Employee & Start Date */}
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-[#0055A5] text-white text-[9px] font-bold flex items-center justify-center">
              {task.agent_prenom?.[0] || 'A'}{task.agent_nom?.[0] || 'G'}
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
              {task.agent_prenom} {task.agent_nom}
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            {task.agent_matricule}
          </span>
        </div>
      </div>

      {/* Middle: Deadline & Alert Reminder Badge */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/70 space-y-2">
        
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{task.date_echeance_fr || task.date_echeance}</span>
          </div>

          {/* J-3 or Overdue Alert Chip */}
          {task.alert_level === 'overdue' && (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 text-white">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{task.delay_text}</span>
            </span>
          )}

          {task.alert_level === 'j-3' && (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white">
              <ClockAlert className="w-2.5 h-2.5" />
              <span>{task.delay_text}</span>
            </span>
          )}

          {task.statut === 'Terminée' && (
            <span className="text-[9px] font-semibold text-emerald-500 flex items-center space-x-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Terminée</span>
            </span>
          )}

          {task.statut === 'Bloquée' && (
            <span className="text-[9px] font-semibold text-purple-400 flex items-center space-x-1">
              <Ban className="w-2.5 h-2.5" />
              <span>Bloquée</span>
            </span>
          )}
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              task.statut === 'Terminée'
                ? 'bg-emerald-500'
                : task.alert_level === 'overdue'
                  ? 'bg-rose-500'
                  : task.alert_level === 'j-3'
                    ? 'bg-amber-500'
                    : 'bg-[#0055A5]'
            }`}
            style={{ width: `${task.progression}%` }}
          />
        </div>

      </div>

      {/* Footer: Status Stepper */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/70 flex items-center justify-between">
        
        {/* Status Stepper Button */}
        <button
          type="button"
          onClick={handleNextStatus}
          title="Avancer le statut"
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
            task.statut === 'Terminée'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : task.statut === 'En cours'
                ? 'bg-[#0055A5] text-white shadow-sm hover:bg-[#0072CE]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {task.statut === 'En attente' && <CircleDashed className="w-2.5 h-2.5" />}
          {task.statut === 'En cours' && <ArrowRight className="w-2.5 h-2.5" />}
          {task.statut === 'Terminée' && <CheckCircle2 className="w-2.5 h-2.5" />}
          {task.statut === 'Bloquée' && <Ban className="w-2.5 h-2.5" />}
          <span>{task.statut}</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title="Modifier"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
};
