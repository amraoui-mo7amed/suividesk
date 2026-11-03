import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  FileDown,
  FileSpreadsheet,
  RotateCcw,
  ChevronDown,
  Loader2,
  Inbox,
  User,
  ClockAlert
} from 'lucide-react';
import { TaskItem, Employee, TaskPriority, EtatCourrier } from '../../types';
import { TaskCard } from '../TaskCard';
import { CustomSelect } from '../CustomSelect';
import { PortalDropdown } from '../PortalDropdown';

interface TaskTrackingViewProps {
  tasks: TaskItem[];
  employees: Employee[];
  onAddTask: () => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  onSelectEmployee: (employeeId: number) => void;
}

export const TaskTrackingView: React.FC<TaskTrackingViewProps> = ({
  tasks,
  employees,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onSelectEmployee
}) => {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('Tous');
  const [selectedEtat, setSelectedEtat] = useState<string>('Tous');
  const [selectedPriorite, setSelectedPriorite] = useState<string>('Toutes');
  const [sortBy, setSortBy] = useState<'recent' | 'duree-desc' | 'duree-asc'>('recent');

  const employeeOptions = useMemo(() => {
    return [
      { value: 'Tous', label: 'Tous les collaborateurs' },
      ...employees.map(e => ({
        value: String(e.id),
        label: e.full_name || `Employé #${e.id}`
      }))
    ];
  }, [employees]);

  const etatOptions = [
    { value: 'Tous', label: 'État : Tous' },
    { value: 'traite', label: 'Traité' },
    { value: 'en_cours', label: 'En cours de traitement' },
    { value: 'non_traite', label: 'Non traité' }
  ];

  const prioriteOptions = [
    { value: 'Toutes', label: 'Priorité : Toutes' },
    { value: 'Urgente', label: 'Urgente' },
    { value: 'Haute', label: 'Haute' },
    { value: 'Moyenne', label: 'Moyenne' },
    { value: 'Basse', label: 'Basse' }
  ];

  const sortOptions = [
    { value: 'recent', label: 'Tri : Plus récent' },
    { value: 'duree-desc', label: 'Tri : Durée décroissante' },
    { value: 'duree-asc', label: 'Tri : Durée croissante' }
  ];

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = tasks.filter(task => {
      // Search
      if (q) {
        const hay = [
          task.titre,
          task.sujet,
          task.personne_cible,
          task.reference_dossier,
          task.wilaya,
          task.agent_full_name,
          task.note
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Filter agent
      if (selectedAgent !== 'Tous') {
        if (String(task.agent_id) !== selectedAgent) return false;
      }

      // Filter etat
      if (selectedEtat !== 'Tous') {
        if (task.etat_courrier !== selectedEtat) return false;
      }

      // Filter priorite
      if (selectedPriorite !== 'Toutes') {
        if (task.priorite !== selectedPriorite) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'duree-desc') {
        return (b.duree_traitement_jours || 0) - (a.duree_traitement_jours || 0);
      }
      if (sortBy === 'duree-asc') {
        return (a.duree_traitement_jours || 0) - (b.duree_traitement_jours || 0);
      }
      return b.id - a.id;
    });
  }, [tasks, search, selectedAgent, selectedEtat, selectedPriorite, sortBy]);

  const activeFilterCount = [
    selectedAgent !== 'Tous',
    selectedEtat !== 'Tous',
    selectedPriorite !== 'Toutes'
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#003A6B]">
            Tableau de Suivi des Courriers & Dossiers
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            {filteredTasks.length} courrier(s) affiché(s) sur {tasks.length} au total
          </p>
        </div>

        <button
          onClick={onAddTask}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Tâche</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-3.5 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 relative z-20 cnas-panel">
        {/* Search */}
        <div className="relative flex-1 min-w-0 lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#005A9E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence, objet, wilaya, destinataire..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl text-xs font-semibold cnas-input"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 hover:text-rose-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 overflow-visible">
          {/* Agent Filter */}
          <div className="w-56">
            <CustomSelect
              options={employeeOptions}
              value={selectedAgent}
              onChange={setSelectedAgent}
              searchable
              searchPlaceholder="Nom collaborateur..."
              icon={<User className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Etat Filter */}
          <div className="w-44">
            <CustomSelect
              options={etatOptions}
              value={selectedEtat}
              onChange={setSelectedEtat}
            />
          </div>

          {/* Priorite Filter */}
          <div className="w-40">
            <CustomSelect
              options={prioriteOptions}
              value={selectedPriorite}
              onChange={setSelectedPriorite}
            />
          </div>

          {/* Sort */}
          <div className="w-48">
            <CustomSelect
              options={sortOptions}
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSelectedAgent('Tous');
                setSelectedEtat('Tous');
                setSelectedPriorite('Toutes');
                setSearch('');
              }}
              className="p-2.5 rounded-xl cnas-btn-secondary text-xs font-bold"
              title="Réinitialiser les filtres"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-3xl p-12 text-center cnas-panel">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-[#003A6B]">
            {tasks.length === 0 ? 'Aucun courrier enregistré' : 'Aucun courrier ne correspond à vos filtres'}
          </h3>
          <p className="text-xs font-medium text-slate-700 mt-1 max-w-md mx-auto">
            Utilisez les filtres ci-dessus ou ajoutez une nouvelle tâche assignée à un collaborateur.
          </p>
          <div className="mt-5">
            <button
              onClick={onAddTask}
              className="px-4 py-2 rounded-xl text-xs font-bold cnas-btn-primary cursor-pointer"
            >
              + Ajouter une Tâche
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map(task => (
            <div key={task.id} className="relative group">
              {/* Card with assigned employee indicator banner on top if present */}
              {task.agent_full_name && (
                <div 
                  onClick={() => task.agent_id && onSelectEmployee(task.agent_id)}
                  className="mb-1 text-[11px] font-bold text-[#003A6B] hover:underline flex items-center space-x-1 cursor-pointer pl-1"
                >
                  <User className="w-3 h-3 text-[#005A9E]" />
                  <span>Assignée à : {task.agent_civilite ? `${task.agent_civilite} ` : ''}{task.agent_full_name}</span>
                </div>
              )}
              <TaskCard
                task={task}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
