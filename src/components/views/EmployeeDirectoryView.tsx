import React, { useState } from 'react';
import { 
  Users2, 
  Search, 
  Mail, 
  Phone, 
  ClockAlert, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Briefcase,
  CheckCircle,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Employee, CNASService } from '../../types';

interface EmployeeDirectoryViewProps {
  employees: Employee[];
  onSelectEmployeeTasks: (employeeId: number) => void;
  onRefreshEmployees: () => void;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({
  employees,
  onSelectEmployeeTasks,
  onRefreshEmployees
}) => {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState('Tous');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New employee state
  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [service, setService] = useState<CNASService | string>('Recouvrement');
  const [poste, setPoste] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = employees.filter((emp) => {
    const matchService = selectedService === 'Tous' || emp.service === selectedService;
    const q = search.toLowerCase();
    const matchSearch =
      emp.nom.toLowerCase().includes(q) ||
      emp.prenom.toLowerCase().includes(q) ||
      emp.matricule.toLowerCase().includes(q) ||
      emp.poste.toLowerCase().includes(q);
    return matchService && matchSearch;
  });

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricule.trim() || !nom.trim() || !prenom.trim() || !email.trim()) return;

    try {
      setIsSubmitting(true);
      if (window.electronAPI) {
        await window.electronAPI.createEmployee({
          matricule: matricule.trim().toUpperCase(),
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          telephone: telephone.trim(),
          service,
          poste: poste.trim() || 'Agent Administratif',
          max_capacity: Number(maxCapacity)
        });
      }
      setIsAddModalOpen(false);
      setMatricule('');
      setNom('');
      setPrenom('');
      setEmail('');
      setTelephone('');
      setPoste('');
      onRefreshEmployees();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’ajout du collaborateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Annuaire des Collaborateurs & Capacité
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800">
              {employees.length} Agents Enregistrés
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des charges opérationnelles, alertes J-3 actives par collaborateur et seuils de saturation
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-md hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter Collaborateur</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center justify-between transition-all ${
        theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
      }`}>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher collaborateur, matricule, poste..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Pôle CNAS :</span>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Tous">Tous les pôles CNAS</option>
            <option value="Recouvrement">Recouvrement</option>
            <option value="Prestations">Prestations</option>
            <option value="Contrôle Médical">Contrôle Médical</option>
            <option value="Contentieux">Contentieux</option>
            <option value="Informatique">Informatique</option>
            <option value="Ressources Humaines">RH</option>
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
        {filtered.map((emp) => {
          const workload = emp.workload_percentage || 0;
          const activeTasks = emp.active_tasks_count || 0;
          const j3Alerts = emp.j3_alerts_count || 0;
          const overdue = emp.overdue_count || 0;

          return (
            <div
              key={emp.id}
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 ${
                theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
              }`}
            >
              <div>
                {/* Employee Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0055A5] to-[#00A3E0] text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                      {emp.prenom[0]}{emp.nom[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {emp.prenom} {emp.nom}
                      </h3>
                      <div className="text-[10px] font-mono text-slate-400">
                        {emp.matricule}
                      </div>
                      <div className="text-[11px] font-semibold text-[#0055A5] dark:text-cyan-400 mt-0.5">
                        {emp.poste}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-[#0055A5] dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/40">
                    {emp.service}
                  </span>
                </div>

                {/* Contact info */}
                <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.email}</span>
                  </div>
                  {emp.telephone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.telephone}</span>
                    </div>
                  )}
                </div>

                {/* Workload Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Charge Opérationnelle
                    </span>
                    <span className={`text-[11px] font-extrabold ${
                      workload >= 80 ? 'text-rose-500' : workload >= 50 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {activeTasks} / {emp.max_capacity} dossiers ({workload}%)
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        workload >= 80 ? 'bg-rose-500' : workload >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, workload)}%` }}
                    />
                  </div>
                </div>

                {/* Alerts count badge */}
                <div className="mt-3 flex items-center space-x-2">
                  {j3Alerts > 0 && (
                    <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <ClockAlert className="w-3 h-3" />
                      <span>{j3Alerts} échéance(s) J-3</span>
                    </span>
                  )}
                  {overdue > 0 && (
                    <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{overdue} retard(s)</span>
                    </span>
                  )}
                  {j3Alerts === 0 && overdue === 0 && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>À jour</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom: Filter tasks of this agent */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/70 flex justify-end">
                <button
                  onClick={() => onSelectEmployeeTasks(emp.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0055A5] dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                >
                  <span>Voir ses tâches ({activeTasks})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Employee */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className={`relative w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
            theme === 'dark' ? 'glass-panel-dark bg-slate-950/95 text-slate-100 border-slate-800' : 'glass-panel-light bg-white/95 text-slate-900 border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Ajouter un Collaborateur CNAS
              </h2>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Matricule CNAS *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MAT-18290"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Pôle / Service *</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  >
                    <option value="Recouvrement">Recouvrement</option>
                    <option value="Prestations">Prestations</option>
                    <option value="Contrôle Médical">Contrôle Médical</option>
                    <option value="Contentieux">Contentieux</option>
                    <option value="Informatique">Informatique</option>
                    <option value="Ressources Humaines">RH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Benali"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Karim"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Poste / Fonction *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Inspecteur du Recouvrement"
                  value={poste}
                  onChange={(e) => setPoste(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs ${
                    theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Email Professionnel *</label>
                  <input
                    type="email"
                    required
                    placeholder="k.benali@cnas.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Téléphone</label>
                  <input
                    type="text"
                    placeholder="0550 12 34 56"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Capacité Maximale de Dossiers Simultanés</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold ${
                    theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0]"
                >
                  {isSubmitting ? 'Ajout...' : 'Enregistrer le Collaborateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
