import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Plus, 
  FileDown, 
  FileSpreadsheet, 
  ShieldCheck, 
  CalendarClock,
  Loader2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskAssignment } from '../types';

interface NavbarProps {
  urgentTasks: TaskAssignment[];
  onOpenAssignModal: () => void;
  onOpenNotifications: () => void;
  isNotifOpen: boolean;
  onExportPdf: () => void;
  onExportCsv: () => void;
  isExportingPdf: boolean;
  isExportingCsv: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  urgentTasks,
  onOpenAssignModal,
  onOpenNotifications,
  isNotifOpen,
  onExportPdf,
  onExportCsv,
  isExportingPdf,
  isExportingCsv
}) => {
  const { theme, toggleTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      const formatted = now.toLocaleDateString('fr-FR', options);
      // Capitalize first letter
      setCurrentDate(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    };

    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const overdueCount = urgentTasks.filter(t => t.alert_level === 'overdue').length;
  const j3Count = urgentTasks.filter(t => t.alert_level === 'j-3').length;
  const totalAlerts = overdueCount + j3Count;

  return (
    <header className={`sticky top-0 z-30 transition-colors duration-200 border-b ${
      theme === 'dark' 
        ? 'glass-panel-dark border-slate-800/80 bg-slate-950/70 text-slate-100' 
        : 'glass-panel-light border-slate-200/90 bg-white/80 text-slate-800'
    }`}>
      <div className="flex items-center justify-between px-6 py-3">
        
        {/* Left: CNAS Logo & Branding */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/assets/cnas-logo.svg" 
              alt="Logo CNAS" 
              className="h-10 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                // Fallback badge if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-[#0055A5] dark:text-[#00A3E0]">
                  CNAS
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/50">
                  SuiviDesk
                </span>
              </div>
              <p className="text-[10px] tracking-wide text-slate-500 dark:text-slate-400 font-medium">
                Système Proactif de Suivi Opérationnel & Échéances
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Date & SQLite Status */}
        <div className="hidden lg:flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
            theme === 'dark' ? 'bg-slate-900/60 text-slate-300 border border-slate-800' : 'bg-slate-100/80 text-slate-700 border border-slate-200'
          }`}>
            <CalendarClock className="w-3.5 h-3.5 text-[#00A3E0]" />
            <span>{currentDate}</span>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
            theme === 'dark' ? 'bg-slate-900/60 text-emerald-400 border border-slate-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>SQLite Local Connecté</span>
          </div>
        </div>

        {/* Right: Actions, Alerts Bell, Theme & New Task Button */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Quick PDF Report Button */}
          <button
            onClick={onExportPdf}
            disabled={isExportingPdf}
            title="Générer le Rapport Officiel CNAS en PDF (WeasyPrint)"
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
              theme === 'dark'
                ? 'bg-blue-950/40 text-cyan-300 hover:bg-blue-900/50 border border-cyan-800/50'
                : 'bg-blue-50 text-[#0055A5] hover:bg-blue-100 border border-blue-200'
            } active:scale-95 disabled:opacity-50`}
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-[#00A3E0]" />
            )}
            <span className="hidden md:inline">Rapport PDF</span>
          </button>

          {/* Quick CSV Excel Export */}
          <button
            onClick={onExportCsv}
            disabled={isExportingCsv}
            title="Exporter les données au format CSV compatible Microsoft Excel"
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
              theme === 'dark'
                ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            } active:scale-95 disabled:opacity-50`}
          >
            {isExportingCsv ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className="hidden md:inline">Export Excel</span>
          </button>

          {/* Smart Alerts Bell */}
          <button
            onClick={onOpenNotifications}
            title="Alertes Échéances J-3 et Retards"
            className={`relative p-2 rounded-xl transition-all duration-150 ${
              isNotifOpen
                ? 'ring-2 ring-amber-500 bg-amber-500/20 text-amber-500'
                : theme === 'dark'
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Bell className={`w-4 h-4 ${totalAlerts > 0 ? 'text-amber-500' : ''}`} />
            
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-[10px] font-black text-white shadow-md animate-pulse">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Basculer en Mode Clair (Frosted Alabaster)' : 'Basculer en Mode Sombre (Deep Obsidian)'}
            className={`p-2 rounded-xl transition-all duration-150 ${
              theme === 'dark'
                ? 'bg-slate-800/80 text-amber-300 hover:bg-slate-700/80 border border-slate-700/60'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Primary Action: Assign Task */}
          <button
            onClick={onOpenAssignModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] via-[#0072CE] to-[#00A3E0] shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/35 hover:scale-[1.02] active:scale-95 transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Affecter Tâche</span>
          </button>

        </div>

      </div>
    </header>
  );
};
