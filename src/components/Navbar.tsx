import React from 'react';
import { 
  Info, 
  ChevronRight, 
  Users, 
  Home, 
  ClipboardList, 
  LayoutDashboard,
  Database,
  Lock,
  ShieldCheck,
  RefreshCw
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
  isPasswordConfigured?: boolean;
  onLockApp?: () => void;
  onOpenSecurity?: () => void;
  onOpenSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  selectedEmployee,
  onNavigateHome,
  onOpenAbout,
  onBackupRestore,
  isPasswordConfigured,
  onLockApp,
  onOpenSecurity,
  onOpenSync
}) => {
  return (
    <header className="sticky top-0 z-30 border-b-2 bg-white border-[#9EC3E6] text-slate-900 shadow-sm select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: CNAS Logo + Brand */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={() => {
              onNavigateHome();
              onChangeTab('dashboard');
            }}
            className="flex items-center space-x-2.5 group focus:outline-none text-left cursor-pointer"
            title="Accueil SuiviDesk — Tableau de Bord"
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

        {/* Center: The Main Navigation Tabs (Desktop only, mobile uses BottomNav) */}
        <nav className="hidden md:flex items-center space-x-1.5 p-1 rounded-2xl bg-[#EEF6FC] border border-[#C6DDF2]">
          <button
            onClick={() => {
              onNavigateHome();
              onChangeTab('dashboard');
            }}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'dashboard' && !selectedEmployee
                ? 'bg-[#005A9E] text-white shadow-sm'
                : 'text-[#003A6B] hover:bg-[#DCEBFA]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau de Bord</span>
          </button>

          <button
            onClick={() => {
              onNavigateHome();
              onChangeTab('suivi');
            }}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              (currentTab === 'suivi' || currentTab === 'home') && !selectedEmployee
                ? 'bg-[#005A9E] text-white shadow-sm'
                : 'text-[#003A6B] hover:bg-[#DCEBFA]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Tableau de Suivi</span>
          </button>
        </nav>

        {/* Right: Security, Sync, & About Buttons */}
        <div className="flex items-center space-x-2">
          {/* LAN Sync Button (Desktop) */}
          {onOpenSync && (
            <button
              onClick={onOpenSync}
              className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold cnas-btn-secondary active:scale-95 cursor-pointer text-[#005A9E]"
              title="Synchronisation réseau local (PC à PC)"
            >
              <RefreshCw className="w-4 h-4 text-[#005A9E]" />
              <span className="hidden md:inline">Synchronisation</span>
            </button>
          )}

          {/* Quick Lock Button (Desktop) */}
          {isPasswordConfigured && onLockApp && (
            <button
              onClick={onLockApp}
              className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 active:scale-95 cursor-pointer"
              title="Verrouiller la session immédiatement"
            >
              <Lock className="w-4 h-4 text-amber-600" />
              <span className="hidden lg:inline">Verrouiller</span>
            </button>
          )}

          {/* Security Settings Modal Button (Desktop) */}
          {onOpenSecurity && (
            <button
              onClick={onOpenSecurity}
              className="hidden md:flex items-center space-x-1.5 p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold cnas-btn-secondary active:scale-95 cursor-pointer text-[#005A9E]"
              title="Paramètres de sécurité & Mot de passe"
            >
              <ShieldCheck className="w-4 h-4 text-[#005A9E]" />
            </button>
          )}

          {/* About Modal Button */}
          <button
            onClick={onOpenAbout}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold cnas-btn-secondary active:scale-95 cursor-pointer"
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
