import React from 'react';
import { Info, ChevronRight, Users } from 'lucide-react';
import { Employee } from '../types';

interface NavbarProps {
  selectedEmployee: Employee | null;
  onNavigateHome: () => void;
  onOpenAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedEmployee,
  onNavigateHome,
  onOpenAbout
}) => {
  const employeeTitle = selectedEmployee
    ? [selectedEmployee.civilite, selectedEmployee.full_name || `Employé #${selectedEmployee.id}`]
        .filter(Boolean)
        .join(' ')
    : null;

  return (
    <header className="sticky top-0 z-30 border-b-2 bg-white border-[#9EC3E6] text-slate-900 shadow-sm select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Left: CNAS Logo + Brand + Breadcrumb */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-2.5 group focus:outline-none text-left cursor-pointer"
            title="Accueil — Liste des employés"
          >
            <div className="w-10 h-10 rounded-full bg-white p-1 shadow-sm border-2 border-[#9EC3E6] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
              <img
                src="./CNAS_logo.png"
                alt="CNAS"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="leading-tight">
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-black tracking-tight text-[#003A6B]">
                  SuiviDesk
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#005A9E] text-white">
                  CNAS
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-600 hidden sm:block">
                Suivi des Collaborateurs & Traitement des Courriers
              </p>
            </div>
          </button>

          {/* Breadcrumb Trail */}
          <div className="hidden md:flex items-center space-x-1.5 pl-3 border-l-2 border-[#C6DDF2] text-xs min-w-0">
            <button
              onClick={onNavigateHome}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                !selectedEmployee
                  ? 'bg-[#DCEBFA] text-[#003A6B] border border-[#93C0E8]'
                  : 'text-slate-700 hover:bg-[#EAF4FC] hover:text-[#003A6B]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Employés</span>
            </button>

            {selectedEmployee && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="px-3 py-1 rounded-lg font-bold bg-[#005A9E] text-white truncate max-w-[260px]">
                  {employeeTitle}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: About Modal Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenAbout}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cnas-btn-secondary active:scale-95 cursor-pointer"
          >
            <Info className="w-4 h-4 text-[#005A9E]" />
            <span>À propos</span>
          </button>
        </div>
      </div>
    </header>
  );
};
