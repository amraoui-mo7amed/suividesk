import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Employee, TaskTemplate, TaskPriority, CNASService } from '../types';
import { CustomSelect, Option } from './CustomSelect';

interface TaskAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  templates: TaskTemplate[];
  onTaskAssigned: () => void;
  preselectedTemplate?: TaskTemplate | null;
}

export const TaskAssignModal: React.FC<TaskAssignModalProps> = ({
  isOpen,
  onClose,
  employees,
  templates,
  onTaskAssigned,
  preselectedTemplate
}) => {
  const { theme } = useTheme();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [service, setService] = useState<CNASService | string>('Recouvrement');
  const [priorite, setPriorite] = useState<TaskPriority>('Moyenne');
  const [agentId, setAgentId] = useState<string>('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');
  const [referenceDossier, setReferenceDossier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize dates
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;
      setDateDebut(todayStr);

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);
      const dy = deadline.getFullYear();
      const dm = String(deadline.getMonth() + 1).padStart(2, '0');
      const dd = String(deadline.getDate()).padStart(2, '0');
      setDateEcheance(`${dy}-${dm}-${dd}`);

      if (preselectedTemplate) {
        applyTemplate(preselectedTemplate);
      } else {
        setSelectedTemplateId('');
      }

      if (employees.length > 0 && !agentId) {
        setAgentId(String(employees[0].id));
      }
    }
  }, [isOpen, preselectedTemplate]);

  const applyTemplate = (tpl: TaskTemplate) => {
    setSelectedTemplateId(String(tpl.id));
    setTitre(tpl.titre);
    setDescription(tpl.instructions_type || tpl.description || '');
    setService(tpl.service);
    setPriorite(tpl.priorite_defaut);

    const start = dateDebut ? new Date(dateDebut) : new Date();
    const estDeadline = new Date(start.getTime());
    estDeadline.setDate(estDeadline.getDate() + (tpl.duree_estimee_jours || 3));
    const dy = estDeadline.getFullYear();
    const dm = String(estDeadline.getMonth() + 1).padStart(2, '0');
    const dd = String(estDeadline.getDate()).padStart(2, '0');
    setDateEcheance(`${dy}-${dm}-${dd}`);
  };

  const handleTemplateChange = (val: string) => {
    setSelectedTemplateId(val);
    if (val) {
      const found = templates.find((t) => String(t.id) === val);
      if (found) {
        applyTemplate(found);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!titre.trim()) {
      setErrorMsg('Veuillez indiquer l’intitulé.');
      return;
    }
    if (!agentId) {
      setErrorMsg('Veuillez sélectionner un collaborateur.');
      return;
    }
    if (!dateDebut || !dateEcheance) {
      setErrorMsg('Veuillez renseigner les dates.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (window.electronAPI) {
        await window.electronAPI.createTask({
          template_id: selectedTemplateId ? Number(selectedTemplateId) : null,
          titre,
          description,
          service,
          priorite,
          statut: 'En attente',
          agent_id: Number(agentId),
          date_debut: dateDebut,
          date_echeance: dateEcheance,
          reference_dossier: referenceDossier.trim() || null,
          progression: 0
        });
      }

      onTaskAssigned();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Options formatting for CustomSelect
  const templateOptions: Option[] = [
    { value: '', label: '-- Tâche libre personnalisée --' },
    ...templates.map((tpl) => ({
      value: String(tpl.id),
      label: `[${tpl.code}] ${tpl.titre}`,
      subtitle: `Pôle : ${tpl.service} • Délai prescrit : ${tpl.duree_estimee_jours} jours`
    }))
  ];

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
    subtitle: `Matricule : ${emp.matricule} • ${emp.service} • ${emp.active_tasks_count || 0} dossiers actifs`
  }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className={`relative w-full max-w-xl rounded-2xl p-6 shadow-2xl transition-all border overflow-visible ${
        theme === 'dark' 
          ? 'glass-panel-dark bg-slate-950 text-slate-100 border-slate-800' 
          : 'glass-panel-light bg-white text-slate-900 border-slate-200'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Affecter une Nouvelle Tâche
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
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body with overflow-visible selects and non-truncating text */}
        <form onSubmit={handleSubmit} className="py-3 space-y-3.5 overflow-visible">
          
          {/* Template Custom Select with full text wrapping */}
          <div className="overflow-visible">
            <CustomSelect
              label="Modèle depuis Catalogue (Facultatif)"
              options={templateOptions}
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              searchable
              placeholder="Sélectionner un modèle type..."
            />
          </div>

          {/* Intitulé with textarea for full visibility without truncation */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Intitulé *
            </label>
            <textarea
              required
              rows={2}
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Intitulé complet du dossier..."
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold leading-relaxed resize-none ${
                theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
              }`}
            />
          </div>

          {/* Dossier Ref & Service Custom Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Réf. Dossier
              </label>
              <input
                type="text"
                value={referenceDossier}
                onChange={(e) => setReferenceDossier(e.target.value)}
                placeholder="Ex: DOS-2026-001"
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
            </div>

            <div className="overflow-visible">
              <CustomSelect
                label="Pôle / Service *"
                options={serviceOptions}
                value={service}
                onChange={(val) => setService(val)}
              />
            </div>
          </div>

          {/* Priority & Assignee Agent Custom Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
            <div className="overflow-visible">
              <CustomSelect
                label="Priorité *"
                options={priorityOptions}
                value={priorite}
                onChange={(val) => setPriorite(val as TaskPriority)}
              />
            </div>

            <div className="overflow-visible">
              <CustomSelect
                label="Collaborateur *"
                options={employeeOptions}
                value={agentId}
                onChange={(val) => setAgentId(val)}
                searchable
                placeholder="Sélectionner un collaborateur..."
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Date Début
              </label>
              <input
                type="date"
                required
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#0055A5] dark:text-cyan-400 block mb-1">
                Date Échéance *
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
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Instructions & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Consignes et spécifications..."
              className={`w-full p-2.5 rounded-xl text-xs font-medium leading-relaxed ${
                theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
              }`}
            />
          </div>

          {/* Actions */}
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
              {isSubmitting ? 'Affectation...' : 'Valider'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
