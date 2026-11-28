import React, { useState } from 'react';
import {
  Clock,
  Pencil,
  Trash2,
  UserCheck,
  MapPin,
  Hash,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader,
  StickyNote,
  Paperclip,
  Check,
  ListTodo,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink
} from 'lucide-react';
import {
  TaskItem,
  computeTreatmentDays,
  formatDateFr,
  getEtatCourrierLabel
} from '../types';

interface TaskCardProps {
  task: TaskItem;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  isSelected?: boolean;
  onToggleSelect?: (taskId: number) => void;
  onManageSubtasks?: (task: TaskItem) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEditTask,
  onDeleteTask,
  isSelected = false,
  onToggleSelect,
  onManageSubtasks
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);

  const days =
    task.duree_traitement_jours !== undefined && task.duree_traitement_jours !== null
      ? task.duree_traitement_jours
      : computeTreatmentDays(task.date_debut, task.date_finale);

  const isSubtaskTraite = (s: { statut?: string }) => {
    const st = (s.statut || '').trim().toLowerCase();
    return st === 'traite' || st === 'traité' || st.includes('traité') || st.includes('traite') || st === 'fait' || st === 'terminé' || st === 'termine' || st === 'clos';
  };

  const isSubtaskEnCours = (s: { statut?: string }) => {
    const st = (s.statut || '').trim().toLowerCase();
    return st === 'en_cours' || st === 'en cours' || st.includes('cours') || st.includes('attente');
  };

  const subtasks = (task.subtasks || []).filter((s) => !s.is_deleted);
  const totalSubtasks = subtasks.length;
  const traitesSubtasks = subtasks.filter(isSubtaskTraite).length;
  const enCoursSubtasks = subtasks.filter(isSubtaskEnCours).length;
  const nonTraitesSubtasks = totalSubtasks - traitesSubtasks - enCoursSubtasks;

  const getSubtasksBadgeStyle = () => {
    if (totalSubtasks === 0) return null;
    if (traitesSubtasks === totalSubtasks) {
      return {
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        label: `${traitesSubtasks}/${totalSubtasks} traitée${totalSubtasks > 1 ? 's' : ''}`,
        desc: 'Toutes les sous-tâches sont traitées'
      };
    }
    if (traitesSubtasks > 0 || enCoursSubtasks > 0) {
      return {
        cls: 'bg-amber-50 text-amber-900 border-amber-300',
        label: `${traitesSubtasks}/${totalSubtasks} traitée${traitesSubtasks > 1 ? 's' : ''} (${enCoursSubtasks} en cours)`,
        desc: `${nonTraitesSubtasks} non traitée(s)`
      };
    }
    return {
      cls: 'bg-rose-50 text-rose-800 border-rose-300',
      label: `0/${totalSubtasks} traitée (${nonTraitesSubtasks} en attente)`,
      desc: 'Aucune sous-tâche traitée'
    };
  };

  const subtaskBadge = getSubtasksBadgeStyle();

  const getEtatStyle = () => {
    switch (task.etat_courrier) {
      case 'traite':
        return {
          cls: 'bg-[#DCFCE7] text-[#14532D] border-[#86EFAC]',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />
        };
      case 'en_cours':
        return {
          cls: 'bg-[#DBEAFE] text-[#003A6B] border-[#93C5FD]',
          icon: <Loader className="w-3.5 h-3.5" />
        };
      case 'non_traite':
        return {
          cls: 'bg-[#FFE4E6] text-[#881337] border-[#FDA4AF]',
          icon: <AlertCircle className="w-3.5 h-3.5" />
        };
      default:
        return {
          cls: 'bg-slate-200 text-slate-700 border-slate-300',
          icon: null
        };
    }
  };

  const getPriorityBadge = () => {
    switch (task.priorite) {
      case 'Urgente':
        return 'bg-rose-700 text-white';
      case 'Haute':
        return 'bg-amber-600 text-white';
      case 'Moyenne':
        return 'bg-[#005A9E] text-white';
      case 'Basse':
        return 'bg-slate-600 text-white';
      default:
        return '';
    }
  };

  const etatStyle = getEtatStyle();

  const handleOpenFile = async (filePath?: string, subtaskId?: number) => {
    if (filePath && window.electronAPI?.openFileExternal) {
      await window.electronAPI.openFileExternal(filePath);
      return;
    }
    if (subtaskId && window.electronAPI?.openSubtaskFileExternal) {
      await window.electronAPI.openSubtaskFileExternal(subtaskId);
      return;
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col justify-between cnas-card text-slate-900 transition-all ${
        isSelected
          ? 'ring-2 ring-[#005A9E] bg-[#F0F7FF] shadow-md'
          : 'hover:border-[#9EC3E6]'
      }`}
    >
      {/* Top Badges & Selection Checkbox */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Custom Designed Checkbox for Bulk Transfer */}
          {onToggleSelect && (
            <button
              type="button"
              onClick={() => onToggleSelect(task.id)}
              title={isSelected ? 'Désélectionner cette tâche' : 'Sélectionner pour transfert en lot'}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                isSelected
                  ? 'bg-[#005A9E] border-[#005A9E] text-white shadow-xs'
                  : 'bg-white border-slate-300 hover:border-[#005A9E] text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}

          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border ${etatStyle.cls}`}
            >
              {etatStyle.icon}
              <span>{getEtatCourrierLabel(task.etat_courrier)}</span>
            </span>

            {task.priorite && (
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${getPriorityBadge()}`}
              >
                {task.priorite}
              </span>
            )}
          </div>

          {/* Numéro d'Ordre chip if present */}
          {task.numero_ordre && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#E8F2FA] text-[#003A6B] border border-[#9EC3E6] flex-shrink-0">
              N° {task.numero_ordre}
            </span>
          )}
        </div>

        {/* Task Name & Subject */}
        <div>
          <h3 className="text-sm font-black text-[#003A6B] leading-snug">
            {task.titre || `Tâche #${task.id}`}
          </h3>
          {task.sujet && (
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              <span className="font-extrabold text-[#005A9E]">Objet : </span>
              {task.sujet}
            </p>
          )}
        </div>

        {/* Metadata Chips: Target Person, Reference, Wilaya, Subtasks Badge */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {task.personne_cible && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#E6F2FC] text-[#003A6B] border border-[#9CC0E2]">
              <UserCheck className="w-3.5 h-3.5 text-[#005A9E] flex-shrink-0" />
              <span>Destinataire : {task.personne_cible}</span>
            </span>
          )}

          {task.reference_dossier && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300">
              <Hash className="w-3 h-3 text-slate-600" />
              <span>{task.reference_dossier}</span>
            </span>
          )}

          {task.wilaya && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#005A9E]" />
              <span>{task.wilaya}</span>
            </span>
          )}

          {task.documents && task.documents.length > 0 && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EBF4FC] text-[#005A9E] border border-[#93C0E8]">
              <Paperclip className="w-3 h-3 text-[#005A9E]" />
              <span>
                {task.documents.length} doc{task.documents.length > 1 ? 's' : ''}
              </span>
            </span>
          )}

          {/* Subtasks Status Badge */}
          {subtaskBadge && (
            <button
              type="button"
              onClick={() => onManageSubtasks && onManageSubtasks(task)}
              title="Cliquer pour ouvrir la gestion des sous-tâches"
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer hover:shadow-xs active:scale-95 ${subtaskBadge.cls}`}
            >
              <ListTodo className="w-3 h-3 flex-shrink-0" />
              <span>Sous-tâches : {subtaskBadge.label}</span>
            </button>
          )}
        </div>

        {/* Expandable Sub-tasks Details List */}
        {showSubtasks && totalSubtasks > 0 && (
          <div className="p-3 rounded-xl bg-white border border-[#B4D1EC] space-y-2 shadow-2xs text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] font-black text-[#003A6B] border-b border-slate-100 pb-1.5">
              <span className="flex items-center space-x-1.5">
                <ListTodo className="w-3.5 h-3.5 text-[#005A9E]" />
                <span>Détail des Sous-Tâches ({totalSubtasks})</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                {traitesSubtasks} traitée(s) sur {totalSubtasks}
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {subtasks.map((st, i) => {
                const isTraite = isSubtaskTraite(st);
                const isEnCours = isSubtaskEnCours(st);
                const statusColor = isTraite
                  ? 'bg-emerald-100 text-emerald-800'
                  : isEnCours
                    ? 'bg-blue-100 text-[#003A6B]'
                    : 'bg-rose-100 text-rose-800';
                const statusLabel = st.statut ? st.statut : 'Non traité';

                const subtaskFiles = Array.isArray(st.files) && st.files.length > 0
                  ? st.files
                  : st.file_name
                    ? [{ name: st.file_name, path: st.file_path, type: st.file_type, size: st.file_size }]
                    : [];

                return (
                  <div
                    key={st.id || i}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-[#003A6B] text-[11px] truncate">
                        {st.objet || `Sous-tâche #${i + 1}`}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-600 font-medium">
                      {st.numero_reference && (
                        <span>
                          <strong className="text-slate-800">Réf :</strong> {st.numero_reference}
                        </span>
                      )}
                      {st.numero_ordre && (
                        <span>
                          <strong className="text-slate-800">N° Ordre :</strong> {st.numero_ordre}
                        </span>
                      )}
                      {st.numero_decision && (
                        <span>
                          <strong className="text-slate-800">Décision :</strong> {st.numero_decision}
                        </span>
                      )}
                      {st.date_decision && (
                        <span>
                          <strong className="text-slate-800">Date déc. :</strong> {formatDateFr(st.date_decision)}
                        </span>
                      )}
                    </div>

                    {st.note && (
                      <p className="text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 font-medium">
                        <strong className="text-slate-700">Note :</strong> {st.note}
                      </p>
                    )}

                    {st.note_finale && (
                      <p className="text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-medium">
                        <strong className="text-emerald-900">Note finale :</strong> {st.note_finale}
                      </p>
                    )}

                    {subtaskFiles.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200 space-y-1">
                        <div className="text-[10px] font-bold text-[#003A6B] flex items-center space-x-1">
                          <Paperclip className="w-3 h-3 text-[#005A9E]" />
                          <span>Pièces jointes ({subtaskFiles.length}) :</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {subtaskFiles.map((f, fi) => (
                            <div
                              key={fi}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white border border-[#B4D1EC] text-[10px] text-[#003A6B]"
                            >
                              <FileText className="w-3 h-3 text-[#005A9E] flex-shrink-0" />
                              <span className="truncate max-w-[140px] font-semibold">{f.name}</span>
                              {(f.path || st.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenFile(f.path, st.id)}
                                  className="text-[#005A9E] hover:underline flex items-center ml-0.5 cursor-pointer"
                                  title="Ouvrir le fichier"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dates Grid */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border bg-[#F4F9FF] border-[#B4D1EC] text-[11px]">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-600 block">
              Date Courrier
            </span>
            <span className="font-bold text-slate-900 flex items-center space-x-1 mt-0.5">
              <Calendar className="w-3 h-3 text-[#005A9E]" />
              <span>{formatDateFr(task.date_courrier)}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-600 block">
              Distribution
            </span>
            <span className="font-bold text-slate-900 flex items-center space-x-1 mt-0.5">
              <Calendar className="w-3 h-3 text-[#005A9E]" />
              <span>{formatDateFr(task.date_distribution)}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-600 block">
              Date Début
            </span>
            <span className="font-extrabold text-[#003A6B] block mt-0.5">
              {formatDateFr(task.date_debut)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-600 block">
              Date Finale
            </span>
            <span className="font-extrabold text-[#003A6B] block mt-0.5">
              {formatDateFr(task.date_finale)}
            </span>
          </div>
        </div>

        {/* Prominent Durée de Traitement (Days Only!) */}
        <div className="px-3 py-2 rounded-xl flex items-center justify-between border bg-[#DCEBFA] border-[#93C0E8] text-[#003A6B]">
          <div className="flex items-center space-x-1.5 text-xs font-extrabold">
            <Clock className="w-3.5 h-3.5 text-[#005A9E]" />
            <span>Durée de traitement</span>
          </div>

          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#005A9E] text-white">
            {days !== null
              ? `${days} ${Math.abs(days) <= 1 ? 'jour' : 'jours'}`
              : '—'}
          </span>
        </div>

        {/* Notes (La note & La note finale) */}
        {(task.note || task.note_finale) && (
          <div className="space-y-1.5 pt-1 text-xs">
            {task.note && (
              <div className="p-2.5 rounded-xl border bg-slate-100 border-slate-300 text-slate-800">
                <div className="text-[10px] font-extrabold uppercase text-slate-600 flex items-center space-x-1 mb-0.5">
                  <StickyNote className="w-3 h-3" />
                  <span>La Note</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap break-words font-medium">
                  {task.note}
                </p>
              </div>
            )}

            {task.note_finale && (
              <div className="p-2.5 rounded-xl border bg-[#DCFCE7] border-[#86EFAC] text-[#14532D]">
                <div className="text-[10px] font-extrabold uppercase text-[#166534] mb-0.5">
                  La Note Finale
                </div>
                <p className="leading-relaxed whitespace-pre-wrap break-words font-medium">
                  {task.note_finale}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Edit Task in Modal + Manage Subtasks + Delete Task */}
      <div className="mt-4 pt-3 border-t border-[#C6DDF2] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onEditTask(task)}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Modifier</span>
        </button>

        <button
          type="button"
          onClick={() => onManageSubtasks && onManageSubtasks(task)}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl text-xs font-bold bg-[#EBF4FC] text-[#005A9E] hover:bg-[#DCEBFA] border border-[#B4D1EC] active:scale-95 transition-all cursor-pointer"
          title="Ouvrir la gestion des sous-tâches"
        >
          <ListTodo className="w-3.5 h-3.5 text-[#005A9E]" />
          <span>Sous-tâches ({totalSubtasks})</span>
        </button>

        <button
          type="button"
          onClick={() => onDeleteTask(task)}
          title="Supprimer cette tâche"
          className="p-2 rounded-xl border bg-[#FFE4E6] border-[#FDA4AF] text-[#9F1239] hover:bg-rose-200 transition-colors active:scale-95 cursor-pointer flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
