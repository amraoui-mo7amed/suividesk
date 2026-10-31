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
        <h1 className="text-lg font-black text-white tracking-tight">
          Tableau de Bord & Analytique
        </h1>
        <p className="text-xs text-slate-300 mt-0.5">
          Synthèse globale d'activité et charge de travail
        </p>
      </div>

      {/* Simplified KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Total Tasks */}
        <div className="p-3.5 rounded-2xl border border-slate-800 glass-panel-dark transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-white">
            {kpis.total}
          </div>
        </div>

        {/* J-3 Alerts */}
        <div 
          onClick={() => onFilterAlert('j-3')}
          className="p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 bg-amber-950/30 border-amber-800/60 text-amber-300 shadow-sm"
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Alertes J-3</span>
            <ClockAlert className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-amber-300">
            {kpis.approachingJ3}
          </div>
        </div>

        {/* En Retard */}
        <div 
          onClick={() => onFilterAlert('overdue')}
          className="p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 bg-rose-950/30 border-rose-800/60 text-rose-300 shadow-sm"
        >
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">En Retard</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-rose-300">
            {kpis.overdue}
          </div>
        </div>

        {/* En Traitement */}
        <div className="p-3.5 rounded-2xl border border-slate-800 glass-panel-dark transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">En Cours</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white">
            {kpis.inProgress}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-3.5 rounded-2xl border border-slate-800 glass-panel-dark transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Taux Clôture</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-500">
            {kpis.completionRate}%
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Service Breakdown */}
        <div className="p-4 rounded-2xl border border-slate-800 glass-panel-dark transition-all">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
            Dossiers par Pôle d'Activité CNAS
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis 
                  dataKey="service" 
                  type="category" 
                  tick={{ fontSize: 10, fill: '#cbd5e1' }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1329',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc'
                  }}
                />
                <Bar dataKey="active" name="En cours / Actifs" fill="#00A3E0" radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" name="Terminés" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status & Alerts Distribution */}
        <div className="p-4 rounded-2xl border border-slate-800 glass-panel-dark transition-all">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
            Distribution par Statut & Alertes
          </h2>

          <div className="h-64 w-full flex items-center justify-center">
            {statusPieData.length === 0 ? (
              <div className="text-xs text-slate-400 italic">Aucune donnée disponible</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1329',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* Status Legend Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
