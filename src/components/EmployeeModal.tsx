import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserPen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Employee, Civilite } from '../types';
import { CustomSelect } from './CustomSelect';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEmployees: Employee[];
  employeeToEdit?: Employee | null;
  onSaved: (message: string) => void;
}

const CIVILITE_OPTIONS = [
  { value: '', label: '— Sélectionner (Optionnel) —' },
  { value: 'Monsieur', label: 'Monsieur' },
  { value: 'Madame', label: 'Madame' }
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  existingEmployees,
  employeeToEdit,
  onSaved
}) => {
  const [civilite, setCivilite] = useState<Civilite>('');
  const [fullName, setFullName] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(employeeToEdit);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsSubmitting(false);

      if (employeeToEdit) {
        setCivilite((employeeToEdit.civilite as Civilite) || '');
        setFullName(employeeToEdit.full_name || '');
      } else {
        setCivilite('');
        setFullName('');
      }
    }
  }, [isOpen, employeeToEdit]);

  if (!isOpen) return null;

  const trimmedName = fullName.trim();
  const isDuplicateName =
    trimmedName !== '' &&
    existingEmployees.some(
      (emp) =>
        emp.id !== employeeToEdit?.id &&
        (emp.full_name || '').trim().toLowerCase() === trimmedName.toLowerCase()
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isDuplicateName) {
      setErrorMsg('Ce nom complet existe déjà. Le nom complet doit être unique.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (window.electronAPI) {
        if (isEditMode && employeeToEdit) {
          const res = await window.electronAPI.updateEmployee(employeeToEdit.id, {
            civilite,
            full_name: trimmedName
          });
          if (!res.success) {
            setErrorMsg(res.error || 'Erreur lors de la mise à jour.');
            return;
          }
          onSaved('Fiche employé modifiée avec succès.');
        } else {
          const res = await window.electronAPI.createEmployee({
            civilite,
            full_name: trimmedName
          });
          if (!res.success) {
            setErrorMsg(res.error || 'Erreur lors de l’ajout de l’employé.');
            return;
          }
          onSaved('Employé ajouté avec succès.');
        }
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all cnas-panel text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#B4D1EC]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center">
              {isEditMode ? <UserPen className="w-4.5 h-4.5" /> : <UserPlus className="w-4.5 h-4.5" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-[#003A6B]">
                {isEditMode ? 'Modifier l’Employé' : 'Ajouter un Employé'}
              </h2>
              <p className="text-[11px] font-medium text-slate-600">
                Civilité et nom complet de l'agent
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

        {errorMsg && (
          <div className="mt-3.5 p-3 rounded-xl bg-[#FFE4E6] border border-[#FDA4AF] text-[#881337] text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-visible">
          {/* 1. Monsieur / Madame Select (Portal Overflowed) */}
          <CustomSelect
            label="Civilité (Monsieur / Madame)"
            options={CIVILITE_OPTIONS}
            value={civilite}
            onChange={(val) => setCivilite(val as Civilite)}
            placeholder="— Sélectionner (Optionnel) —"
          />

          {/* 2. Full Name (Unique if provided) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A5F]">
                Nom Complet
              </label>
              <span className="text-[10px] font-bold text-[#005A9E]">
                Doit être unique
              </span>
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Benali Mohamed"
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cnas-input ${
                isDuplicateName ? '!border-rose-600 ring-2 ring-rose-500/25' : ''
              }`}
            />
            {isDuplicateName ? (
              <p className="mt-1 text-[11px] font-bold text-rose-700 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Ce nom complet existe déjà dans la liste.</span>
              </p>
            ) : trimmedName !== '' ? (
              <p className="mt-1 text-[11px] font-bold text-[#15803D] flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Nom complet disponible</span>
              </p>
            ) : null}
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || isDuplicateName}
              className="px-5 py-2 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'Enregistrement...'
                : isEditMode
                  ? 'Enregistrer les modifications'
                  : 'Ajouter l’employé'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
