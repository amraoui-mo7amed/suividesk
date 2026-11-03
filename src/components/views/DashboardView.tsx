import React, { useState, useMemo } from 'react';
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
  Layers, 
  CheckCircle2, 
  Activity, 
  AlertCircle,
  Clock,
  Users,
  MapPin
} from 'lucide-react';
import { Employee, TaskItem } from '../../types';

interface DashboardViewProps {
  employees: Employee[];
  tasks: TaskItem[];
  onSelectEmployee?: (empId: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ employees, tasks, onSelectEmployee }) => {
  const [selectedWilaya, setSelectedWilaya] = useState<string>('Toutes');

  const filteredTasks = useMemo(() => {
    if (selectedWilaya === 'Toutes') return tasks;
    return tasks.filter(t => t.wilaya === selectedWilaya);
  }, [tasks, selectedWilaya]);

  // KPIs
  const totalTasks = filteredTasks.length;
  const traiteCount = filteredTasks.filter(t => t.etat_courrier === 'traite').length;
  const enCoursCount = filteredTasks.filter(t => t.etat_courrier === 'en_cours').length;
  const nonTraiteCount = filteredTasks.filter(t => t.etat_courrier === 'non_traite').length;
  const completionRate = totalTasks > 0 ? Math.round((traiteCount / totalTasks) * 100) : 0;

  // Average treatment days for completed tasks
  const tasksWithDays = filteredTasks.filter(t => t.duree_traitement_jours !== null && t.duree_traitement_jours !== undefined);
  const avgDays = tasksWithDays.length > 0 
    ? Math.round(tasksWithDays.reduce((acc, t) => acc + (t.duree_traitement_jours || 0), 0) / tasksWithDays.length)
    : 0;

  // Pie chart by status
  const statusPieData = [
    { name: 'Traités', value: traiteCount, color: '#10b981' },
    { name: 'En cours', value: enCoursCount, color: '#0068B5' },
    { name: 'Non traités', value: nonTraiteCount, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Top Wilayas
  const wilayaCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      if (t.wilaya && t.wilaya.trim()) {
        map.set(t.wilaya, (map.get(t.wilaya) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([wilaya, count]) => ({ wilaya: wilaya.length > 18 ? wilaya.slice(0, 18) + '...' : wilaya, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [tasks]);

  // Workload per employee (top 6)
  const employeeWorkload = useMemo(() => {
    return employees
      .map(emp => ({
        name: emp.full_name ? (emp.full_name.length > 15 ? emp.full_name.slice(0, 15) + '...' : emp.full_name) : `Employé #${emp.id}`,
        empId: emp.id,
        total: emp.tasks_count || 0,
        traites: emp.traite_count || 0,
        enCours: emp.en_cours_count || 0,
        nonTraites: emp.non_traite_count || 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [employees]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#003A6B]">
            Tableau de Bord CNAS
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            Analytique globale des collaborateurs, flux de courriers et durées de traitement
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl cnas-panel">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A5F]">Total Tâches</span>
            <Layers className="w-4 h-4 text-[#005A9E]" />
          </div>
          <div className="text-2xl font-black text-[#003A6B]">{totalTasks}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">{employees.length} collaborateurs</div>
        </div>

        <div className="p-4 rounded-2xl cnas-panel">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">Traités</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{traiteCount}</div>
          <div className="text-[11px] text-emerald-700 font-bold mt-0.5">{completionRate}% du total</div>
        </div>

        <div className="p-4 rounded-2xl cnas-panel">
          <div className="flex items-center justify-between text-[#005A9E] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#003A6B]">En cours</span>
            <Activity className="w-4 h-4 text-[#005A9E]" />
          </div>
          <div className="text-2xl font-black text-[#005A9E]">{enCoursCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Dossiers actifs</div>
        </div>

        <div className="p-4 rounded-2xl cnas-panel">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F1239]">Non traités</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{nonTraiteCount}</div>
          <div className="text-[11px] text-rose-700 font-bold mt-0.5">En attente</div>
        </div>

        <div className="p-4 rounded-2xl cnas-panel col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-[#003A6B] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A5F]">Délai Moyen</span>
            <Clock className="w-4 h-4 text-[#005A9E]" />
          </div>
          <div className="text-2xl font-black text-[#003A6B]">{avgDays} j</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Par dossier traité</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Status Distribution */}
        <div className="p-5 rounded-2xl cnas-panel">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#003A6B]">
              Distribution par État de Courrier
            </h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {totalTasks} total
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
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
                      backgroundColor: '#FFFFFF',
                      borderColor: '#9EC0E2',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(0, 58, 107, 0.15)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-[#C6DDF2]">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Top Wilayas */}
        <div className="p-5 rounded-2xl cnas-panel">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#003A6B]">
              Top Wilayas les plus Fréquentes
            </h2>
            <MapPin className="w-4 h-4 text-[#005A9E]" />
          </div>

          <div className="h-64 w-full">
            {wilayaCounts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Aucune wilaya enregistrée dans les tâches
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wilayaCounts} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis 
                    dataKey="wilaya" 
                    type="category" 
                    tick={{ fontSize: 10, fill: '#0F172A', fontWeight: 600 }}
                    width={130}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 104, 181, 0.08)' }}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#9EC0E2',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(0, 58, 107, 0.15)'
                    }}
                  />
                  <Bar dataKey="count" name="Courriers / Tâches" fill="#0068B5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Workload per employee table */}
      <div className="p-5 rounded-2xl cnas-panel">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#005A9E]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#003A6B]">
              Charge de Travail par Collaborateur
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#C6DDF2] text-left text-[10px] font-bold uppercase text-[#1E3A5F]">
                <th className="py-2.5 px-3">Collaborateur</th>
                <th className="py-2.5 px-3 text-center">Total Tâches</th>
                <th className="py-2.5 px-3 text-center">Traités</th>
                <th className="py-2.5 px-3 text-center">En cours</th>
                <th className="py-2.5 px-3 text-center">Non traités</th>
                <th className="py-2.5 px-3 text-right">Progression</th>
              </tr>
            </thead>
            <tbody>
              {employeeWorkload.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    Aucun collaborateur enregistré
                  </td>
                </tr>
              ) : (
                employeeWorkload.map(emp => {
                  const rate = emp.total > 0 ? Math.round((emp.traites / emp.total) * 100) : 0;
                  return (
                    <tr 
                      key={emp.empId} 
                      className="border-b border-slate-100 hover:bg-[#F0F7FF] transition-colors cursor-pointer"
                      onClick={() => onSelectEmployee && onSelectEmployee(emp.empId)}
                    >
                      <td className="py-2.5 px-3 font-bold text-[#003A6B]">{emp.name}</td>
                      <td className="py-2.5 px-3 text-center font-extrabold">{emp.total}</td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">{emp.traites}</td>
                      <td className="py-2.5 px-3 text-center text-[#005A9E] font-bold">{emp.enCours}</td>
                      <td className="py-2.5 px-3 text-center text-rose-600 font-bold">{emp.nonTraites}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#005A9E] h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="font-bold text-[11px] w-8 text-right">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
