import React, { useState, useEffect, useMemo } from 'react';
import { X, ClipboardList, Clock, AlertCircle, MapPin } from 'lucide-react';
import {
  TaskItem,
  EtatCourrier,
  TaskPriority,
  ALGERIA_WILAYAS,
  computeTreatmentDays
} from '../types';
import { CustomSelect } from './CustomSelect';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
  taskToEdit?: TaskItem | null;
  onSaved: (message: string) => void;
}

const PRIORITY_OPTIONS = [
  { value: '', label: '— Sélectionner —' },
  { value: 'Basse', label: 'Basse' },
  { value: 'Moyenne', label: 'Moyenne' },
  { value: 'Haute', label: 'Haute' },
  { value: 'Urgente', label: 'Urgente' }
];

const ETAT_OPTIONS = [
  { value: '', label: '— Sélectionner —' },
  { value: 'traite', label: 'Traité' },
  { value: 'non_traite', label: 'Non traité' },
  { value: 'en_cours', label: 'En cours de traitement' }
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  taskToEdit,
  onSaved
}) => {
  const isEditMode = Boolean(taskToEdit);

  // All 13 optional fields specified in workflow.md
  const [titre, setTitre] = useState('');
  const [sujet, setSujet] = useState('');
  const [personneCible, setPersonneCible] = useState('');
  const [referenceDossier, setReferenceDossier] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [priorite, setPriorite] = useState<TaskPriority>('');
  const [dateCourrier, setDateCourrier] = useState('');
  const [dateDistribution, setDateDistribution] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFinale, setDateFinale] = useState('');
  const [etatCourrier, setEtatCourrier] = useState<EtatCourrier>('');
  const [note, setNote] = useState('');
  const [noteFinale, setNoteFinale] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wilayaOptions = useMemo(
    () => [
      { value: '', label: '— Sélectionner (69 Wilayas) —' },
      ...ALGERIA_WILAYAS.map((w) => ({ value: w, label: w }))
    ],
    []
  );

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsSubmitting(false);

      if (taskToEdit) {
        setTitre(taskToEdit.titre || '');
        setSujet(taskToEdit.sujet || '');
        setPersonneCible(taskToEdit.personne_cible || '');
        setReferenceDossier(taskToEdit.reference_dossier || '');
        setWilaya(taskToEdit.wilaya || '');
        setPriorite((taskToEdit.priorite as TaskPriority) || '');
        setDateCourrier(taskToEdit.date_courrier || '');
        setDateDistribution(taskToEdit.date_distribution || '');
        setDateDebut(taskToEdit.date_debut || '');
        setDateFinale(taskToEdit.date_finale || '');
        setEtatCourrier((taskToEdit.etat_courrier as EtatCourrier) || '');
        setNote(taskToEdit.note || '');
        setNoteFinale(taskToEdit.note_finale || '');
      } else {
        setTitre('');
        setSujet('');
        setPersonneCible('');
        setReferenceDossier('');
        setWilaya('');
        setPriorite('');
        setDateCourrier('');
        setDateDistribution('');
        setDateDebut('');
        setDateFinale('');
        setEtatCourrier('');
        setNote('');
        setNoteFinale('');
      }
    }
  }, [isOpen, taskToEdit]);

  if (!isOpen) return null;

  const liveTreatmentDays = computeTreatmentDays(dateDebut, dateFinale);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setIsSubmitting(true);
      const payload: Partial<TaskItem> = {
        agent_id: employeeId,
        titre: titre.trim(),
        sujet: sujet.trim(),
        personne_cible: personneCible.trim(),
        reference_dossier: referenceDossier.trim(),
        wilaya: wilaya.trim(),
        priorite,
        date_courrier: dateCourrier,
        date_distribution: dateDistribution,
        date_debut: dateDebut,
        date_finale: dateFinale,
        etat_courrier: etatCourrier,
        note: note.trim(),
        note_finale: noteFinale.trim()
      };

      if (window.electronAPI) {
        if (isEditMode && taskToEdit) {
          const res = await window.electronAPI.updateTask(taskToEdit.id, payload);
          if (!res.success) {
            setErrorMsg(res.error || 'Erreur lors de la modification de la tâche.');
            return;
          }
          onSaved('Tâche mise à jour avec succès.');
        } else {
          const res = await window.electronAPI.createTask(payload);
          if (!res.success) {
            setErrorMsg(res.error || 'Erreur lors de l’ajout de la tâche.');
            return;
          }
          onSaved('Nouvelle tâche assignée avec succès.');
        }
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-xl text-xs font-semibold cnas-input';
  const labelClass =
    'text-[11px] font-bold uppercase tracking-wider text-[#1E3A5F] block mb-1.5';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl transition-all my-auto cnas-panel text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#B4D1EC]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center">
              <ClipboardList className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#003A6B]">
                {isEditMode ? 'Modifier la Tâche' : 'Ajouter une Nouvelle Tâche'}
              </h2>
              <p className="text-[11px] font-medium text-slate-600">
                Assignée à : <strong className="text-[#003A6B]">{employeeName}</strong> • Tous les champs sont optionnels
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#FFE4E6] border border-[#FDA4AF] text-[#881337] text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-3.5 max-h-[72vh] overflow-y-auto pr-1"
        >
          {/* Row 1: Task Name & Task Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nom de la Tâche</label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: Traitement dossier prestation"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Objet de la Tâche (Sujet)</label>
              <input
                type="text"
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="Ex: Vérification et régularisation"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 2: Target Person & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Personne Concernée / Destinataire</label>
              <input
                type="text"
                value={personneCible}
                onChange={(e) => setPersonneCible(e.target.value)}
                placeholder="À qui cette tâche est destinée..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Référence</label>
              <input
                type="text"
                value={referenceDossier}
                onChange={(e) => setReferenceDossier(e.target.value)}
                placeholder="Ex: REF-CNAS-2026-041"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          {/* Row 3: Wilaya (69 Wilayas, Searchable & Portal Overflowed), Priority, Etat de courrier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-visible">
            <CustomSelect
              label="Wilaya (01 – 69)"
              options={wilayaOptions}
              value={wilaya}
              onChange={(val) => setWilaya(val)}
              searchable
              searchPlaceholder="Code (01-69) ou nom de wilaya..."
              icon={<MapPin className="w-3.5 h-3.5" />}
              placeholder="— Sélectionner —"
            />

            <CustomSelect
              label="Priorité"
              options={PRIORITY_OPTIONS}
              value={priorite}
              onChange={(val) => setPriorite(val as TaskPriority)}
              placeholder="— Sélectionner —"
            />

            <CustomSelect
              label="État de Courrier"
              options={ETAT_OPTIONS}
              value={etatCourrier}
              onChange={(val) => setEtatCourrier(val as EtatCourrier)}
              placeholder="— Sélectionner —"
            />
          </div>

          {/* Row 4: Dates du courrier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date de Courrier</label>
              <input
                type="date"
                value={dateCourrier}
                onChange={(e) => setDateCourrier(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Date de Distribution de Courrier</label>
              <input
                type="date"
                value={dateDistribution}
                onChange={(e) => setDateDistribution(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 5: Date de début & Date finale + Live Durée de traitement */}
          <div className="p-3.5 rounded-xl border bg-[#EAF4FC] border-[#9CC0E2] space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Date de Début</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Date Finale</label>
                <input
                  type="date"
                  value={dateFinale}
                  onChange={(e) => setDateFinale(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="flex items-center space-x-1.5 font-bold text-[#003A6B]">
                <Clock className="w-3.5 h-3.5 text-[#005A9E]" />
                <span>Durée de traitement (Date finale − Date de début) :</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg font-black bg-[#005A9E] text-white">
                {liveTreatmentDays !== null
                  ? `${liveTreatmentDays} ${Math.abs(liveTreatmentDays) <= 1 ? 'jour' : 'jours'}`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Row 6: La note & La note finale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>La Note</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Observations initiales ou intermédiaires..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>La Note Finale</label>
              <textarea
                rows={2}
                value={noteFinale}
                onChange={(e) => setNoteFinale(e.target.value)}
                placeholder="Conclusion ou note de clôture..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3.5 border-t border-[#B4D1EC] flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'Enregistrement...'
                : isEditMode
                  ? 'Enregistrer les modifications'
                  : 'Ajouter la tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
