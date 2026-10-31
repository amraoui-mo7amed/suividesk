import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskAssignment, Employee, TaskPriority, CNASService, TaskStatus } from '../types';
import { CustomSelect, Option } from './CustomSelect';

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

  const serviceOptions: Option[] = [
    { value: 'Recouvrement', label: 'Recouvrement' },
    { value: 'Prestations', label: 'Prestations' },
    { value: 'Contrôle Médical', label: 'Contrôle Médical' },
    { value: 'Contentieux', label: 'Contentieux' },
    { value: 'Informatique', label: 'Informatique' },
    { value: 'Ressources Humaines', label: 'Ressources Humaines (RH)' }
  ];

  const priorityOptions: Option[] = [
    { value: 'Urgente', label: 'Urgente' },
    { value: 'Haute', label: 'Haute' },
    { value: 'Moyenne', label: 'Moyenne' },
    { value: 'Basse', label: 'Basse' }
  ];

  const employeeOptions: Option[] = employees.map((emp) => ({
    value: String(emp.id),
    label: `${emp.nom} ${emp.prenom}`,
    subtitle: `Matricule : ${emp.matricule} • ${emp.service}`
  }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all border overflow-visible ${
        theme === 'dark' 
          ? 'glass-panel-dark bg-slate-950 text-slate-100 border-slate-800' 
          : 'glass-panel-light bg-white text-slate-900 border-slate-200'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Modifier la Tâche
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="py-3 space-y-3.5 overflow-visible">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Intitulé *
            </label>
            <textarea
              required
              rows={2}
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold leading-relaxed resize-none ${
                theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 overflow-visible">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Réf. Dossier
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

            <div className="overflow-visible">
              <CustomSelect
                label="Pôle / Service"
                options={serviceOptions}
                value={service}
                onChange={(val) => setService(val)}
              />
            </div>
          </div>

          <div className="overflow-visible">
            <CustomSelect
              label="Priorité"
              options={priorityOptions}
              value={priorite}
              onChange={(val) => setPriorite(val as TaskPriority)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Date Début
              </label>
              <input
                type="date"
                required
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#0055A5] dark:text-cyan-400 block mb-1">
                Date Échéance
              </label>
              <input
                type="date"
                required
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold text-[#0055A5] dark:text-cyan-300 ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Instructions & Consignes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs font-medium leading-relaxed ${
                theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
              }`}
            />
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
