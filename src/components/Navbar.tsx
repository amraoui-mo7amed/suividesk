import React from 'react';
import { 
  Info, 
  ChevronRight, 
  Users, 
  Home, 
  ClipboardList, 
  LayoutDashboard,
  Database
} from 'lucide-react';
import { Employee } from '../types';

export type MainNavTab = 'home' | 'suivi' | 'dashboard';

interface NavbarProps {
  currentTab: MainNavTab;
  onChangeTab: (tab: MainNavTab) => void;
  selectedEmployee: Employee | null;
  onNavigateHome: () => void;
  onOpenAbout: () => void;
  onBackupRestore?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  selectedEmployee,
  onNavigateHome,
  onOpenAbout,
  onBackupRestore
}) => {
  const employeeTitle = selectedEmployee
    ? [selectedEmployee.civilite, selectedEmployee.full_name || `Employé #${selectedEmployee.id}`]
        .filter(Boolean)
        .join(' ')
    : null;

  return (
    <header className="sticky top-0 z-30 border-b-2 bg-white border-[#9EC3E6] text-slate-900 shadow-sm select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: CNAS Logo + Brand */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={() => {
              onNavigateHome();
              onChangeTab('home');
            }}
            className="flex items-center space-x-2.5 group focus:outline-none text-left cursor-pointer"
            title="Accueil SuiviDesk"
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
              <p className="text-[11px] font-semibold text-slate-600 hidden lg:block">
                Système de Suivi Opérationnel & Échéances
              </p>
            </div>
          </button>
        </div>

        {/* Center: The 3 Main Navigation Tabs (Home / Tableau de Suivi / Tableau de Bord) */}
        <nav className="flex items-center space-x-1.5 p-1 rounded-2xl bg-[#EEF6FC] border border-[#C6DDF2]">
          <button
            onClick={() => {
              onNavigateHome();
              onChangeTab('home');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'home' && !selectedEmployee
                ? 'bg-[#005A9E] text-white shadow-sm'
                : 'text-[#003A6B] hover:bg-[#DCEBFA]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Accueil</span>
          </button>

          <button
            onClick={() => {
              onNavigateHome();
              onChangeTab('suivi');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'suivi'
                ? 'bg-[#005A9E] text-white shadow-sm'
                : 'text-[#003A6B] hover:bg-[#DCEBFA]'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Tableau de Suivi</span>
          </button>

          <button
            onClick={() => {
              onNavigateHome();
              onChangeTab('dashboard');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-[#005A9E] text-white shadow-sm'
                : 'text-[#003A6B] hover:bg-[#DCEBFA]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Tableau de Bord</span>
          </button>
        </nav>

        {/* Right: Breadcrumb (if inside employee) + Backup + About Button */}
        <div className="flex items-center space-x-2">
          {selectedEmployee && (
            <div className="hidden sm:flex items-center space-x-1 px-3 py-1 rounded-xl bg-[#DCEBFA] border border-[#93C0E8] text-xs font-bold text-[#003A6B] max-w-[200px] truncate">
              <span className="truncate">{employeeTitle}</span>
            </div>
          )}

          <button
            onClick={onOpenAbout}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold cnas-btn-secondary active:scale-95 cursor-pointer"
            title="À propos & Sauvegarde des données"
          >
            <Info className="w-4 h-4 text-[#005A9E]" />
            <span className="hidden sm:inline">À propos</span>
          </button>
        </div>
      </div>
    </header>
  );
};
