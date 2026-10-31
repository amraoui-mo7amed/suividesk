import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './context/ThemeContext';
import { 
  TaskAssignment, 
  Employee, 
  TaskTemplate, 
  TaskFilters, 
  DashboardStats, 
  TaskStatus 
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TaskAssignModal } from './components/TaskAssignModal';
import { TaskEditModal } from './components/TaskEditModal';
import { TaskTrackingView } from './components/views/TaskTrackingView';
import { DashboardView } from './components/views/DashboardView';
import { CatalogView } from './components/views/CatalogView';

const defaultFilters: TaskFilters = {
  search: '',
  statut: 'Tous',
  alerte: 'Toutes',
  service: 'Tous',
  priorite: 'Toutes',
  agent_id: 'Tous',
  periode: 'Toutes'
};

export const App: React.FC = () => {
  const { theme } = useTheme();

  // Navigation & Data States
  const [activeTab, setActiveTab] = useState<ActiveTab>('tracking');
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [allTasksUnfiltered, setAllTasksUnfiltered] = useState<TaskAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Filters State
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);

  // Modals & Drawers States
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskAssignment | null>(null);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<TaskAssignment | null>(null);
  const [preselectedTemplate, setPreselectedTemplate] = useState<TaskTemplate | null>(null);

  // Export States
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Tasks based on filters
  const loadTasks = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.getTasks(filters);
        setTasks(data || []);
      } catch (err) {
        console.error('Erreur chargement tâches:', err);
      }
    }
  }, [filters]);

  // Load Unfiltered Tasks (for alert sentinel and bell counter)
  const loadAllTasks = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const allData = await window.electronAPI.getTasks({});
        setAllTasksUnfiltered(allData || []);
      } catch (err) {
        console.error('Erreur chargement total:', err);
      }
    }
  }, []);

  // Load Employees
  const loadEmployees = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const emps = await window.electronAPI.getEmployees();
        setEmployees(emps || []);
      } catch (err) {
        console.error('Erreur chargement collaborateurs:', err);
      }
    }
  }, []);

  // Load Templates
  const loadTemplates = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const tpls = await window.electronAPI.getTemplates();
        setTemplates(tpls || []);
      } catch (err) {
        console.error('Erreur chargement catalogue:', err);
      }
    }
  }, []);

  // Load Dashboard Stats
  const loadDashboardStats = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const stats = await window.electronAPI.getDashboardStats();
        setDashboardStats(stats || null);
      } catch (err) {
        console.error('Erreur chargement stats:', err);
      }
    }
  }, []);

  // Initial Load and Auto-Refresh
  useEffect(() => {
    loadAllTasks();
    loadEmployees();
    loadTemplates();
    loadDashboardStats();

    const interval = setInterval(() => {
      loadAllTasks();
      loadTasks();
      loadEmployees();
      loadDashboardStats();
    }, 45000); // 45s periodic refresh

    return () => clearInterval(interval);
  }, [loadAllTasks, loadTasks, loadEmployees, loadTemplates, loadDashboardStats]);

  // Reload filtered tasks whenever filters change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handlers
  const handleUpdateStatus = async (
    id: number, 
    status: TaskStatus, 
    notes?: string, 
    motifBlocage?: string, 
    progression?: number
  ) => {
    if (window.electronAPI) {
      await window.electronAPI.updateTaskStatus(id, status, notes, motifBlocage, progression);
      loadTasks();
      loadAllTasks();
      loadEmployees();
      loadDashboardStats();
      showToast(`Statut mis à jour : ${status}`);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteTask(id);
      loadTasks();
      loadAllTasks();
      loadEmployees();
      loadDashboardStats();
      showToast('Dossier supprimé.');
    }
  };

  const handleQuickFilterAlert = (alertType: 'j-3' | 'overdue') => {
    setActiveTab('tracking');
    setFilters({
      ...defaultFilters,
      alerte: alertType
    });
  };

  const handleSelectEmployeeTasks = (empId: number) => {
    setActiveTab('tracking');
    setFilters({
      ...defaultFilters,
      agent_id: String(empId)
    });
  };

  const handleAssignFromTemplate = (tpl: TaskTemplate) => {
    setPreselectedTemplate(tpl);
    setIsAssignModalOpen(true);
  };

  // WeasyPrint PDF Export Handler
  const handleExportPdf = async () => {
    if (!window.electronAPI) return;
    try {
      setIsExportingPdf(true);

      const now = new Date();
      const dateFr = now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const approachingCount = tasks.filter(t => t.alert_level === 'j-3').length;
      const overdueCount = tasks.filter(t => t.alert_level === 'overdue').length;
      const inProgressCount = tasks.filter(t => t.statut === 'En cours').length;
      const completedCount = tasks.filter(t => t.statut === 'Terminée').length;
      const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

      let filterDesc = 'Toutes les activités';
      if (filters.service !== 'Tous') filterDesc = `Pôle ${filters.service}`;
      if (filters.alerte !== 'Toutes') filterDesc += ` • Filtre alerte: ${filters.alerte}`;
      if (filters.statut !== 'Tous') filterDesc += ` • Statut: ${filters.statut}`;

      const res = await window.electronAPI.generatePdfReport({
        report_title: 'Rapport Officiel de Suivi Opérationnel & Échéances CNAS',
        generation_date: dateFr,
        generated_by: 'Direction CNAS • SuiviDesk',
        filter_summary: filterDesc,
        stats: {
          total: tasks.length,
          approaching: approachingCount,
          overdue: overdueCount,
          in_progress: inProgressCount,
          completion_rate: completionRate
        },
        tasks: tasks
      });

      if (res.success) {
        showToast(`Rapport PDF généré avec succès ! (${res.filePath})`);
      } else if (res.error && !res.error.includes('annulé')) {
        alert(`Erreur d'exportation PDF: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Erreur: ${err.message || 'Impossible de générer le PDF'}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Native French Excel CSV Export Handler
  const handleExportCsv = async () => {
    if (!window.electronAPI) return;
    try {
      setIsExportingCsv(true);
      const res = await window.electronAPI.exportCsvReport(tasks);
      if (res.success) {
        showToast('Export Excel CSV réussi (encodage UTF-8 BOM, séparateur ;)');
      } else if (res.error && !res.error.includes('annulé')) {
        alert(`Erreur export CSV: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Erreur: ${err.message || 'Impossible d’exporter le CSV'}`);
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-300 relative text-slate-900 dark:text-slate-100"
      style={{
        background: theme === 'dark' ? 'var(--bg-gradient-dark)' : 'var(--bg-gradient-light)'
      }}
    >
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0055A5] to-[#00A3E0] text-white text-xs font-bold shadow-2xl flex items-center space-x-2">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        urgentTasks={allTasksUnfiltered}
        onOpenAssignModal={() => {
          setPreselectedTemplate(null);
          setIsAssignModalOpen(true);
        }}
        onOpenNotifications={() => setIsNotifOpen(true)}
        isNotifOpen={isNotifOpen}
        onExportPdf={handleExportPdf}
        onExportCsv={handleExportCsv}
        isExportingPdf={isExportingPdf}
        isExportingCsv={isExportingCsv}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tasks={allTasksUnfiltered}
          onQuickFilterAlert={handleQuickFilterAlert}
        />

        {/* Dynamic Center Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'tracking' && (
            <TaskTrackingView
              tasks={tasks}
              filters={filters}
              onChangeFilters={setFilters}
              onResetFilters={() => setFilters(defaultFilters)}
              employees={employees}
              onUpdateStatus={handleUpdateStatus}
              onEditTask={(task) => setSelectedTaskForEdit(task)}
              onViewDetails={(task) => setSelectedTaskForDetail(task)}
              onOpenAssignModal={() => {
                setPreselectedTemplate(null);
                setIsAssignModalOpen(true);
              }}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              stats={dashboardStats}
              onFilterAlert={handleQuickFilterAlert}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogView
              templates={templates}
              onAssignFromTemplate={handleAssignFromTemplate}
              onRefreshTemplates={() => {
                loadTemplates();
                showToast('Catalogue actualisé.');
              }}
            />
          )}
        </main>

      </div>

      {/* Sliding Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        tasks={allTasksUnfiltered}
        onSelectTask={(task) => {
          setSelectedTaskForDetail(task);
        }}
      />

      {/* Detail Modal */}
      <TaskDetailModal
        task={selectedTaskForDetail}
        isOpen={Boolean(selectedTaskForDetail)}
        onClose={() => setSelectedTaskForDetail(null)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteTask}
        onEdit={(task) => setSelectedTaskForEdit(task)}
      />

      {/* Assign Task Modal */}
      <TaskAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setPreselectedTemplate(null);
        }}
        employees={employees}
        templates={templates}
        preselectedTemplate={preselectedTemplate}
        onTaskAssigned={() => {
          loadTasks();
          loadAllTasks();
          loadEmployees();
          loadDashboardStats();
          showToast('Tâche CNAS affectée et planifiée.');
        }}
      />

      {/* Edit Task Modal */}
      <TaskEditModal
        task={selectedTaskForEdit}
        isOpen={Boolean(selectedTaskForEdit)}
        onClose={() => setSelectedTaskForEdit(null)}
        employees={employees}
        onTaskUpdated={() => {
          loadTasks();
          loadAllTasks();
          loadEmployees();
          loadDashboardStats();
          showToast('Fiche de tâche modifiée.');
        }}
      />

    </div>
  );
};
export default App;
