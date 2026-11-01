import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  ClockAlert, 
  AlertTriangle, 
  Ban, 
  Trash2, 
  Save
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
    if (window.confirm(`Supprimer définitivement la tâche "${task.titre}" ?`)) {
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
      <div className="relative w-full max-w-xl rounded-2xl p-6 shadow-2xl transition-all border border-slate-800 bg-[#090e1f] text-slate-100 overflow-visible glass-panel-dark">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="space-y-1 pr-4">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-950/80 border border-cyan-800/60 text-cyan-300">
                {task.service}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                {task.priorite}
              </span>
            </div>
            <h2 className="text-base font-bold text-white leading-snug">
              {task.titre}
            </h2>
            {task.reference_dossier && (
              <p className="text-xs font-mono text-slate-400">
                Réf : {task.reference_dossier}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1 overflow-visible">
          
          {/* Alert Banner if active */}
          {(task.alert_level === 'j-3' || task.alert_level === 'overdue') && task.statut !== 'Terminée' && (
            <div className={`p-3 rounded-xl border flex items-center space-x-2.5 ${
              task.alert_level === 'overdue'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}>
              {task.alert_level === 'overdue' ? (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ClockAlert className="w-4 h-4 flex-shrink-0" />
              )}
              <div className="text-xs font-semibold">
                {task.delay_text} • Échéance : {task.date_echeance_fr || task.date_echeance}
              </div>
            </div>
          )}

          {/* Employee Section */}
          {(task.agent_nom || task.agent_prenom) && (
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 flex items-center justify-center font-bold text-xs">
                  {task.agent_prenom?.[0] || ''}{task.agent_nom?.[0] || ''}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {task.agent_prenom} {task.agent_nom}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Matricule : {task.agent_matricule || 'N/A'} • Pôle : {task.service}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dates & Planning */}
          <div className={`p-3 rounded-xl border text-xs ${
            theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-[#00A3E0]" />
                  <span>Date Début</span>
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  {task.date_debut_fr || task.date_debut}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                  Échéance Réglementaire
                </div>
                <div className="font-bold text-[#0055A5] dark:text-cyan-400">
                  {task.date_echeance_fr || task.date_echeance}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="text-xs text-slate-600 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
              {task.description}
            </div>
          )}

          {/* Status Stepper Buttons */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Statut
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['En attente', 'En cours', 'Terminée', 'Bloquée'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setCurrentStatus(st);
                    if (st === 'Terminée') setCurrentProgression(100);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    currentStatus === st
                      ? st === 'Terminée'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : st === 'Bloquée'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-[#0055A5] text-white border-[#0055A5]'
                      : theme === 'dark'
                        ? 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Blocking Reason */}
          {currentStatus === 'Bloquée' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
                Motif du Blocage
              </label>
              <input
                type="text"
                value={currentMotifBlocage}
                onChange={(e) => setCurrentMotifBlocage(e.target.value)}
                placeholder="Raison du blocage..."
                className={`w-full px-3 py-1.5 rounded-xl text-xs ${
                  theme === 'dark' ? 'glass-input-dark border-rose-800' : 'glass-input-light border-rose-300'
                }`}
              />
            </div>
          )}

          {/* Progression Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Avancement</span>
              <span className="text-[#0055A5] dark:text-cyan-400 font-bold">{currentProgression}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={currentProgression}
              onChange={(e) => setCurrentProgression(Number(e.target.value))}
              className="w-full accent-[#0055A5] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Notes & Observations
            </label>
            <textarea
              rows={2}
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Remarques éventuelles..."
              className={`w-full p-2.5 rounded-xl text-xs ${
                theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
              }`}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
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
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Modifier
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Fermer
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-sm hover:opacity-90 active:scale-95"
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
