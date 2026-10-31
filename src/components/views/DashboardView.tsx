import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie
} from 'recharts';
import { 
  ClockAlert, 
  AlertTriangle, 
  Layers, 
  CheckCircle2, 
  Activity
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { DashboardStats } from '../../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  onFilterAlert: (alertType: 'j-3' | 'overdue') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, onFilterAlert }) => {
  const { theme } = useTheme();

  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Chargement des métriques...
      </div>
    );
  }

  const { kpis, serviceBreakdown, agentWorkload } = stats;

  const statusPieData = [
    { name: 'Terminées', value: kpis.completed, color: '#10b981' },
    { name: 'En cours', value: kpis.inProgress, color: '#0055A5' },
    { name: 'Alertes J-3', value: kpis.approachingJ3, color: '#f59e0b' },
    { name: 'En retard', value: kpis.overdue, color: '#ef4444' },
    { name: 'En attente', value: kpis.pending, color: '#94a3b8' },
    { name: 'Bloquées', value: kpis.blocked, color: '#a855f7' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      
      {/* Title */}
      <div>
        <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Tableau de Bord & Analytique
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Synthèse globale d'activité et charge de travail
        </p>
      </div>

      {/* Simplified KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Total Tasks */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total</span>
            <Layers className="w-3.5 h-3.5 text-[#0055A5] dark:text-cyan-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {kpis.total}
          </div>
        </div>

        {/* J-3 Alerts */}
        <div 
          onClick={() => onFilterAlert('j-3')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            theme === 'dark' 
              ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Alertes J-3</span>
            <ClockAlert className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {kpis.approachingJ3}
          </div>
        </div>

        {/* En Retard */}
        <div 
          onClick={() => onFilterAlert('overdue')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            theme === 'dark' 
              ? 'bg-rose-950/20 border-rose-800/40 text-rose-300' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">En Retard</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">
            {kpis.overdue}
          </div>
        </div>

        {/* En Traitement */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">En Cours</span>
            <Activity className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {kpis.inProgress}
          </div>
        </div>

        {/* Completion Rate */}
        <div className={`p-3.5 rounded-2xl border transition-all col-span-2 lg:col-span-1 ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Taux Clôture</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-500">
            {kpis.completionRate}%
          </div>
        </div>

      </div>

      {/* Minimal Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Service Breakdown */}
        <div className={`p-4 rounded-2xl border transition-all lg:col-span-2 ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            Dossiers par Pôle d'Activité CNAS
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} />
                <YAxis 
                  dataKey="service" 
                  type="category" 
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="active" name="En cours / Actifs" fill="#0055A5" radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" name="Terminés" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
