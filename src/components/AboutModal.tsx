import React from 'react';
import { X, ShieldCheck, Database, FileSpreadsheet, Clock, CheckCircle2 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-white shadow-2xl ring-1 ring-[#003A6B]/20 transition-all text-slate-900">
        {/* Top CNAS Blue Banner — Clipped cleanly to rounded-3xl */}
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
            <span>Version 1.3.0</span>
            <span>•</span>
            <span>Édition Desktop</span>
          </div>
        </div>

        {/* Body Details */}
        <div className="p-6 space-y-4 bg-white">
          <p className="text-xs leading-relaxed text-center text-slate-700 font-medium">
            <strong>SuiviDesk</strong> est l&apos;application bureautique dédiée à la gestion des
            collaborateurs de la CNAS, au suivi du traitement des courriers et dossiers
            administratifs, à la prévisualisation intégrée des pièces jointes et au contrôle des
            délais de traitement.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl border bg-[#EEF6FC] border-[#A8C7E5] flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#005A9E] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#003A6B]">Gestion des Employés</div>
                <div className="text-[11px] text-slate-700">
                  Fiches individuelles, tri alphabétique et recherche instantanée.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl border bg-[#EEF6FC] border-[#A8C7E5] flex items-start space-x-2.5">
              <Clock className="w-4 h-4 text-[#005A9E] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#003A6B]">Suivi des Courriers</div>
                <div className="text-[11px] text-slate-700">
                  Calcul automatique de la durée de traitement en jours.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl border bg-[#EEF6FC] border-[#A8C7E5] flex items-start space-x-2.5">
              <FileSpreadsheet className="w-4 h-4 text-[#005A9E] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#003A6B]">Aperçu & Exports</div>
                <div className="text-[11px] text-slate-700">
                  Prévisualisation PDF/DOCX/Excel et exports officiels PDF & CSV.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl border bg-[#EEF6FC] border-[#A8C7E5] flex items-start space-x-2.5">
              <Database className="w-4 h-4 text-[#005A9E] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#003A6B]">Stockage Local Sécurisé</div>
                <div className="text-[11px] text-slate-700">
                  Base SQLite locale autonome fonctionnant 100% hors-ligne.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#C6DDF2] flex items-center justify-between text-[11px] text-slate-700 font-semibold">
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
