import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ClipboardList,
  Clock,
  AlertCircle,
  MapPin,
  Paperclip,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2,
  User,
  Plus
} from 'lucide-react';
import {
  TaskItem,
  TaskDocument,
  TaskAttachmentInput,
  Employee,
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
  employees?: Employee[];
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

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-sky-600" />;
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
  }
  if (ext === 'pdf') {
    return <FileText className="w-4 h-4 text-rose-600" />;
  }
  return <FileText className="w-4 h-4 text-[#005A9E]" />;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  employees = [],
  taskToEdit,
  onSaved
}) => {
  const isEditMode = Boolean(taskToEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected agent
  const [selectedAgentId, setSelectedAgentId] = useState<number>(employeeId);

  // All 13 optional fields
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

  // Documents attached to this task
  const [existingDocs, setExistingDocs] = useState<TaskDocument[]>([]);
  const [removedDocIds, setRemovedDocIds] = useState<number[]>([]);
  const [newAttachments, setNewAttachments] = useState<TaskAttachmentInput[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      value: String(e.id),
      label: [e.civilite, e.full_name || `Employé #${e.id}`].filter(Boolean).join(' ')
    }));
  }, [employees]);

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
      setIsDragging(false);
      setRemovedDocIds([]);
      setNewAttachments([]);

      if (taskToEdit) {
        setSelectedAgentId(taskToEdit.agent_id ? Number(taskToEdit.agent_id) : employeeId);
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
        setExistingDocs(taskToEdit.documents || []);
      } else {
        setSelectedAgentId(employeeId || (employees[0] ? employees[0].id : 0));
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
        setExistingDocs([]);
      }
    }
  }, [isOpen, taskToEdit, employeeId, employees]);

  if (!isOpen) return null;

  const liveTreatmentDays = computeTreatmentDays(dateDebut, dateFinale);

  const handlePickFiles = async () => {
    if (window.electronAPI?.pickMultipleDocuments) {
      const res = await window.electronAPI.pickMultipleDocuments();
      if (!res.canceled && res.files && res.files.length > 0) {
        setNewAttachments((prev) => [
          ...prev,
          ...res.files.map((f) => ({
            name: f.name,
            sourcePath: f.sourcePath,
            size: f.size
          }))
        ]);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleBrowserFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setNewAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            base64: String(reader.result || '')
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const fileWithPath = file as File & { path?: string };
        if (fileWithPath.path) {
          setNewAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              sourcePath: fileWithPath.path,
              size: file.size
            }
          ]);
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            setNewAttachments((prev) => [
              ...prev,
              {
                name: file.name,
                size: file.size,
                base64: String(reader.result || '')
              }
            ]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalAgentId = selectedAgentId || employeeId;
    if (!finalAgentId || finalAgentId <= 0) {
      setErrorMsg(
        'Veuillez obligatoirement sélectionner un collaborateur pour cette tâche. Une tâche doit toujours être liée à un employé.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<TaskItem> & {
        attachments?: TaskAttachmentInput[];
        removedDocIds?: number[];
      } = {
        agent_id: finalAgentId,
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
        note_finale: noteFinale.trim(),
        attachments: newAttachments,
        removedDocIds
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

  const visibleExistingDocs = existingDocs.filter((d) => !removedDocIds.includes(d.id));
  const totalDocsCount = visibleExistingDocs.length + newAttachments.length;

  const inputClass = 'w-full px-3 py-2 rounded-xl text-xs font-semibold cnas-input';
  const labelClass = 'text-[11px] font-bold uppercase tracking-wider text-[#1E3A5F] block mb-1';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl rounded-2xl shadow-2xl transition-all my-auto max-h-[92vh] flex flex-col cnas-panel text-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#B4D1EC] bg-[#EBF4FC] flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#003A6B]">
                {isEditMode ? 'Modifier la Tâche' : 'Ajouter une Nouvelle Tâche'}
              </h2>
              <p className="text-[11px] font-medium text-slate-600">
                Champs du courrier, dates de suivi et pièces jointes (PDF, CSV, Images)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-[#FFE4E6] border border-[#FDA4AF] text-[#881337] text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Row 1: Titre & Sujet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nom de la Tâche / Titre</label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: Traitement réclamation affilié"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Objet / Sujet</label>
              <input
                type="text"
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="Ex: Recours indemnités journalières"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 2: Personne Cible & Référence Dossier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Personne Cible (Destinataire)</label>
              <input
                type="text"
                value={personneCible}
                onChange={(e) => setPersonneCible(e.target.value)}
                placeholder="Ex: M. Hadj Ahmed"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Référence du Dossier</label>
              <input
                type="text"
                value={referenceDossier}
                onChange={(e) => setReferenceDossier(e.target.value)}
                placeholder="Ex: CNAS/2026/REC-889"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 3: Wilaya & Priorité & État */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <CustomSelect
                label="Wilaya (69 Wilayas)"
                options={wilayaOptions}
                value={wilaya}
                onChange={(val) => setWilaya(val)}
                searchable
                searchPlaceholder="Rechercher wilaya..."
                icon={<MapPin className="w-3.5 h-3.5" />}
              />
            </div>

            <div>
              <CustomSelect
                label="Priorité"
                options={PRIORITY_OPTIONS}
                value={priorite}
                onChange={(val) => setPriorite(val as TaskPriority)}
              />
            </div>

            <div>
              <CustomSelect
                label="État du Courrier"
                options={ETAT_OPTIONS}
                value={etatCourrier}
                onChange={(val) => setEtatCourrier(val as EtatCourrier)}
              />
            </div>
          </div>

          {/* Row 4: Dates Courrier & Distribution */}
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

          {/* Row 5: Date début & finale + Calcul automatique durée */}
          <div className="p-3 rounded-xl border bg-[#EAF4FC] border-[#9CC0E2] space-y-2">
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

            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="flex items-center space-x-1.5 font-bold text-[#003A6B]">
                <Clock className="w-3.5 h-3.5 text-[#005A9E]" />
                <span>Durée de traitement :</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg font-black bg-[#005A9E] text-white">
                {liveTreatmentDays !== null
                  ? `${liveTreatmentDays} ${Math.abs(liveTreatmentDays) <= 1 ? 'jour' : 'jours'}`
                  : '—'}
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MULTI-DOCUMENT ATTACHMENT SECTION (PDF, CSV, IMAGES...) */}
          {/* ======================================================== */}
          <div className="p-3.5 rounded-xl border bg-[#F4F9FF] border-[#93C0E8] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-[#005A9E]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#003A6B]">
                  Documents & Pièces Jointes ({totalDocsCount})
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-600">
                PDF, Tableurs CSV/Excel, Images (PNG/JPG)
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.docx,.doc"
              className="hidden"
              onChange={(e) => handleBrowserFiles(e.target.files)}
            />

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={handlePickFiles}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-3.5 text-center transition-all ${
                isDragging
                  ? 'border-[#005A9E] bg-[#DCEBFA]'
                  : 'border-[#93C0E8] hover:border-[#005A9E] bg-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-2 text-xs font-bold text-[#003A6B]">
                <Upload className="w-4 h-4 text-[#005A9E]" />
                <span>Cliquez pour parcourir ou glissez vos fichiers ici</span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                Chaque tâche peut avoir plusieurs documents joints (PDF, CSV, Images, etc.)
              </p>
            </div>

            {/* List of Attached Documents */}
            {totalDocsCount > 0 && (
              <div className="space-y-1.5 pt-1">
                {/* Existing Documents */}
                {visibleExistingDocs.map((doc) => (
                  <div
                    key={`exist-${doc.id}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#C6DDF2] text-xs"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {getFileIcon(doc.file_name)}
                      <span className="font-bold text-[#003A6B] truncate max-w-[260px] sm:max-w-md">
                        {doc.file_name}
                      </span>
                      {doc.file_size ? (
                        <span className="text-[10px] font-medium text-slate-500">
                          ({formatFileSize(doc.file_size)})
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      title="Supprimer ce document"
                      onClick={() => setRemovedDocIds((prev) => [...prev, doc.id])}
                      className="p-1 rounded-md text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Newly Staged Documents */}
                {newAttachments.map((att, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#E6F4EA] border border-[#A7F3D0] text-xs"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {getFileIcon(att.name)}
                      <span className="font-bold text-[#14532D] truncate max-w-[240px] sm:max-w-sm">
                        {att.name}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                        Nouveau
                      </span>
                      {att.size ? (
                        <span className="text-[10px] font-medium text-slate-600">
                          ({formatFileSize(att.size)})
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      title="Annuler l'ajout"
                      onClick={() =>
                        setNewAttachments((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1 rounded-md text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 6: Notes */}
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

          </div>

          {/* Fixed Footer Buttons */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-[#B4D1EC] bg-[#EBF4FC] flex items-center justify-end space-x-2.5 flex-shrink-0">
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
