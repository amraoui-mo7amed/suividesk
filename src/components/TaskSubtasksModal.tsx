import React, { useState, useEffect } from 'react';
import {
  X,
  ListTodo,
  Plus,
  Trash2,
  Paperclip,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader
} from 'lucide-react';
import { TaskItem, TaskSubtask, TaskSubtaskFile } from '../types';

interface TaskSubtasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onSaved: (message: string) => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-sky-600 flex-shrink-0" />;
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
  }
  if (ext === 'pdf') {
    return <FileText className="w-4 h-4 text-rose-600 flex-shrink-0" />;
  }
  return <FileText className="w-4 h-4 text-[#005A9E] flex-shrink-0" />;
}

export const TaskSubtasksModal: React.FC<TaskSubtasksModalProps> = ({
  isOpen,
  onClose,
  task,
  onSaved
}) => {
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      setErrorMsg('');
      setIsSubmitting(false);
      const cloned: TaskSubtask[] = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
      const normalized = cloned.map((st) => {
        let files = Array.isArray(st.files) ? st.files : [];
        if (files.length === 0 && st.file_name) {
          files = [{
            name: st.file_name,
            path: st.file_path,
            type: st.file_type,
            size: st.file_size
          }];
        }
        return {
          ...st,
          files
        };
      });
      setSubtasks(normalized);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const isSubtaskTraite = (s: TaskSubtask) => {
    const st = (s.statut || '').trim().toLowerCase();
    return st === 'traite' || st === 'traité' || st.includes('traité') || st.includes('traite') || st === 'fait' || st === 'terminé' || st === 'termine' || st === 'clos';
  };

  const isSubtaskEnCours = (s: TaskSubtask) => {
    const st = (s.statut || '').trim().toLowerCase();
    return st === 'en_cours' || st === 'en cours' || st.includes('cours') || st.includes('attente');
  };

  const activeSubtasks = subtasks.filter((s) => !s.is_deleted);
  const traitesCount = activeSubtasks.filter(isSubtaskTraite).length;
  const enCoursCount = activeSubtasks.filter(isSubtaskEnCours).length;
  const nonTraitesCount = activeSubtasks.length - traitesCount - enCoursCount;

  const handleAddSubtask = () => {
    setSubtasks((prev) => [
      ...prev,
      {
        statut: 'Non traité',
        numero_reference: '',
        numero_ordre: '',
        objet: '',
        numero_decision: '',
        date_decision: '',
        note: '',
        note_finale: '',
        files: []
      }
    ]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => {
      const target = prev[index];
      if (target.id) {
        return prev.map((st, i) => (i === index ? { ...st, is_deleted: 1 } : st));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpdateSubtask = (index: number, fields: Partial<TaskSubtask>) => {
    setSubtasks((prev) =>
      prev.map((st, i) => (i === index ? { ...st, ...fields } : st))
    );
  };

  const handleAddSubtaskFiles = (index: number, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);

    Promise.all(
      filesArray.map((file) => {
        return new Promise<TaskSubtaskFile>((resolve) => {
          const fileWithPath = file as File & { path?: string };
          const ext = file.name.split('.').pop() || '';
          if (fileWithPath.path) {
            resolve({
              name: file.name,
              sourcePath: fileWithPath.path,
              path: fileWithPath.path,
              type: ext,
              size: file.size
            });
          } else {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                type: ext,
                size: file.size,
                base64: String(reader.result || '')
              });
            };
            reader.onerror = () => {
              resolve({
                name: file.name,
                type: ext,
                size: file.size
              });
            };
            reader.readAsDataURL(file);
          }
        });
      })
    ).then((newFiles) => {
      setSubtasks((prev) =>
        prev.map((st, i) => {
          if (i !== index) return st;
          const currentFiles = Array.isArray(st.files)
            ? [...st.files]
            : st.file_name
              ? [{ name: st.file_name, path: st.file_path, type: st.file_type, size: st.file_size }]
              : [];
          const merged = [...currentFiles, ...newFiles];
          return {
            ...st,
            files: merged,
            file_name: merged[0]?.name || '',
            file_path: merged[0]?.path || '',
            file_type: merged[0]?.type || '',
            file_size: merged[0]?.size || 0,
            remove_file: false
          };
        })
      );
    });
  };

  const handleRemoveSubtaskFile = (subtaskIndex: number, fileIndex: number) => {
    setSubtasks((prev) =>
      prev.map((st, i) => {
        if (i !== subtaskIndex) return st;
        const currentFiles = Array.isArray(st.files)
          ? [...st.files]
          : st.file_name
            ? [{ name: st.file_name, path: st.file_path, type: st.file_type, size: st.file_size }]
            : [];
        const updated = currentFiles.filter((_, fi) => fi !== fileIndex);
        return {
          ...st,
          files: updated,
          file_name: updated[0]?.name || '',
          file_path: updated[0]?.path || '',
          file_type: updated[0]?.type || '',
          file_size: updated[0]?.size || 0,
          remove_file: updated.length === 0
        };
      })
    );
  };

  const handleOpenFile = async (file: TaskSubtaskFile, subtaskId?: number) => {
    if (file.path && window.electronAPI?.openFileExternal) {
      await window.electronAPI.openFileExternal(file.path);
      return;
    }
    if (subtaskId && window.electronAPI?.openSubtaskFileExternal) {
      await window.electronAPI.openSubtaskFileExternal(subtaskId);
      return;
    }
  };

  const handleSaveSubtasks = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      if (window.electronAPI) {
        const res = await window.electronAPI.updateTask(task.id, {
          ...task,
          subtasks
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Erreur lors de l’enregistrement des sous-tâches.');
          return;
        }

        onSaved('Sous-tâches mises à jour avec succès.');
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl rounded-2xl shadow-2xl transition-all my-auto max-h-[92vh] flex flex-col cnas-panel text-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#B4D1EC] bg-[#EBF4FC] flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCEBFA] border border-[#93C0E8] text-[#005A9E] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-black text-[#003A6B]">
                  Gestion des Sous-Tâches
                </h2>
                {task.numero_ordre && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-[#003A6B] border border-[#9EC3E6]">
                    N° {task.numero_ordre}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-slate-600 truncate max-w-md sm:max-w-xl">
                Tâche parente : <strong className="text-slate-800">{task.titre || `Tâche #${task.id}`}</strong>
                {task.reference_dossier && ` • Réf : ${task.reference_dossier}`}
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-[#FFE4E6] border border-[#FDA4AF] text-[#881337] text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* KPI Summary Banner & Add Button */}
          <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#B4D1EC] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-[#003A6B]">
                {activeSubtasks.length} sous-tâche{activeSubtasks.length > 1 ? 's' : ''} au total :
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{traitesCount} traitée{traitesCount > 1 ? 's' : ''}</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-[#003A6B]">
                <Loader className="w-3 h-3 text-[#005A9E]" />
                <span>{enCoursCount} en cours</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>{nonTraitesCount} non traitée{nonTraitesCount > 1 ? 's' : ''}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddSubtask}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#005A9E] hover:bg-[#004A85] text-white shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une sous-tâche</span>
            </button>
          </div>

          {/* Subtasks List */}
          {activeSubtasks.length === 0 ? (
            <div className="py-12 px-4 rounded-2xl bg-white border-2 border-dashed border-[#B4D1EC] text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#DCEBFA] text-[#005A9E] flex items-center justify-center">
                <ListTodo className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-[#003A6B]">
                Aucune sous-tâche pour le moment
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cliquez sur le bouton « Ajouter une sous-tâche » pour décomposer cette tâche en plusieurs sous-dossiers avec un statut personnalisé, numéros de décision, notes et un ensemble de pièces jointes.
              </p>
              <button
                type="button"
                onClick={handleAddSubtask}
                className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold cnas-btn-primary cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter la première sous-tâche</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subtasks.map((st, idx) => {
                if (st.is_deleted) return null;
                const visibleIndex = subtasks.filter((s, i) => !s.is_deleted && i <= idx).length;
                const filesList: TaskSubtaskFile[] = Array.isArray(st.files) && st.files.length > 0
                  ? st.files
                  : st.file_name
                    ? [{ name: st.file_name, path: st.file_path, type: st.file_type, size: st.file_size }]
                    : [];

                return (
                  <div
                    key={st.id ? `subtask-modal-${st.id}` : `subtask-modal-new-${idx}`}
                    className="p-4 rounded-2xl bg-white border border-[#C6DDF2] shadow-sm space-y-3 transition-all hover:border-[#9EC3E6]"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-[#DCEBFA] text-[#005A9E] flex items-center justify-center text-xs font-black">
                          {visibleIndex}
                        </span>
                        <h4 className="text-xs font-black text-[#003A6B]">
                          Sous-tâche {st.objet ? `— ${st.objet}` : `#${visibleIndex}`}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(idx)}
                        title="Supprimer cette sous-tâche"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Inputs Row 1: Réf, Ordre, Objet, Statut (TextField!) */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Numéro de référence
                        </label>
                        <input
                          type="text"
                          value={st.numero_reference || ''}
                          onChange={(e) => handleUpdateSubtask(idx, { numero_reference: e.target.value })}
                          placeholder="Ex: REF-2026-01"
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold cnas-input"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Numéro d&apos;ordre
                        </label>
                        <input
                          type="text"
                          value={st.numero_ordre || ''}
                          onChange={(e) => handleUpdateSubtask(idx, { numero_ordre: e.target.value })}
                          placeholder="Ex: 01"
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold cnas-input"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Objet
                        </label>
                        <input
                          type="text"
                          value={st.objet || ''}
                          onChange={(e) => handleUpdateSubtask(idx, { objet: e.target.value })}
                          placeholder="Ex: Décision de commission"
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold cnas-input"
                        />
                      </div>

                      {/* Statut as a TextField */}
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Statut
                        </label>
                        <input
                          type="text"
                          value={st.statut || ''}
                          onChange={(e) => handleUpdateSubtask(idx, { statut: e.target.value })}
                          placeholder="Ex: Traité, En cours, Non traité..."
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold cnas-input"
                        />
                      </div>
                    </div>

                    {/* Inputs Row 2: Décision N° & Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Numéro de décision
                        </label>
                        <input
                          type="text"
                          value={st.numero_decision || ''}
                          onChange={(e) => handleUpdateSubtask(idx, { numero_decision: e.target.value })}
                          placeholder="Ex: DEC/2026/452"
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold cnas-input"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Date de décision
                        </label>
                        <input
                          type="date"
                          value={st.date_decision || ''}
                          onChange={(e) => handleUpdateSubtask(idx, { date_decision: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold cnas-input"
                        />
                      </div>
                    </div>

                    {/* Inputs Row 3: Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Note
                        </label>
                        <textarea
                          rows={2}
                          value={st.note || ''}
                          onChange={(e) => handleUpdateSubtask(idx, { note: e.target.value })}
                          placeholder="Observations ou note intermédiaire..."
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold cnas-input resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Note finale
                        </label>
                        <textarea
                          rows={2}
                          value={st.note_finale || ''}
                          onChange={(e) => handleUpdateSubtask(idx, { note_finale: e.target.value })}
                          placeholder="Note de conclusion..."
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold cnas-input resize-none"
                        />
                      </div>
                    </div>

                    {/* Subtask Set of Files (Multiple Files Attachment) */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#003A6B] flex items-center space-x-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-[#005A9E]" />
                          <span>
                            Pièces jointes de la sous-tâche ({filesList.length} fichier{filesList.length > 1 ? 's' : ''})
                          </span>
                        </label>

                        <label className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EBF4FC] text-[#005A9E] hover:bg-[#DCEBFA] transition-colors cursor-pointer border border-[#93C0E8]">
                          <Upload className="w-3 h-3" />
                          <span>Ajouter des fichiers</span>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.doc,.docx"
                            className="hidden"
                            onChange={(e) => {
                              handleAddSubtaskFiles(idx, e.target.files);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>

                      {/* List of uploaded files */}
                      {filesList.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          {filesList.map((file, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#B4D1EC] text-xs transition-colors hover:border-[#93C0E8]"
                            >
                              <div className="flex items-center space-x-2 min-w-0 pr-2">
                                {getFileIcon(file.name)}
                                <span className="font-bold text-[#003A6B] truncate">
                                  {file.name}
                                </span>
                                {file.size ? (
                                  <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                                    ({formatFileSize(file.size)})
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex items-center space-x-1.5 flex-shrink-0">
                                {(file.path || st.id) && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFile(file, st.id)}
                                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EBF4FC] text-[#005A9E] hover:bg-[#DCEBFA] transition-colors cursor-pointer"
                                  >
                                    <span>Ouvrir</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubtaskFile(idx, fIdx)}
                                  title="Supprimer ce fichier"
                                  className="p-1 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic py-1">
                          Aucun fichier joint à cette sous-tâche. Vous pouvez sélectionner un ou plusieurs documents (PDF, Excel, Images...).
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#B4D1EC] bg-[#EBF4FC] flex items-center justify-end space-x-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handleSaveSubtasks}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les sous-tâches'}
          </button>
        </div>
      </div>
    </div>
  );
};
