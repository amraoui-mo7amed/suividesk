import React from 'react';
import { 
  X, 
  ClockAlert, 
  AlertTriangle, 
  UserCheck, 
  ChevronRight, 
  BellRing,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskAssignment } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskAssignment[];
  onSelectTask: (task: TaskAssignment) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  // Filter urgent & J-3 tasks
  const urgentTasks = tasks.filter(
    (t) => (t.alert_level === 'j-3' || t.alert_level === 'overdue') && t.statut !== 'Terminée'
  );

  // Group by employee
  const groupedByEmployee = urgentTasks.reduce((acc, task) => {
    const key = `${task.agent_prenom} ${task.agent_nom} (${task.agent_matricule})`;
    if (!acc[key]) {
      acc[key] = {
        name: `${task.agent_prenom} ${task.agent_nom}`,
        matricule: task.agent_matricule || '',
        service: task.agent_service || task.service,
        tasks: []
      };
    }
    acc[key].tasks.push(task);
    return acc;
  }, {} as Record<string, { name: string; matricule: string; service: string; tasks: TaskAssignment[] }>);

  const employeeGroups = Object.values(groupedByEmployee);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen max-w-md shadow-2xl flex flex-col ${
          theme === 'dark' 
            ? 'glass-panel-dark bg-slate-950/90 text-slate-100 border-l border-slate-800' 
            : 'glass-panel-light bg-white/95 text-slate-900 border-l border-slate-200'
        }`}>
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">
                  Centre d'Alertes Échéances CNAS
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {urgentTasks.length} dossier(s) requérant une vigilance immédiate
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {employeeGroups.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Aucune alerte critique
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                  Tous les dossiers sont dans les délais impartis. Aucune échéance J-3 ni retard détecté.
                </p>
              </div>
            ) : (
              employeeGroups.map((group, idx) => (
                <div 
                  key={idx}
                  className={`rounded-2xl p-4 border transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900/40 border-slate-800/80'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  {/* Employee Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/60 mb-3">
                    <div>
                      <div className="text-xs font-bold text-[#0055A5] dark:text-[#00A3E0]">
                        {group.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {group.matricule} • {group.service}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {group.tasks.length} alerte(s)
                    </span>
                  </div>

                  {/* Tasks under this employee */}
                  <div className="space-y-2.5">
                    {group.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          onSelectTask(task);
                          onClose();
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          task.alert_level === 'overdue'
                            ? theme === 'dark'
                              ? 'bg-rose-950/20 border-rose-800/40 hover:bg-rose-950/40'
                              : 'bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : theme === 'dark'
                              ? 'bg-amber-950/20 border-amber-800/40 hover:bg-amber-950/40'
                              : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1 pr-2">
                            <div className="flex items-center space-x-1.5">
                              {task.alert_level === 'overdue' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                              ) : (
                                <ClockAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              )}
                              <span className="text-[11px] font-bold text-white line-clamp-1">
                                {task.titre}
                              </span>
                            </div>

                            {task.reference_dossier && (
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                Réf : {task.reference_dossier}
                              </div>
                            )}
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-400 self-center flex-shrink-0" />
                        </div>

                        {/* Status Chip & Countdown */}
                        <div className="mt-2.5 flex items-center justify-between text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-black ${
                            task.alert_level === 'overdue'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}>
                            {task.delay_text}
                          </span>

                          <span className="text-slate-500 dark:text-slate-400">
                            Échéance : <strong>{task.date_echeance_fr || task.date_echeance}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center text-xs text-slate-500">
            <span>Surveillance proactive CNAS 72h</span>
            <button
              onClick={onClose}
              className="text-[#0055A5] dark:text-[#00A3E0] font-semibold hover:underline"
            >
              Fermer le panneau
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
