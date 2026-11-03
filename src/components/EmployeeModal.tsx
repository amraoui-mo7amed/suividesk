import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, UserPen, Upload, FileText, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [civilite, setCivilite] = useState<Civilite>('');
  const [fullName, setFullName] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sourcePath?: string;
    base64?: string;
  } | null>(null);
  const [existingFileName, setExistingFileName] = useState<string>('');
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isEditMode = Boolean(employeeToEdit);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsSubmitting(false);
      setIsDragging(false);

      if (employeeToEdit) {
        setCivilite((employeeToEdit.civilite as Civilite) || '');
        setFullName(employeeToEdit.full_name || '');
        setExistingFileName(employeeToEdit.file_name || '');
        setSelectedFile(null);
        setRemoveExistingFile(false);
      } else {
        setCivilite('');
        setFullName('');
        setExistingFileName('');
        setSelectedFile(null);
        setRemoveExistingFile(false);
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

  const handleNativeBrowse = async () => {
    if (window.electronAPI?.pickDocumentFile) {
      const res = await window.electronAPI.pickDocumentFile();
      if (!res.canceled && res.name && res.sourcePath) {
        setSelectedFile({
          name: res.name,
          sourcePath: res.sourcePath
        });
        setRemoveExistingFile(false);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleBrowserFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        base64: String(reader.result || '')
      });
      setRemoveExistingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fileWithPath = file as File & { path?: string };
      if (fileWithPath.path) {
        setSelectedFile({
          name: file.name,
          sourcePath: fileWithPath.path
        });
        setRemoveExistingFile(false);
      } else {
        handleBrowserFileSelected(file);
      }
    }
  };

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
            full_name: trimmedName,
            file_data: selectedFile,
            remove_file: removeExistingFile
          });
          if (!res.success) {
            setErrorMsg(res.error || 'Erreur lors de la mise à jour.');
            return;
          }
          onSaved('Fiche employé modifiée avec succès.');
        } else {
          const res = await window.electronAPI.createEmployee({
            civilite,
            full_name: trimmedName,
            file_data: selectedFile
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

  const displayedFileName = selectedFile
    ? selectedFile.name
    : !removeExistingFile && existingFileName
      ? existingFileName
      : '';

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
                Tous les champs sont optionnels • Nom unique si renseigné
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

          {/* 3. PDF / DOCX / Excel File */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A5F] block mb-1.5">
              Document Joint (PDF / DOCX / Excel)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleBrowserFileSelected(f);
              }}
            />

            {displayedFileName ? (
              <div className="p-3 rounded-xl border bg-[#EAF4FC] border-[#8EB4D9] flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#005A9E] text-white flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#003A6B] truncate">{displayedFileName}</p>
                    <p className="text-[10px] font-medium text-slate-600">
                      {selectedFile ? 'Nouveau fichier sélectionné' : 'Document actuellement joint'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleNativeBrowse}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#003A6B] hover:bg-[#DCEBFA] transition-colors cursor-pointer"
                  >
                    Changer
                  </button>
                  <button
                    type="button"
                    title="Retirer le fichier"
                    onClick={() => {
                      setSelectedFile(null);
                      if (existingFileName) setRemoveExistingFile(true);
                    }}
                    className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={handleNativeBrowse}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all ${
                  isDragging
                    ? 'border-[#005A9E] bg-[#DCEBFA]'
                    : 'border-[#8EB4D9] hover:border-[#005A9E] bg-[#F2F8FE]'
                }`}
              >
                <Upload className="w-6 h-6 mx-auto text-[#005A9E] mb-1.5" />
                <p className="text-xs font-extrabold text-[#003A6B]">
                  Cliquez ou glissez un fichier ici
                </p>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                  Formats supportés : PDF, Word (.docx), Excel (.xlsx, .csv)
                </p>
              </div>
            )}
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
