import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  ArrowRight, 
  Trash2, 
  X,
  BookOpenCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { TaskTemplate, TaskPriority, CNASService } from '../../types';
import { CustomSelect, Option } from '../CustomSelect';

interface CatalogViewProps {
  templates: TaskTemplate[];
  onAssignFromTemplate: (template: TaskTemplate) => void;
  onRefreshTemplates: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  templates,
  onAssignFromTemplate,
  onRefreshTemplates
}) => {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState('Tous');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Template form state
  const [code, setCode] = useState('');
  const [titre, setTitre] = useState('');
  const [service, setService] = useState<CNASService | string>('Recouvrement');
  const [prioriteDefaut, setPrioriteDefaut] = useState<TaskPriority>('Moyenne');
  const [dureeEstimee, setDureeEstimee] = useState(3);
  const [description, setDescription] = useState('');
  const [instructionsType, setInstructionsType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = templates.filter((tpl) => {
    const matchService = selectedService === 'Tous' || tpl.service === selectedService;
    const matchSearch =
      tpl.titre.toLowerCase().includes(search.toLowerCase()) ||
      tpl.code.toLowerCase().includes(search.toLowerCase()) ||
      (tpl.description && tpl.description.toLowerCase().includes(search.toLowerCase()));
    return matchService && matchSearch;
  });

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !titre.trim()) return;

    try {
      setIsSubmitting(true);
      if (window.electronAPI) {
        await window.electronAPI.createTemplate({
          code: code.trim().toUpperCase(),
          titre: titre.trim(),
          service,
          priorite_defaut: prioriteDefaut,
          duree_estimee_jours: Number(dureeEstimee),
          description: description.trim(),
          instructions_type: instructionsType.trim()
        });
      }
      setIsCreateModalOpen(false);
      setCode('');
      setTitre('');
      setDescription('');
      setInstructionsType('');
      onRefreshTemplates();
    } catch (err: any) {
      alert(err.message || 'Erreur de création de modèle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: number, templateTitle: string) => {
    if (window.confirm(`Supprimer définitivement le modèle "${templateTitle}" ?`)) {
      if (window.electronAPI) {
        await window.electronAPI.deleteTemplate(id);
        onRefreshTemplates();
      }
    }
  };

  const serviceFilterOptions: Option[] = [
    { value: 'Tous', label: 'Pôle : Tous' },
    { value: 'Recouvrement', label: 'Recouvrement' },
    { value: 'Prestations', label: 'Prestations' },
    { value: 'Contrôle Médical', label: 'Contrôle Médical' },
    { value: 'Contentieux', label: 'Contentieux' },
    { value: 'Informatique', label: 'Informatique' },
    { value: 'Ressources Humaines', label: 'Ressources Humaines (RH)' }
  ];

  const serviceModalOptions: Option[] = [
    { value: 'Recouvrement', label: 'Recouvrement' },
    { value: 'Prestations', label: 'Prestations' },
    { value: 'Contrôle Médical', label: 'Contrôle Médical' },
    { value: 'Contentieux', label: 'Contentieux' },
    { value: 'Informatique', label: 'Informatique' },
    { value: 'Ressources Humaines', label: 'Ressources Humaines (RH)' }
  ];

  const priorityModalOptions: Option[] = [
    { value: 'Urgente', label: 'Urgente' },
    { value: 'Haute', label: 'Haute' },
    { value: 'Moyenne', label: 'Moyenne' },
    { value: 'Basse', label: 'Basse' }
  ];

  return (
    <div className="space-y-4 overflow-visible">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">
            Catalogue des Tâches Maîtresses
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Référentiel des procédures types et délais prescrits
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouveau Modèle</span>
        </button>
      </div>

      {/* Filter & Search Bar with CustomSelect overflow */}
      <div className="p-3 rounded-2xl border border-slate-800 glass-panel-dark flex flex-col sm:flex-row gap-3 items-center justify-between transition-all overflow-visible z-20">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code ou titre..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium glass-input-dark text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="w-full sm:w-56 overflow-visible">
          <CustomSelect
            options={serviceFilterOptions}
            value={selectedService}
            onChange={(val) => setSelectedService(val)}
            compact
            menuAlign="right"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {filtered.length === 0 ? (
        <div className="p-10 rounded-2xl border border-slate-800 glass-panel-dark text-center">
          <div className="mx-auto w-10 h-10 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center mb-3">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">
            Aucun modèle de procédure
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Créez des modèles types pour standardiser vos activités récurrentes.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0] shadow-sm hover:opacity-95 transition-all"
          >
            + Nouveau Modèle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className="rounded-2xl p-4 border border-slate-800/80 bg-slate-900/60 glass-card-dark flex flex-col justify-between transition-all duration-150"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                  {tpl.code}
                </span>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {tpl.service}
                  </span>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id, tpl.titre)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h3 className="text-xs font-bold text-white leading-snug">
                {tpl.titre}
              </h3>

              {tpl.description && (
                <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              )}

              {tpl.instructions_type && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-200">
                  <span className="font-bold text-cyan-400">Procédure : </span>
                  <span className="text-slate-300">{tpl.instructions_type}</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-slate-300 font-medium">{tpl.duree_estimee_jours} jours</span>
              </div>

              <button
                onClick={() => onAssignFromTemplate(tpl)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-300 hover:bg-cyan-950/50 hover:text-white transition-colors"
              >
                <span>Affecter</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Modal: Create Template with overflow-visible CustomSelect */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-800 bg-slate-950 text-slate-100 overflow-visible glass-panel-dark">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Nouveau Modèle de Tâche
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-200" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="py-3 space-y-3 overflow-visible">
              <div className="grid grid-cols-2 gap-2.5 overflow-visible">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: TPL-REC-03"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold glass-input-dark text-slate-100"
                  />
                </div>
                <div className="overflow-visible">
                  <CustomSelect
                    label="Pôle *"
                    options={serviceModalOptions}
                    value={service}
                    onChange={(val) => setService(val)}
                    compact
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Libellé *</label>
                <input
                  type="text"
                  required
                  placeholder="Intitulé officiel..."
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs font-medium glass-input-dark text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 overflow-visible">
                <div className="overflow-visible">
                  <CustomSelect
                    label="Priorité"
                    options={priorityModalOptions}
                    value={prioriteDefaut}
                    onChange={(val) => setPrioriteDefaut(val as TaskPriority)}
                    compact
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Délai (Jours)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={dureeEstimee}
                    onChange={(e) => setDureeEstimee(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-bold glass-input-dark text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs glass-input-dark text-slate-100"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0055A5] to-[#00A3E0]"
                >
                  {isSubmitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
