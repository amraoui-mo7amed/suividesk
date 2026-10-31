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
  Pie, 
  Legend 
} from 'recharts';
import { 
  ClockAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Activity, 
  TrendingUp, 
  Users, 
  ShieldAlert,
  Percent
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
      <div className="p-12 text-center text-slate-500 text-xs">
        Chargement des métriques CNAS...
      </div>
    );
  }

  const { kpis, serviceBreakdown, agentWorkload } = stats;

  const COLORS = ['#0055A5', '#00A3E0', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

  const statusPieData = [
    { name: 'Terminées', value: kpis.completed, color: '#10b981' },
    { name: 'En cours', value: kpis.inProgress, color: '#0055A5' },
    { name: 'Alertes J-3', value: kpis.approachingJ3, color: '#f59e0b' },
    { name: 'En retard', value: kpis.overdue, color: '#ef4444' },
    { name: 'En attente', value: kpis.pending, color: '#94a3b8' },
    { name: 'Bloquées', value: kpis.blocked, color: '#d946ef' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Tableau de Bord & Analytique des Échéances
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Indicateurs de performance de la Caisse Nationale des Assurances Sociales
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Total Tasks */}
        <div className={`p-4 rounded-2xl border transition-all ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Dossiers</span>
            <Layers className="w-4 h-4 text-[#0055A5] dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Actifs et clôturés
          </div>
        </div>

        {/* Dedicated 🟡 Alertes J-3 Actives */}
        <div 
          onClick={() => onFilterAlert('j-3')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            theme === 'dark' 
              ? 'bg-amber-950/20 border-amber-800/50 text-amber-300' 
              : 'bg-amber-50/80 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">🟡 Alertes J-3</span>
            <ClockAlert className="w-4 h-4 animate-bounce" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {kpis.approachingJ3}
          </div>
          <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-1">
            Échéance &lt; 72h • Cliquer pour voir
          </div>
        </div>

        {/* Dedicated 🔴 En Retard */}
        <div 
          onClick={() => onFilterAlert('overdue')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            theme === 'dark' 
              ? 'bg-rose-950/20 border-rose-800/50 text-rose-300' 
              : 'bg-rose-50/80 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">🔴 Dépassées</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {kpis.overdue}
          </div>
          <div className="text-[10px] text-rose-700/80 dark:text-rose-400/80 mt-1">
            Retard avéré • Action urgente
          </div>
        </div>

        {/* En cours d'exécution */}
        <div className={`p-4 rounded-2xl border transition-all ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">En Traitement</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.inProgress}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {kpis.blocked} dossier(s) bloqué(s)
          </div>
        </div>

        {/* Global Completion Rate */}
        <div className={`p-4 rounded-2xl border transition-all col-span-2 lg:col-span-1 ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Taux Clôture</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center">
            {kpis.completionRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {kpis.completed} tâches achevées
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Workload per Agent */}
        <div className={`p-5 rounded-3xl border transition-all ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Charge de Travail par Collaborateur
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Nombre de dossiers actifs vs alertes critiques
              </p>
            </div>
            <Users className="w-4 h-4 text-[#00A3E0]" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="active" name="Dossiers Actifs" fill="#0055A5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="j3" name="Alertes J-3" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="En Retard" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className={`p-5 rounded-3xl border transition-all ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Répartition Opérationnelle par Pôle CNAS
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Volume de dossiers affectés par direction
              </p>
            </div>
            <Layers className="w-4 h-4 text-[#00A3E0]" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} />
                <YAxis 
                  dataKey="service" 
                  type="category" 
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="active" name="Actifs" fill="#00A3E0" radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" name="Terminés" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Status Donut Overview */}
      <div className={`p-5 rounded-3xl border transition-all ${
        theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Synthèse Globale de l'État d'Avancement
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ventilation par statut et seuils d'alertes
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around py-4 gap-6">
          <div className="w-56 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
            {statusPieData.map((item, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-2xl border flex items-center space-x-2.5 ${
                  theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{item.name}</div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-100">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
