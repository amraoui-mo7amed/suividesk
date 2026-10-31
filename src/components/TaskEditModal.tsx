import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Calendar, 
  User, 
  AlertCircle,
  Edit3
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskAssignment, Employee, TaskPriority, CNASService, TaskStatus } from '../types';

interface TaskEditModalProps {
  task: TaskAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onTaskUpdated: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  employees,
  onTaskUpdated
}) => {
  const { theme } = useTheme();

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [service, setService] = useState<CNASService | string>('Recouvrement');
  const [priorite, setPriorite] = useState<TaskPriority>('Moyenne');
  const [statut, setStatut] = useState<TaskStatus>('En attente');
  const [agentId, setAgentId] = useState<string>('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');
  const [referenceDossier, setReferenceDossier] = useState('');
  const [progression, setProgression] = useState(0);
  const [notes, setNotes] = useState('');
  const [motifBlocage, setMotifBlocage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (task && isOpen) {
      setTitre(task.titre);
      setDescription(task.description || '');
      setService(task.service);
      setPriorite(task.priorite);
      setStatut(task.statut);
      setAgentId(String(task.agent_id));
      setDateDebut(task.date_debut);
      setDateEcheance(task.date_echeance);
      setReferenceDossier(task.reference_dossier || '');
      setProgression(task.progression || 0);
      setNotes(task.notes || '');
      setMotifBlocage(task.motif_blocage || '');
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setErrorMsg('');

    if (!titre.trim()) {
      setErrorMsg('Veuillez indiquer l’intitulé.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (window.electronAPI) {
        await window.electronAPI.updateTask(task.id, {
          titre,
          description,
          service,
          priorite,
          statut,
          agent_id: Number(agentId),
          date_debut: dateDebut,
          date_echeance: dateEcheance,
          reference_dossier: referenceDossier.trim() || null,
          progression,
          notes,
          motif_blocage: statut === 'Bloquée' ? motifBlocage : null
        });
      }
      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className={`relative w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl transition-all border ${
        theme === 'dark' 
          ? 'glass-panel-dark bg-slate-950/95 text-slate-100 border-slate-800' 
          : 'glass-panel-light bg-white/95 text-slate-900 border-slate-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#0055A5] text-white shadow-md">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Modifier la fiche de suivi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mise à jour des paramètres du dossier CNAS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Intitulé *
            </label>
            <input
              type="text"
              required
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold ${
                theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
              }`}
            />
          </div>

          {/* Dossier Ref & Service */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Réf. Dossier / Bordereau
              </label>
              <input
                type="text"
                value={referenceDossier}
                onChange={(e) => setReferenceDossier(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pôle / Service
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              >
                <option value="Recouvrement">Recouvrement</option>
                <option value="Prestations">Prestations</option>
                <option value="Contrôle Médical">Contrôle Médical</option>
                <option value="Contentieux">Contentieux</option>
                <option value="Informatique">Informatique</option>
                <option value="Ressources Humaines">Ressources Humaines</option>
              </select>
            </div>
          </div>

          {/* Priority & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Priorité
              </label>
              <select
                value={priorite}
                onChange={(e) => setPriorite(e.target.value as TaskPriority)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              >
                <option value="Urgente">🔴 Urgente</option>
                <option value="Haute">🟠 Haute</option>
                <option value="Moyenne">🔵 Moyenne</option>
                <option value="Basse">⚪ Basse</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Collaborateur
              </label>
              <select
                value={agentId}
                required
                onChange={(e) => setAgentId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nom} {emp.prenom} ({emp.matricule})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Date de Début
              </label>
              <input
                type="date"
                required
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#0055A5] dark:text-cyan-400">
                Date d'Échéance
              </label>
              <input
                type="date"
                required
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-[#0055A5] dark:text-cyan-300 ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Description & Consignes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full p-3 rounded-2xl text-xs font-medium ${
                theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-md hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isSubmitting ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
