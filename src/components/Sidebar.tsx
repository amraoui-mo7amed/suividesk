import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  BarChart3, 
  BookOpenCheck, 
  ClockAlert,
  AlertTriangle,
  CalendarClock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskAssignment } from '../types';

export type ActiveTab = 'tracking' | 'dashboard' | 'catalog';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  tasks: TaskAssignment[];
  onQuickFilterAlert?: (alertType: 'j-3' | 'overdue') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  tasks,
  onQuickFilterAlert
}) => {
  const { theme } = useTheme();
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

  const j3Count = tasks.filter(t => t.alert_level === 'j-3').length;
  const overdueCount = tasks.filter(t => t.alert_level === 'overdue').length;

  const navItems = [
    {
      id: 'tracking' as ActiveTab,
      label: 'Suivi Opérationnel',
      icon: LayoutGrid,
      badge: tasks.length
    },
    {
      id: 'dashboard' as ActiveTab,
      label: 'Tableau de Bord',
      icon: BarChart3
    },
    {
      id: 'catalog' as ActiveTab,
      label: 'Catalogue Tâches',
      icon: BookOpenCheck
    }
  ];

  return (
    <aside className={`w-56 flex-shrink-0 flex flex-col justify-between border-r transition-colors duration-200 select-none ${
      theme === 'dark' 
        ? 'glass-panel-dark border-slate-800/80 bg-slate-950/70' 
        : 'glass-panel-light border-slate-200/90 bg-white/70'
    }`}>
      {/* Top Nav Links */}
      <div className="p-3 space-y-4">
        
        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-950/80 to-cyan-950/50 text-cyan-300 border border-cyan-800/60 shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-cyan-900/80 text-cyan-200'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Minimal Alert Shortcuts */}
        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 space-y-1.5">
          {j3Count > 0 && (
            <button
              onClick={() => onQuickFilterAlert && onQuickFilterAlert('j-3')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-all ${
                theme === 'dark'
                  ? 'bg-amber-950/20 border-amber-800/40 text-amber-300 hover:bg-amber-950/30'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ClockAlert className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold">Échéances J-3</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                {j3Count}
              </span>
            </button>
          )}

          {overdueCount > 0 && (
            <button
              onClick={() => onQuickFilterAlert && onQuickFilterAlert('overdue')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-all ${
                theme === 'dark'
                  ? 'bg-rose-950/20 border-rose-800/40 text-rose-300 hover:bg-rose-950/30'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900 hover:bg-rose-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs font-semibold">En retard</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white">
                {overdueCount}
              </span>
            </button>
          )}
        </div>

      </div>

      {/* Bottom of Sidebar: Anchored Live Date Badge & Version Footer */}
      <div className="mt-auto">
        <div className="p-3 pb-2.5">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border shadow-sm ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-slate-300'
              : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <CalendarClock className="w-3.5 h-3.5 text-[#00A3E0] flex-shrink-0" />
            <span className="truncate text-[11px] font-semibold">{currentDate}</span>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t text-[10px] text-slate-400 flex items-center justify-between ${
          theme === 'dark' ? 'border-slate-800/60' : 'border-slate-200/80'
        }`}>
          <span>SuiviDesk v1.0</span>
          <span className="text-[#00A3E0] font-semibold">J-3 Actif</span>
        </div>
      </div>
    </aside>
  );
};
