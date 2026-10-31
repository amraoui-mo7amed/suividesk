import React, { useState } from 'react';
import { 
  ClockAlert, 
  AlertTriangle, 
  CheckCircle2, 
  CircleDashed, 
  Ban, 
  Calendar, 
  User, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Eye, 
  Sparkles,
  ArrowRight
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
  const [isExpanded, setIsExpanded] = useState(false);

  // Priority Styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'Haute':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Moyenne':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
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
      className={`group relative rounded-2xl p-5 cursor-pointer flex flex-col justify-between ${
        theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
      } ${getCardGlowClass()}`}
    >
      {/* Top Header: Service & Priority Chip */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-[#0055A5] dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/40">
            {task.service}
          </span>

          <div className="flex items-center space-x-1.5">
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getPriorityBadge(task.priorite)}`}>
              {task.priorite}
            </span>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#0055A5] dark:group-hover:text-cyan-400 transition-colors">
          {task.titre}
        </h3>

        {/* Dossier Reference */}
        {task.reference_dossier && (
          <div className="mt-1 flex items-center space-x-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Réf : {task.reference_dossier}
            </span>
          </div>
        )}

        {/* Employee Info & Start Date */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/70 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0055A5] to-[#00A3E0] text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
              {task.agent_prenom?.[0] || 'A'}{task.agent_nom?.[0] || 'G'}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {task.agent_prenom} {task.agent_nom}
              </div>
              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                {task.agent_matricule}
              </div>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-400 dark:text-slate-500">
            <div>Début :</div>
            <div className="font-semibold text-slate-600 dark:text-slate-300">
              {task.date_debut_fr || task.date_debut}
            </div>
          </div>
        </div>

        {/* Expandable Description */}
        {task.description && (
          <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
            <p className={isExpanded ? 'text-xs leading-relaxed' : 'text-xs line-clamp-2 leading-relaxed'}>
              {task.description}
            </p>
            {task.description.length > 80 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="mt-1 text-[10px] font-bold text-[#0055A5] dark:text-cyan-400 hover:underline flex items-center space-x-0.5"
              >
                <span>{isExpanded ? 'Réduire' : 'Voir instructions'}</span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Middle: Deadline & Alert Reminder Badge */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/70 space-y-2">
        
        {/* Dynamic Alert Banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Échéance : <strong>{task.date_echeance_fr || task.date_echeance}</strong>
            </span>
          </div>

          {/* J-3 or Overdue Alert Chip */}
          {task.alert_level === 'overdue' && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-sm animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>{task.delay_text}</span>
            </span>
          )}

          {task.alert_level === 'j-3' && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-sm animate-pulse">
              <ClockAlert className="w-3 h-3" />
              <span>{task.delay_text}</span>
            </span>
          )}

          {task.statut === 'Terminée' && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>Terminée</span>
            </span>
          )}

          {task.statut === 'Bloquée' && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <Ban className="w-3 h-3" />
              <span>Bloquée</span>
            </span>
          )}
        </div>

        {/* Progression Bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Avancement</span>
            <span>{task.progression}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                task.statut === 'Terminée'
                  ? 'bg-emerald-500'
                  : task.alert_level === 'overdue'
                    ? 'bg-rose-500'
                    : task.alert_level === 'j-3'
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-[#0055A5] to-[#00A3E0]'
              }`}
              style={{ width: `${task.progression}%` }}
            />
          </div>
        </div>

      </div>

      {/* Footer: Quick Actions & Status Stepper */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/70 flex items-center justify-between gap-2">
        
        {/* Status Stepper Button */}
        <button
          type="button"
          onClick={handleNextStatus}
          title="Avancer le statut : En attente ➔ En cours ➔ Terminée"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            task.statut === 'Terminée'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
              : task.statut === 'En cours'
                ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          {task.statut === 'En attente' && <CircleDashed className="w-3 h-3 animate-spin" />}
          {task.statut === 'En cours' && <ArrowRight className="w-3 h-3" />}
          {task.statut === 'Terminée' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          {task.statut === 'Bloquée' && <Ban className="w-3 h-3 text-purple-500" />}
          <span>{task.statut}</span>
        </button>

        {/* Action icons: Edit & Details */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Modifier la tâche"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(task);
            }}
            title="Consulter tous les détails"
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0055A5] dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
