import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertCircle,
  UserPlus,
  UserCheck,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Employee, TaskTemplate, CNASService } from '../types';
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

  // Mode: 'new' (add new employee) or 'existing' (select existing)
  const [employeeMode, setEmployeeMode] = useState<'new' | 'existing'>('new');

  // New Employee fields
  const [empNom, setEmpNom] = useState('');
  const [empPrenom, setEmpPrenom] = useState('');
  const [empMatricule, setEmpMatricule] = useState('');
  const [empService, setEmpService] = useState<CNASService | string>('Recouvrement');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // Task fields strictly limited to Task Name, Deadline, and Description (with other details)
  const [taskName, setTaskName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsSubmitting(false);

      // Default deadline to +3 days from today
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      const dy = defaultDate.getFullYear();
      const dm = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const dd = String(defaultDate.getDate()).padStart(2, '0');
      setDeadline(`${dy}-${dm}-${dd}`);

      if (employees.length > 0) {
        setSelectedAgentId(String(employees[0].id));
      } else {
        setEmployeeMode('new');
        setSelectedAgentId('');
      }

      // Pre-fill if preselectedTemplate
      if (preselectedTemplate) {
        setTaskName(preselectedTemplate.titre);
        setDescription(preselectedTemplate.instructions_type || preselectedTemplate.description || '');
        setEmpService(preselectedTemplate.service);
      } else {
        setTaskName('');
        setDescription('');
      }

      // Generate a suggestion for matricule
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setEmpMatricule(`EMP-${randomSuffix}`);
      setEmpNom('');
      setEmpPrenom('');
    }
  }, [isOpen, preselectedTemplate, employees]);

  if (!isOpen) return null;

  const serviceOptions: Option[] = [
    { value: 'Recouvrement', label: 'Recouvrement' },
    { value: 'Prestations', label: 'Prestations' },
    { value: 'Contrôle Médical', label: 'Contrôle Médical' },
    { value: 'Contentieux', label: 'Contentieux' },
    { value: 'Informatique', label: 'Informatique' },
    { value: 'Ressources Humaines', label: 'Ressources Humaines (RH)' }
  ];

  const employeeOptions: Option[] = employees.map((emp) => ({
    value: String(emp.id),
    label: `${emp.nom} ${emp.prenom} (${emp.matricule})`,
    subtitle: `Pôle : ${emp.service}`
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!taskName.trim()) {
      setErrorMsg('Veuillez indiquer le nom de la tâche.');
      return;
    }

    if (!deadline) {
      setErrorMsg('Veuillez renseigner la date d’échéance.');
      return;
    }

    let targetAgentId: number | null = null;
    let targetService = empService;

    if (employeeMode === 'new') {
      if (!empNom.trim() || !empPrenom.trim()) {
        setErrorMsg('Veuillez indiquer le nom et prénom de l’employé.');
        return;
      }
      if (!empMatricule.trim()) {
        setErrorMsg('Veuillez indiquer le matricule de l’employé.');
        return;
      }
    } else {
      if (!selectedAgentId) {
        setErrorMsg('Veuillez sélectionner un collaborateur.');
        return;
      }
      targetAgentId = Number(selectedAgentId);
      const chosen = employees.find((e) => String(e.id) === selectedAgentId);
      if (chosen) {
        targetService = chosen.service;
      }
    }

    try {
      setIsSubmitting(true);

      // 1. Create employee if new
      if (employeeMode === 'new' && window.electronAPI) {
        const empRes = await window.electronAPI.createEmployee({
          matricule: empMatricule.trim().toUpperCase(),
          nom: empNom.trim(),
          prenom: empPrenom.trim(),
          service: empService,
          poste: 'Agent',
          max_capacity: 10
        });
        targetAgentId = empRes.id;
      }

      // 2. Create the task with task name, deadline, and description (all other details)
      if (window.electronAPI) {
        const todayStr = new Date().toISOString().split('T')[0];
        await window.electronAPI.createTask({
          titre: taskName.trim(),
          description: description.trim() || null,
          service: targetService,
          priorite: 'Moyenne',
          statut: 'En attente',
          agent_id: targetAgentId,
          date_debut: todayStr,
          date_echeance: deadline,
          progression: 0
        });
      }

      onTaskAssigned();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l’enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all border border-slate-800 bg-[#090e1f] text-slate-100 overflow-visible glass-panel-dark">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Ajouter un Employé & Sa Tâche
              </h2>
              <p className="text-[11px] text-slate-400">
                Enregistrez le collaborateur avec sa tâche et son échéance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="py-3 space-y-4 overflow-visible">
          
          {/* SECTION 1: Employé */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 overflow-visible">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Collaborateur / Employé</span>
              </span>

              {employees.length > 0 && (
                <div className="flex items-center space-x-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setEmployeeMode('new')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      employeeMode === 'new'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Nouveau
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployeeMode('existing')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      employeeMode === 'existing'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Existant
                  </button>
                </div>
              )}
            </div>

            {employeeMode === 'new' ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={empNom}
                      onChange={(e) => setEmpNom(e.target.value)}
                      placeholder="Nom de famille"
                      className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold glass-input-dark"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={empPrenom}
                      onChange={(e) => setEmpPrenom(e.target.value)}
                      placeholder="Prénom"
                      className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold glass-input-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 overflow-visible">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Matricule *
                    </label>
                    <input
                      type="text"
                      required
                      value={empMatricule}
                      onChange={(e) => setEmpMatricule(e.target.value)}
                      placeholder="Ex: EMP-101"
                      className="w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase glass-input-dark"
                    />
                  </div>
                  <div className="overflow-visible">
                    <CustomSelect
                      label="Pôle / Service *"
                      options={serviceOptions}
                      value={empService}
                      onChange={(val) => setEmpService(val)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-visible">
                <CustomSelect
                  label="Sélectionner le Collaborateur *"
                  options={employeeOptions}
                  value={selectedAgentId}
                  onChange={(val) => setSelectedAgentId(val)}
                  searchable
                  placeholder="Choisir parmi les employés..."
                />
              </div>
            )}
          </div>

          {/* SECTION 2: Tâche (Task Name, Deadline, Description only) */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Sa Tâche & Échéance</span>
            </span>

            {/* Task Name */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Nom de la Tâche *
              </label>
              <input
                type="text"
                required
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Ex: Traitement et validation des bordereaux CNAS"
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-white glass-input-dark"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                Date d’Échéance (Deadline) *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-cyan-300 glass-input-dark"
              />
            </div>

            {/* Description (all other details) */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Description & Autres Détails
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Précisez ici toutes les consignes, détails et spécifications de la tâche..."
                className="w-full px-3 py-2 rounded-xl text-xs font-medium leading-relaxed resize-none glass-input-dark"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Valider'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
