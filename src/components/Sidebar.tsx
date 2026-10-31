import React from 'react';
import { 
  LayoutGrid, 
  BarChart3, 
  BookOpenCheck, 
  Users2, 
  ClockAlert,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TaskAssignment } from '../types';

export type ActiveTab = 'tracking' | 'dashboard' | 'catalog' | 'employees';

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
    },
    {
      id: 'employees' as ActiveTab,
      label: 'Collaborateurs',
      icon: Users2
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
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-950/70 to-cyan-950/40 text-cyan-300 border border-cyan-800/50 shadow-sm font-semibold'
                      : 'bg-gradient-to-r from-blue-50 to-cyan-50/70 text-[#0055A5] border border-blue-200 shadow-sm font-semibold'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? theme === 'dark' ? 'bg-cyan-900/70 text-cyan-200' : 'bg-blue-200 text-blue-900'
                      : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
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

      {/* Sidebar Footer */}
      <div className={`p-3 border-t text-[10px] text-slate-400 flex items-center justify-between ${
        theme === 'dark' ? 'border-slate-800/60' : 'border-slate-200/80'
      }`}>
        <span>SuiviDesk v1.0</span>
        <span className="text-[#00A3E0] font-semibold">J-3 Actif</span>
      </div>
    </aside>
  );
};
