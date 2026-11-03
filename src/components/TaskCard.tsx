import React from 'react';
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
  Paperclip
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
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEditTask,
  onDeleteTask
}) => {
  const days =
    task.duree_traitement_jours !== undefined && task.duree_traitement_jours !== null
      ? task.duree_traitement_jours
      : computeTreatmentDays(task.date_debut, task.date_finale);

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

  return (
    <div className="rounded-2xl p-5 flex flex-col justify-between cnas-card text-slate-900">
      {/* Top Badges & Title */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border ${etatStyle.cls}`}
          >
            {etatStyle.icon}
            <span>{getEtatCourrierLabel(task.etat_courrier)}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {task.priorite && (
              <span
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${getPriorityBadge()}`}
              >
                {task.priorite}
              </span>
            )}
          </div>
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

        {/* Metadata Chips: Target Person, Reference, Wilaya */}
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
        </div>

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

      {/* Card Footer: Edit Task in Modal + Delete Task */}
      <div className="mt-4 pt-3 border-t border-[#C6DDF2] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onEditTask(task)}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Modifier la tâche</span>
        </button>

        <button
          type="button"
          onClick={() => onDeleteTask(task)}
          title="Supprimer cette tâche"
          className="p-2 rounded-xl border bg-[#FFE4E6] border-[#FDA4AF] text-[#9F1239] hover:bg-rose-200 transition-colors active:scale-95 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
