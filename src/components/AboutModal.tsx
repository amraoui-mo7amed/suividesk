import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Database, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  Download, 
  Upload, 
  AlertTriangle 
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackup?: () => void;
  onRestore?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ 
  isOpen, 
  onClose,
  onBackup,
  onRestore
}) => {
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBackup = async () => {
    if (window.electronAPI?.backupDatabase) {
      const res = await window.electronAPI.backupDatabase();
      if (res.success) {
        setBackupStatus('Base de données sauvegardée avec succès !');
        setTimeout(() => setBackupStatus(null), 4000);
      } else if (res.error && !res.error.includes('annulée')) {
        alert(res.error);
      }
    }
  };

  const handleRestore = async () => {
    if (window.electronAPI?.restoreDatabase) {
      if (!confirm('ATTENTION: La restauration va remplacer la base actuelle par la sauvegarde choisie. Voulez-vous continuer ?')) {
        return;
      }
      const res = await window.electronAPI.restoreDatabase();
      if (res.success) {
        alert('Restauration réussie ! L’application va recharger les données.');
        window.location.reload();
      } else if (res.error && !res.error.includes('annulée')) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-white shadow-2xl ring-1 ring-[#003A6B]/20 transition-all text-slate-900">
        {/* Top CNAS Blue Banner */}
        <div className="relative bg-gradient-to-br from-[#003A6B] via-[#005A9E] to-[#0077C2] px-6 pt-7 pb-6 text-white text-center">
          <button
            onClick={onClose}
            title="Fermer"
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* CNAS Logo Showcase */}
          <div className="mx-auto w-24 h-24 rounded-full bg-white p-2 shadow-xl ring-4 ring-white/35 flex items-center justify-center mb-3">
            <img
              src="./CNAS_logo.png"
              alt="Logo Officiel CNAS"
              className="w-full h-full object-contain"
            />
          </div>

          <h2 className="text-xl font-black tracking-tight">SuiviDesk — CNAS</h2>
          <p className="text-xs font-semibold text-sky-100 mt-1">
            Caisse Nationale des Assurances Sociales des Travailleurs Salariés
          </p>
          <p className="text-xs font-bold text-white mt-0.5" dir="rtl">
            الصندوق الوطني للتأمينات الإجتماعية للعمال الأجراء
          </p>
          <div className="inline-flex items-center space-x-1.5 mt-3 px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wide">
            <span>Version 1.4.0</span>
            <span>•</span>
            <span>Édition Desktop</span>
          </div>
        </div>

        {/* Body Details */}
        <div className="p-6 space-y-4 bg-white">
          <p className="text-xs leading-relaxed text-center text-slate-700 font-medium">
            <strong>SuiviDesk</strong> est l&apos;application bureautique officielle de la CNAS dédiée au suivi des collaborateurs, des courriers administratifs, à l'analyse de charge et à la prévisualisation des documents.
          </p>

          {/* Database Backup & Safety Card */}
          <div className="p-3.5 rounded-2xl border-2 border-[#9EC0E2] bg-[#F2F8FE] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-[#003A6B]">
              <Database className="w-4 h-4 text-[#005A9E]" />
              <span>Sauvegarde & Sécurité des Données</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Vos données sont stockées localement en toute sécurité. Les mises à jour de l'application ne suppriment jamais votre base. Vous pouvez également exporter une sauvegarde à tout moment :
            </p>

            {backupStatus && (
              <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{backupStatus}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleBackup}
                className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-bold cnas-btn-primary cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sauvegarder la base</span>
              </button>

              <button
                type="button"
                onClick={handleRestore}
                className="flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-bold cnas-btn-secondary cursor-pointer active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurer</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#C6DDF2] flex items-center justify-between text-[11px] text-slate-700 font-semibold">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#005A9E]" />
              <span>Usage Interne CNAS • Tous droits réservés</span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
