import React from 'react';
import { 
  LayoutGrid, 
  BarChart3, 
  BookOpenCheck, 
  Users2, 
  AlertTriangle,
  ClockAlert,
  CheckCircle2,
  Layers
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
  const inProgressCount = tasks.filter(t => t.statut === 'En cours').length;
  const completedCount = tasks.filter(t => t.statut === 'Terminée').length;

  const navItems = [
    {
      id: 'tracking' as ActiveTab,
      label: 'Suivi Opérationnel',
      subtitle: 'Grille de cartes intelligentes',
      icon: LayoutGrid,
      badge: tasks.length
    },
    {
      id: 'dashboard' as ActiveTab,
      label: 'Tableau de Bord',
      subtitle: 'KPIs & Graphiques de charge',
      icon: BarChart3
    },
    {
      id: 'catalog' as ActiveTab,
      label: 'Catalogue des Tâches',
      subtitle: 'Modèles types réutilisables',
      icon: BookOpenCheck
    },
    {
      id: 'employees' as ActiveTab,
      label: 'Annuaire Collaborateurs',
      subtitle: 'Capacité & Affectations',
      icon: Users2
    }
  ];

  return (
    <aside className={`w-64 flex-shrink-0 flex flex-col justify-between border-r transition-colors duration-200 select-none ${
      theme === 'dark' 
        ? 'glass-panel-dark border-slate-800/80 bg-slate-950/60' 
        : 'glass-panel-light border-slate-200/90 bg-white/70'
    }`}>
      {/* Top Nav Links */}
      <div className="p-4 space-y-6">
        
        {/* Module Header */}
        <div className="px-2">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Layers className="w-3.5 h-3.5 text-[#00A3E0]" />
            <span>Modules CNAS</span>
          </div>
        </div>

        {/* Navigation buttons */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 text-left ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-900/60 to-cyan-950/40 text-cyan-300 border border-cyan-800/50 shadow-md shadow-blue-950/40 font-semibold'
                      : 'bg-gradient-to-r from-blue-50 to-cyan-50/70 text-[#0055A5] border border-blue-200 shadow-sm font-semibold'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-lg ${
                    isActive 
                      ? theme === 'dark' ? 'bg-cyan-950 text-cyan-400' : 'bg-blue-100 text-[#0055A5]'
                      : theme === 'dark' ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs leading-none">{item.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-normal">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
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

        {/* Quick Alert Sentinel Section */}
        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
          <div className="px-2 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Sentinelle d'Alertes
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="space-y-2">
            {/* J-3 Alert Widget */}
            <div 
              onClick={() => onQuickFilterAlert && onQuickFilterAlert('j-3')}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'bg-amber-950/20 border-amber-800/40 hover:bg-amber-950/40'
                  : 'bg-amber-50/80 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClockAlert className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Échéances J-3
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-white shadow-sm">
                  {j3Count}
                </span>
              </div>
              <div className="text-[10px] text-amber-600/90 dark:text-amber-500/80 mt-1">
                Dossiers critiques d'ici 72h
              </div>
            </div>

            {/* Overdue Alert Widget */}
            <div 
              onClick={() => onQuickFilterAlert && onQuickFilterAlert('overdue')}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'bg-rose-950/20 border-rose-800/40 hover:bg-rose-950/40'
                  : 'bg-rose-50/80 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    Dépassées (Retard)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-sm">
                  {overdueCount}
                </span>
              </div>
              <div className="text-[10px] text-rose-600/90 dark:text-rose-400/80 mt-1">
                Traitement immédiat requis
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Sidebar Footer Info */}
      <div className={`p-4 border-t ${
        theme === 'dark' ? 'border-slate-800/70 bg-slate-950/40' : 'border-slate-200/80 bg-slate-50/60'
      }`}>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Surveillance Active</span>
          <span className="font-semibold text-[#00A3E0]">3 Jours</span>
        </div>
        <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>Direction Générale CNAS</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
