import React from 'react';
import { LayoutDashboard, ClipboardList, RefreshCw, ShieldCheck, Lock } from 'lucide-react';
import { MainNavTab } from './Navbar';

interface BottomNavProps {
  currentTab: MainNavTab;
  onChangeTab: (tab: MainNavTab) => void;
  onOpenSync: () => void;
  onOpenSecurity: () => void;
  isPasswordConfigured: boolean;
  onLockApp: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  onOpenSync,
  onOpenSecurity,
  isPasswordConfigured,
  onLockApp
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#C6DDF2] shadow-lg px-2 py-1.5 flex items-center justify-around select-none">
      {/* Tab: Dashboard */}
      <button
        type="button"
        onClick={() => onChangeTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          currentTab === 'dashboard'
            ? 'text-[#005A9E] font-black'
            : 'text-slate-500 font-semibold hover:text-[#003A6B]'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Tableau</span>
      </button>

      {/* Tab: Suivi */}
      <button
        type="button"
        onClick={() => onChangeTab('suivi')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          currentTab === 'suivi' || currentTab === 'home'
            ? 'text-[#005A9E] font-black'
            : 'text-slate-500 font-semibold hover:text-[#003A6B]'
        }`}
      >
        <ClipboardList className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Suivi</span>
      </button>

      {/* Button: LAN Sync */}
      <button
        type="button"
        onClick={onOpenSync}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-600 font-semibold hover:text-[#005A9E] transition-all cursor-pointer"
        title="Synchroniser avec le PC"
      >
        <RefreshCw className="w-5 h-5 mb-0.5 text-[#005A9E]" />
        <span className="text-[10px] tracking-tight">Sync</span>
      </button>

      {/* Button: Security Settings */}
      <button
        type="button"
        onClick={onOpenSecurity}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-600 font-semibold hover:text-[#005A9E] transition-all cursor-pointer"
        title="Sécurité"
      >
        <ShieldCheck className="w-5 h-5 mb-0.5 text-[#005A9E]" />
        <span className="text-[10px] tracking-tight">Sécurité</span>
      </button>

      {/* Button: Quick Lock (if configured) */}
      {isPasswordConfigured && (
        <button
          type="button"
          onClick={onLockApp}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-amber-700 font-semibold hover:text-amber-800 transition-all cursor-pointer"
          title="Verrouiller"
        >
          <Lock className="w-5 h-5 mb-0.5 text-amber-600" />
          <span className="text-[10px] tracking-tight">Verrouiller</span>
        </button>
      )}
    </nav>
  );
};
