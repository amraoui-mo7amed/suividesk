import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  BookOpen, 
  Building2, 
  FileCheck, 
  AlertCircle,
  PlusCircle,
  Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Employee, TaskTemplate, TaskPriority, CNASService } from '../types';

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
      } else if (templates.length > 0) {
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

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
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
      setErrorMsg('Veuillez indiquer l’intitulé de la tâche.');
      return;
    }
    if (!agentId) {
      setErrorMsg('Veuillez sélectionner un collaborateur responsable.');
      return;
    }
    if (!dateDebut || !dateEcheance) {
      setErrorMsg('Veuillez renseigner les dates de début et d’échéance.');
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
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#0055A5] to-[#00A3E0] text-white shadow-md">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Affectation & Planification d'une Tâche
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direction CNAS • Attribution opérationnelle d'un dossier
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
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          
          {/* Pick Template from Catalog */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-[#00A3E0]" />
              <span>Choisir un modèle depuis le Catalogue (Facultatif)</span>
            </label>
            <select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium ${
                theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
              }`}
            >
              <option value="">-- Tâche libre personnalisée --</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  [{tpl.code}] {tpl.titre} ({tpl.service} - {tpl.duree_estimee_jours}j)
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Intitulé de la Tâche *
            </label>
            <input
              type="text"
              required
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Mise en demeure cotisations SARL ..."
              className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold ${
                theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
              }`}
            />
          </div>

          {/* Dossier Reference & Service */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Réf. Dossier / Bordereau CNAS
              </label>
              <input
                type="text"
                value={referenceDossier}
                onChange={(e) => setReferenceDossier(e.target.value)}
                placeholder="Ex: BORD-2026-REC-102"
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pôle / Service *
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

          {/* Priority & Assignee Agent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Niveau de Priorité *
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                <span>Collaborateur Responsable *</span>
              </label>
              <select
                value={agentId}
                required
                onChange={(e) => setAgentId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium ${
                  theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                }`}
              >
                <option value="">-- Sélectionner un collaborateur --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nom} {emp.prenom} ({emp.matricule} • {emp.service} • {emp.active_tasks_count || 0} dossiers)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates: Start and Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date de Début</span>
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#0055A5] dark:text-cyan-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Date d'Échéance (Déclenche J-3) *</span>
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

          {/* Description & Instructions */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Instructions & Spécifications du Dossier
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Consignes détaillées, étapes de traitement, pièces justificatives requises..."
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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Affectation en cours...' : 'Planifier & Affecter'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
