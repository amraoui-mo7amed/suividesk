import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Plus, 
  FileDown, 
  FileSpreadsheet, 
  Download,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskAssignment } from '../types';
import { SuiviDeskLogo } from './SuiviDeskLogo';

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
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExportMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const overdueCount = urgentTasks.filter(t => t.alert_level === 'overdue').length;
  const j3Count = urgentTasks.filter(t => t.alert_level === 'j-3').length;
  const totalAlerts = overdueCount + j3Count;

  return (
    <header className={`sticky top-0 z-30 transition-colors duration-200 border-b overflow-visible select-none ${
      theme === 'dark' 
        ? 'glass-panel-dark border-slate-800/80 bg-slate-950/85 text-slate-100' 
        : 'glass-panel-light border-slate-200/90 bg-white/90 text-slate-800'
    }`}>
      {/* Pl-24 ensures macOS window traffic lights never overlap the logo */}
      <div className="flex items-center justify-between px-6 pl-24 py-2.5">
        
        {/* Left: Custom Inline App Logo & SuiviDesk Brand */}
        <div className="flex items-center space-x-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="flex items-center space-x-2.5">
            <SuiviDeskLogo className="h-8 w-8 rounded-xl shadow-md transition-transform hover:scale-105" />
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-[#0055A5] via-[#0072CE] to-[#00A3E0] dark:from-white dark:to-cyan-400 bg-clip-text text-transparent">
                SuiviDesk
              </span>
            </div>
          </div>
        </div>

        {/* Right: Export Dropdown, Alerts, Theme & New Task Button */}
        <div className="flex items-center space-x-2 sm:space-x-2.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
          
          {/* Unified Export Dropdown */}
          <div className="relative overflow-visible" ref={exportRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExportingPdf || isExportingCsv}
              title="Exporter les données"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
              } ${isExportMenuOpen ? 'ring-2 ring-[#0055A5]/40 border-[#0055A5]' : ''} active:scale-95 disabled:opacity-50`}
            >
              {isExportingPdf || isExportingCsv ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00A3E0]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#00A3E0]" />
              )}
              <span>Exporter</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Solid Opaque Floating Export Menu */}
            {isExportMenuOpen && (
              <div 
                className={`absolute right-0 top-full mt-1.5 w-64 rounded-2xl shadow-2xl border p-1.5 space-y-1 transition-all ${
                  theme === 'dark'
                    ? 'bg-[#0b1329] border-slate-700 text-slate-100 shadow-2xl shadow-black'
                    : 'bg-white border-slate-200 text-slate-900 shadow-2xl shadow-blue-950/20'
                }`}
                style={{ 
                  backgroundColor: theme === 'dark' ? '#0b1329' : '#ffffff',
                  opacity: 1,
                  zIndex: 9999 
                }}
              >
                {/* PDF Export Button */}
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportPdf();
                  }}
                  disabled={isExportingPdf}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800/90 text-slate-200' : 'hover:bg-blue-50/80 text-slate-700'
                  } disabled:opacity-50`}
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 dark:text-white">Rapport Officiel PDF</div>
                    <div className="text-[10px] text-slate-400">Mise en page certifiée WeasyPrint</div>
                  </div>
                </button>

                {/* Excel Export Button */}
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportCsv();
                  }}
                  disabled={isExportingCsv}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800/90 text-slate-200' : 'hover:bg-emerald-50/80 text-slate-700'
                  } disabled:opacity-50`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 dark:text-white">Registre Excel (CSV)</div>
                    <div className="text-[10px] text-slate-400">Format tableur conforme CNAS</div>
                  </div>
                </button>
              </div>
            )}
          </div>

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
