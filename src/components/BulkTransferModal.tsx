import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowRightLeft,
  AlertCircle,
  Users,
  CheckCircle2,
  ClipboardList,
  Layers
} from 'lucide-react';
import { Employee, TaskItem } from '../types';
import { CustomSelect } from './CustomSelect';

interface BulkTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTasks: TaskItem[];
  currentEmployee: Employee;
  employees: Employee[];
  onTransferred: (message: string) => void;
}

export const BulkTransferModal: React.FC<BulkTransferModalProps> = ({
  isOpen,
  onClose,
  selectedTasks,
  currentEmployee,
  employees,
  onTransferred
}) => {
  const [targetAgentId, setTargetAgentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Target employees (excluding current employee)
  const targetEmployeeOptions = useMemo(() => {
    return employees
      .filter((e) => e.id !== currentEmployee.id && !e.is_deleted)
      .map((e) => ({
        value: String(e.id),
        label: [e.civilite, e.full_name || `Employé #${e.id}`].filter(Boolean).join(' ')
      }));
  }, [employees, currentEmployee.id]);

  const totalSubtasksCount = useMemo(() => {
    return selectedTasks.reduce((acc, t) => {
      const sub = (t.subtasks || []).filter((s) => !s.is_deleted);
      return acc + sub.length;
    }, 0);
  }, [selectedTasks]);

  if (!isOpen) return null;

  const handleConfirmTransfer = async () => {
    setErrorMsg('');
    const targetIdNum = Number(targetAgentId);
    if (!targetIdNum || isNaN(targetIdNum)) {
      setErrorMsg('Veuillez sélectionner le collaborateur de destination.');
      return;
    }

    try {
      setIsSubmitting(true);
      const taskIds = selectedTasks.map((t) => t.id);

      if (window.electronAPI?.transferTasksBulk) {
        const res = await window.electronAPI.transferTasksBulk({
          taskIds,
          targetAgentId: targetIdNum
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Erreur lors du transfert des tâches.');
          return;
        }

        const targetEmp = employees.find((e) => e.id === targetIdNum);
        const targetName = [targetEmp?.civilite, targetEmp?.full_name].filter(Boolean).join(' ') || 'l’employé sélectionné';
        onTransferred(
          `${taskIds.length} tâche${taskIds.length > 1 ? 's' : ''} (et ${totalSubtasksCount} sous-tâche${totalSubtasksCount > 1 ? 's' : ''}) transférée${taskIds.length > 1 ? 's' : ''} avec succès à ${targetName}.`
        );
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors du transfert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentEmpName =
    [currentEmployee.civilite, currentEmployee.full_name].filter(Boolean).join(' ') ||
    `Employé #${currentEmployee.id}`;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl transition-all my-auto cnas-panel text-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#B4D1EC] bg-[#EBF4FC] flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DCEBFA] border border-[#93C0E8] text-[#005A9E] flex items-center justify-center flex-shrink-0">
              <ArrowRightLeft className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#003A6B]">
                Transfert de Tâches en Lot
              </h2>
              <p className="text-[11px] font-medium text-slate-600">
                Réaffecter les tâches et leurs sous-tâches vers un autre collaborateur
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

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-[#FFE4E6] border border-[#FDA4AF] text-[#881337] font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Source Employee */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
              Collaborateur Actuel (Source)
            </span>
            <div className="flex items-center space-x-2 font-bold text-[#003A6B]">
              <Users className="w-4 h-4 text-[#005A9E]" />
              <span>{currentEmpName}</span>
            </div>
          </div>

          {/* Destination Employee Select */}
          <div>
            <CustomSelect
              label="Collaborateur de Destination (Nouveau titulaire)"
              options={[
                { value: '', label: '— Sélectionner le collaborateur récepteur —' },
                ...targetEmployeeOptions
              ]}
              value={targetAgentId}
              onChange={(val) => setTargetAgentId(val)}
              searchable
              searchPlaceholder="Rechercher par nom..."
              icon={<Users className="w-3.5 h-3.5" />}
            />
            {targetEmployeeOptions.length === 0 && (
              <p className="text-[10px] text-amber-700 mt-1 font-semibold">
                Aucun autre collaborateur n&apos;est enregistré pour le transfert.
              </p>
            )}
          </div>

          {/* Transfer Summary Notice */}
          <div className="p-3 rounded-xl bg-[#E8F3FD] border border-[#A7CBEE] text-[#003A6B] space-y-1">
            <div className="font-extrabold flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-[#005A9E]" />
              <span>
                {selectedTasks.length} tâche{selectedTasks.length > 1 ? 's' : ''} sélectionnée{selectedTasks.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
              Toutes les sous-tâches associées ({totalSubtasksCount} au total), leurs statuts,
              notes, décisions et documents joints seront conservés et transférés automatiquement
              au nouveau collaborateur.
            </p>
          </div>

          {/* Selected Tasks Preview List */}
          <div>
            <span className="text-[10px] font-black uppercase text-slate-600 block mb-1.5">
              Liste des tâches à transférer :
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {selectedTasks.map((t) => {
                const subCount = (t.subtasks || []).filter((s) => !s.is_deleted).length;
                return (
                  <div
                    key={t.id}
                    className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-[#003A6B] truncate">
                        {t.titre || `Tâche #${t.id}`}
                      </div>
                      {t.reference_dossier && (
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          Réf : {t.reference_dossier}
                        </div>
                      )}
                    </div>
                    {subCount > 0 ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-[#005A9E] border border-blue-200 whitespace-nowrap">
                        {subCount} sous-tâche{subCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                        0 sous-tâche
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#B4D1EC] bg-[#EBF4FC] flex items-center justify-end space-x-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirmTransfer}
            disabled={isSubmitting || !targetAgentId}
            className="px-4 py-2 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>
              {isSubmitting ? 'Transfert en cours...' : 'Confirmer le transfert'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
