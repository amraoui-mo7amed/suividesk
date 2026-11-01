import React, { useState } from 'react';
import { 
  Search, 
  Mail, 
  Phone, 
  ArrowRight, 
  Plus, 
  X,
  ChevronDown,
  Users2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Employee, CNASService } from '../../types';

interface EmployeeDirectoryViewProps {
  employees: Employee[];
  onSelectEmployeeTasks: (employeeId: number) => void;
  onRefreshEmployees: () => void;
  onOpenAddModal?: () => void;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({
  employees,
  onSelectEmployeeTasks,
  onRefreshEmployees,
  onOpenAddModal
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
    <div className="space-y-4 overflow-visible">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Annuaire des Collaborateurs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi des charges opérationnelles et capacités
          </p>
        </div>

        <button
          onClick={() => onOpenAddModal ? onOpenAddModal() : setIsAddModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouvel Employé & Tâche</span>
        </button>
      </div>

      {/* Filter Bar with overflow-visible */}
      <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center justify-between transition-all overflow-visible ${
        theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
      }`}>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher collaborateur, matricule..."
            className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          />
        </div>

        <div className="relative w-full sm:w-48 overflow-visible">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className={`w-full px-3 py-1.5 rounded-xl text-xs font-semibold appearance-none pr-7 cursor-pointer ${
              theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
            }`}
          >
            <option value="Tous">Pôle : Tous</option>
            <option value="Recouvrement">Recouvrement</option>
            <option value="Prestations">Prestations</option>
            <option value="Contrôle Médical">Contrôle Médical</option>
            <option value="Contentieux">Contentieux</option>
            <option value="Informatique">Informatique</option>
            <option value="Ressources Humaines">RH</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Employees Grid */}
      {filtered.length === 0 ? (
        <div className={`p-10 rounded-2xl border text-center ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <div className="mx-auto w-10 h-10 rounded-xl bg-blue-500/10 text-[#0055A5] dark:text-cyan-400 flex items-center justify-center mb-3">
            <Users2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Aucun collaborateur enregistré
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Ajoutez les membres de votre équipe pour commencer à leur assigner des tâches.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-sm hover:opacity-95 transition-all"
          >
            + Ajouter un Collaborateur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filtered.map((emp) => {
          const workload = emp.workload_percentage || 0;
          const activeTasks = emp.active_tasks_count || 0;

          return (
            <div
              key={emp.id}
              className={`rounded-2xl p-4 border flex flex-col justify-between transition-all duration-150 ${
                theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0055A5] text-white font-bold flex items-center justify-center text-xs">
                      {emp.prenom[0]}{emp.nom[0]}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {emp.prenom} {emp.nom}
                      </h3>
                      <div className="text-[10px] font-mono text-slate-400">
                        {emp.matricule} • {emp.poste}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400">
                    {emp.service}
                  </span>
                </div>

                {/* Contact */}
                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{emp.email}</span>
                  </div>
                  {emp.telephone && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{emp.telephone}</span>
                    </div>
                  )}
                </div>

                {/* Workload */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/70 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Charge
                    </span>
                    <span className={`text-[10px] font-bold ${
                      workload >= 80 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {activeTasks} / {emp.max_capacity} ({workload}%)
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        workload >= 80 ? 'bg-rose-500' : 'bg-[#0055A5]'
                      }`}
                      style={{ width: `${Math.min(100, workload)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* View tasks */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/70 flex justify-end">
                <button
                  onClick={() => onSelectEmployeeTasks(emp.id)}
                  className="flex items-center space-x-1 text-xs font-semibold text-[#0055A5] dark:text-cyan-400 hover:underline"
                >
                  <span>Voir tâches ({activeTasks})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Modal: Add Employee */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className={`relative w-full max-w-md rounded-2xl p-5 shadow-2xl border overflow-visible ${
            theme === 'dark' ? 'glass-panel-dark bg-slate-950 text-slate-100 border-slate-800' : 'glass-panel-light bg-white text-slate-900 border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Nouveau Collaborateur
              </h2>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="py-3 space-y-3 overflow-visible">
              <div className="grid grid-cols-2 gap-2.5 overflow-visible">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Matricule *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MAT-18290"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
                <div className="overflow-visible">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Pôle *</label>
                  <div className="relative overflow-visible">
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium appearance-none pr-7 cursor-pointer ${
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
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Poste *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gestionnaire de dossiers"
                  value={poste}
                  onChange={(e) => setPoste(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs ${
                    theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0]"
                >
                  {isSubmitting ? 'Ajout...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
