import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  ArrowRight, 
  Trash2, 
  X,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { TaskTemplate, TaskPriority, CNASService } from '../../types';

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

  return (
    <div className="space-y-4 overflow-visible">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
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

      {/* Filter & Search Bar */}
      <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center justify-between transition-all overflow-visible ${
        theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
      }`}>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code ou titre..."
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

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className={`rounded-2xl p-4 border flex flex-col justify-between transition-all duration-150 ${
              theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-[#0055A5] dark:text-cyan-300">
                  {tpl.code}
                </span>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {tpl.service}
                  </span>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id, tpl.titre)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                {tpl.titre}
              </h3>

              {tpl.description && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {tpl.description}
                </p>
              )}

              {tpl.instructions_type && (
                <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Procédure : </span>
                  {tpl.instructions_type}
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/70 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{tpl.duree_estimee_jours} jours</span>
              </div>

              <button
                onClick={() => onAssignFromTemplate(tpl)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0055A5] dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              >
                <span>Affecter</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Template with overflow-visible selects */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className={`relative w-full max-w-md rounded-2xl p-5 shadow-2xl border overflow-visible ${
            theme === 'dark' ? 'glass-panel-dark bg-slate-950 text-slate-100 border-slate-800' : 'glass-panel-light bg-white text-slate-900 border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Nouveau Modèle de Tâche
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
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

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Libellé *</label>
                <input
                  type="text"
                  required
                  placeholder="Intitulé officiel..."
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium ${
                    theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 overflow-visible">
                <div className="overflow-visible">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Priorité</label>
                  <div className="relative overflow-visible">
                    <select
                      value={prioriteDefaut}
                      onChange={(e) => setPrioriteDefaut(e.target.value as TaskPriority)}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs font-semibold appearance-none pr-7 cursor-pointer ${
                        theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                      }`}
                    >
                      <option value="Urgente">Urgente</option>
                      <option value="Haute">Haute</option>
                      <option value="Moyenne">Moyenne</option>
                      <option value="Basse">Basse</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Délai (Jours)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={dureeEstimee}
                    onChange={(e) => setDureeEstimee(Number(e.target.value))}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold ${
                      theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-2 rounded-xl text-xs ${
                    theme === 'dark' ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
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
