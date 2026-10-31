import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  FileText, 
  ClockAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Ban, 
  Trash2, 
  Save, 
  FileCheck2,
  Sliders,
  Building
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskAssignment, TaskStatus } from '../types';

interface TaskDetailModalProps {
  task: TaskAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: number, status: TaskStatus, notes?: string, motifBlocage?: string, progression?: number) => void;
  onDelete: (id: number) => void;
  onEdit: (task: TaskAssignment) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateStatus,
  onDelete,
  onEdit
}) => {
  const { theme } = useTheme();

  if (!isOpen || !task) return null;

  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.statut);
  const [currentProgression, setCurrentProgression] = useState<number>(task.progression);
  const [currentNotes, setCurrentNotes] = useState<string>(task.notes || '');
  const [currentMotifBlocage, setCurrentMotifBlocage] = useState<string>(task.motif_blocage || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateStatus(
      task.id,
      currentStatus,
      currentNotes,
      currentStatus === 'Bloquée' ? currentMotifBlocage : undefined,
      currentProgression
    );
    setIsSaving(false);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Confirmez-vous la suppression définitive du dossier "${task.titre}" ?`)) {
      onDelete(task.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className={`relative w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl transition-all border ${
        theme === 'dark' 
          ? 'glass-panel-dark bg-slate-950/90 text-slate-100 border-slate-800' 
          : 'glass-panel-light bg-white/95 text-slate-900 border-slate-200'
      }`}>
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/80">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#0055A5] dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/40">
                {task.service}
              </span>
              <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                task.priorite === 'Urgente'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
              }`}>
                Priorité {task.priorite}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
              {task.titre}
            </h2>
            {task.reference_dossier && (
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Réf. Bordereau : <strong>{task.reference_dossier}</strong>
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-6 max-h-[65vh] overflow-y-auto pr-1">
          
          {/* Smart Alert Banner */}
          {(task.alert_level === 'j-3' || task.alert_level === 'overdue') && task.statut !== 'Terminée' && (
            <div className={`p-4 rounded-2xl border flex items-center space-x-3 ${
              task.alert_level === 'overdue'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}>
              {task.alert_level === 'overdue' ? (
                <AlertTriangle className="w-6 h-6 text-rose-500 flex-shrink-0" />
              ) : (
                <ClockAlert className="w-6 h-6 text-amber-500 flex-shrink-0 animate-pulse" />
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {task.alert_level === 'overdue' ? 'Échéance Dépassée' : 'Alerte Proactive J-3'}
                </div>
                <div className="text-xs mt-0.5 font-medium">
                  {task.delay_text} • Date limite fixée au {task.date_echeance_fr || task.date_echeance}.
                </div>
              </div>
            </div>
          )}

          {/* Assigned Employee & Dates Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Agent info */}
            <div className={`p-4 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1">
                <User className="w-3 h-3 text-[#00A3E0]" />
                <span>Agent Assigné</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0055A5] to-[#00A3E0] text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {task.agent_prenom?.[0]}{task.agent_nom?.[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {task.agent_prenom} {task.agent_nom}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Matricule : {task.agent_matricule}
                  </div>
                  <div className="text-[11px] text-[#0055A5] dark:text-cyan-400 font-semibold">
                    Service {task.agent_service}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates info */}
            <div className={`p-4 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-[#00A3E0]" />
                <span>Période d'Exécution</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date de démarrage :</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {task.date_debut_fr || task.date_debut}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date d'échéance :</span>
                  <span className="font-bold text-[#0055A5] dark:text-cyan-400">
                    {task.date_echeance_fr || task.date_echeance}
                  </span>
                </div>
                {task.date_completion && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Clôturé le :</span>
                    <span className="font-bold">{task.date_completion}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Description & Instructions */}
          {task.description && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Instructions et Contexte
              </label>
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                theme === 'dark' ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                {task.description}
              </div>
            </div>
          )}

          {/* Status Stepper / Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Statut Opérationnel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['En attente', 'En cours', 'Terminée', 'Bloquée'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setCurrentStatus(st);
                    if (st === 'Terminée') setCurrentProgression(100);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    currentStatus === st
                      ? st === 'Terminée'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : st === 'Bloquée'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : 'bg-[#0055A5] text-white border-[#0055A5] shadow-md'
                      : theme === 'dark'
                        ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Blocking Reason if "Bloquée" */}
          {currentStatus === 'Bloquée' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-[11px] font-bold uppercase tracking-wider text-rose-500 flex items-center space-x-1">
                <Ban className="w-3.5 h-3.5" />
                <span>Motif du Blocage</span>
              </label>
              <input
                type="text"
                value={currentMotifBlocage}
                onChange={(e) => setCurrentMotifBlocage(e.target.value)}
                placeholder="Précisez la cause du blocage (ex: attente pièce employeur, recours juridique...)"
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium border ${
                  theme === 'dark' ? 'glass-input-dark border-rose-800/60' : 'glass-input-light border-rose-300'
                }`}
              />
            </div>
          )}

          {/* Progression Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400 uppercase tracking-wider text-[11px]">Avancement de la Tâche</span>
              <span className="text-[#0055A5] dark:text-cyan-400 font-extrabold">{currentProgression}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={currentProgression}
              onChange={(e) => setCurrentProgression(Number(e.target.value))}
              className="w-full accent-[#0055A5] h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Notes & Observations Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Notes & Observations Internes
            </label>
            <textarea
              rows={3}
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Ajoutez des précisions d'audit, échanges téléphoniques ou points d'étape..."
              className={`w-full p-3 rounded-2xl text-xs font-medium ${
                theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
              }`}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span>Modifier fiche</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Annuler
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-md hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
