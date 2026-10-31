import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Plus, 
  FileDown, 
  FileSpreadsheet, 
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
        weekday: 'short', 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      };
      const formatted = now.toLocaleDateString('fr-FR', options);
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
    <header className={`sticky top-0 z-30 transition-colors duration-200 border-b overflow-visible ${
      theme === 'dark' 
        ? 'glass-panel-dark border-slate-800/80 bg-slate-950/80 text-slate-100' 
        : 'glass-panel-light border-slate-200/90 bg-white/85 text-slate-800'
    }`}>
      <div className="flex items-center justify-between px-6 py-2.5">
        
        {/* Left: Custom App Icon & SuiviDesk Identity */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5">
            <img 
              src="/favicon.svg" 
              alt="SuiviDesk" 
              className="h-8 w-8 rounded-xl shadow-md transition-transform hover:scale-105"
            />
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-[#0055A5] via-[#0072CE] to-[#00A3E0] dark:from-white dark:to-cyan-400 bg-clip-text text-transparent">
                SuiviDesk
              </span>
            </div>
          </div>
        </div>

        {/* Center: Clean Live Date */}
        <div className="hidden md:flex items-center">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
            theme === 'dark' ? 'bg-slate-900/50 text-slate-400 border border-slate-800/80' : 'bg-slate-100/70 text-slate-600 border border-slate-200/80'
          }`}>
            <CalendarClock className="w-3.5 h-3.5 text-[#00A3E0]" />
            <span>{currentDate}</span>
          </div>
        </div>

        {/* Right: Actions, Alerts, Theme & New Task Button */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          
          {/* Quick PDF Report */}
          <button
            onClick={onExportPdf}
            disabled={isExportingPdf}
            title="Exporter Rapport PDF"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              theme === 'dark'
                ? 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
            } active:scale-95 disabled:opacity-50`}
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-[#00A3E0]" />
            )}
            <span className="hidden md:inline">PDF</span>
          </button>

          {/* Quick CSV Excel Export */}
          <button
            onClick={onExportCsv}
            disabled={isExportingCsv}
            title="Exporter format Excel (CSV)"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              theme === 'dark'
                ? 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
            } active:scale-95 disabled:opacity-50`}
          >
            {isExportingCsv ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className="hidden md:inline">Excel</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            title="Alertes d'échéances"
            className={`relative p-2 rounded-xl transition-all duration-150 ${
              isNotifOpen
                ? 'ring-2 ring-amber-500 bg-amber-500/15 text-amber-500'
                : theme === 'dark'
                  ? 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Bell className={`w-4 h-4 ${totalAlerts > 0 ? 'text-amber-500' : ''}`} />
            
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white shadow">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
            className={`p-2 rounded-xl transition-all duration-150 ${
              theme === 'dark'
                ? 'bg-slate-900/60 text-amber-300 hover:bg-slate-800 border border-slate-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Primary Action: New Task */}
          <button
            onClick={onOpenAssignModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-sm hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle Tâche</span>
          </button>

        </div>

      </div>
    </header>
  );
};
