import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Employee, TaskItem } from './types';
import { Navbar, MainNavTab } from './components/Navbar';
import { AboutModal } from './components/AboutModal';
import { ConfirmModal } from './components/ConfirmModal';
import { EmployeeModal } from './components/EmployeeModal';
import { TaskModal } from './components/TaskModal';
import { EmployeeDetailsView } from './components/views/EmployeeDetailsView';
import { TaskTrackingView } from './components/views/TaskTrackingView';
import { DashboardView } from './components/views/DashboardView';

export const App: React.FC = () => {
  // Navigation State: 'dashboard' (Home) | 'suivi' | 'home' (Collaborateurs)
  const [currentTab, setCurrentTab] = useState<MainNavTab>('dashboard');

  // Core Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<TaskItem[]>([]);

  // Modal States
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [taskTargetEmployeeId, setTaskTargetEmployeeId] = useState<number | null>(null);

  // Loading & Export Feedback
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  }, []);

  const loadEmployees = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const list = await window.electronAPI.getEmployees();
      setEmployees(list || []);
    } catch (err) {
      console.error('Erreur chargement employés:', err);
    }
  }, []);

  const loadAllTasks = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const list = await window.electronAPI.getAllTasks();
      setAllTasks(list || []);
    } catch (err) {
      console.error('Erreur chargement ensemble des tâches:', err);
    }
  }, []);

  const loadTasksForEmployee = useCallback(async (empId: number) => {
    if (!window.electronAPI) return;
    try {
      const list = await window.electronAPI.getTasksByEmployee(empId);
      setEmployeeTasks(list || []);
    } catch (err) {
      console.error('Erreur chargement tâches employé:', err);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
    loadAllTasks();
  }, [loadEmployees, loadAllTasks]);

  useEffect(() => {
    if (selectedEmployeeId !== null) {
      loadTasksForEmployee(selectedEmployeeId);
    } else {
      setEmployeeTasks([]);
    }
  }, [selectedEmployeeId, loadTasksForEmployee]);

  const selectedEmployee =
    selectedEmployeeId !== null
      ? employees.find((e) => e.id === selectedEmployeeId) || null
      : null;

  // Delete Employee Confirmed
  const handleConfirmDeleteEmployee = async () => {
    if (!employeeToDelete || !window.electronAPI) return;
    try {
      setIsDeleting(true);
      const res = await window.electronAPI.deleteEmployee(employeeToDelete.id);
      if (res.success) {
        if (selectedEmployeeId === employeeToDelete.id) {
          setSelectedEmployeeId(null);
        }
        await loadEmployees();
        await loadAllTasks();
        showToast('Employé supprimé avec succès.');
      } else if (res.error) {
        alert(res.error);
      }
    } finally {
      setIsDeleting(false);
      setEmployeeToDelete(null);
    }
  };

  // Delete Task Confirmed
  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete || !window.electronAPI) return;
    try {
      setIsDeleting(true);
      const res = await window.electronAPI.deleteTask(taskToDelete.id);
      if (res.success) {
        if (selectedEmployeeId !== null) {
          await loadTasksForEmployee(selectedEmployeeId);
        }
        await loadEmployees();
        await loadAllTasks();
        showToast('Tâche supprimée avec succès.');
      } else if (res.error) {
        alert(res.error);
      }
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null);
    }
  };

  // Export Handlers (Employees List)
  const handleExportEmployeesPdf = async (list: Employee[], filterSummary: string) => {
    if (!window.electronAPI) return;
    try {
      setIsExportingPdf(true);
      const res = await window.electronAPI.exportEmployeesPdf(list, filterSummary);
      if (res.success) {
        showToast('Rapport PDF des employés généré avec succès.');
      } else if (res.error && !res.error.includes('annulé')) {
        alert(res.error);
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportEmployeesCsv = async (list: Employee[]) => {
    if (!window.electronAPI) return;
    try {
      setIsExportingCsv(true);
      const res = await window.electronAPI.exportEmployeesCsv(list);
      if (res.success) {
        showToast('Fichier CSV des employés exporté avec succès.');
      } else if (res.error && !res.error.includes('annulé')) {
        alert(res.error);
      }
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Export Handlers (Employee Tasks)
  const handleExportTasksPdf = async (emp: Employee, tasks: TaskItem[]) => {
    if (!window.electronAPI) return;
    try {
      setIsExportingPdf(true);
      const res = await window.electronAPI.exportEmployeeTasksPdf(emp, tasks);
      if (res.success) {
        showToast('Rapport PDF des tâches généré avec succès.');
      } else if (res.error && !res.error.includes('annulé')) {
        alert(res.error);
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportTasksCsv = async (emp: Employee, tasks: TaskItem[]) => {
    if (!window.electronAPI) return;
    try {
      setIsExportingCsv(true);
      const res = await window.electronAPI.exportEmployeeTasksCsv(emp, tasks);
      if (res.success) {
        showToast('Fichier CSV des tâches exporté avec succès.');
      } else if (res.error && !res.error.includes('annulé')) {
        alert(res.error);
      }
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Active target for creating a task
  const activeTaskEmployee = selectedEmployee || (taskTargetEmployeeId !== null ? employees.find(e => e.id === taskTargetEmployeeId) : null) || employees[0] || null;

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden text-slate-800"
      style={{ background: 'var(--bg-app)' }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className="px-4 py-2.5 rounded-2xl cnas-btn-primary text-xs font-bold shadow-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top CNAS Header with 3 Tabs: Home / Tableau de Suivi / Tableau de Bord */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'home') {
            setSelectedEmployeeId(null);
          }
        }}
        selectedEmployee={selectedEmployee}
        onNavigateHome={() => {
          setSelectedEmployeeId(null);
          setCurrentTab('dashboard');
        }}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Scrollable Content */}
      <main className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7">
        {/* If inside Employee Details view */}
        {selectedEmployee ? (
          <EmployeeDetailsView
            employee={selectedEmployee}
            tasks={employeeTasks}
            onBack={() => setSelectedEmployeeId(null)}
            onEditEmployee={(emp) => {
              setEmployeeToEdit(emp);
              setIsEmployeeModalOpen(true);
            }}
            onAddTask={() => {
              setTaskToEdit(null);
              setTaskTargetEmployeeId(selectedEmployee.id);
              setIsTaskModalOpen(true);
            }}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setTaskTargetEmployeeId(selectedEmployee.id);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={(task) => setTaskToDelete(task)}
            onExportTasksPdf={handleExportTasksPdf}
            onExportTasksCsv={handleExportTasksCsv}
            isExportingPdf={isExportingPdf}
            isExportingCsv={isExportingCsv}
          />
        ) : currentTab === 'dashboard' ? (
          /* TAB 1: TABLEAU DE BORD (Home Page) */
          <DashboardView
            employees={employees}
            tasks={allTasks}
            onSelectEmployee={(empId) => {
              setSelectedEmployeeId(empId);
            }}
          />
        ) : (
          /* TAB 2: TABLEAU DE SUIVI (Shows ONLY Employees - Access details to see/add tasks) */
          <TaskTrackingView
            employees={employees}
            onSelectEmployee={(empId) => {
              setSelectedEmployeeId(empId);
            }}
            onAddEmployee={() => {
              setEmployeeToEdit(null);
              setIsEmployeeModalOpen(true);
            }}
            onEditEmployee={(emp) => {
              setEmployeeToEdit(emp);
              setIsEmployeeModalOpen(true);
            }}
            onDeleteEmployee={(emp) => {
              setEmployeeToDelete(emp);
            }}
            onExportEmployeesPdf={handleExportEmployeesPdf}
            onExportEmployeesCsv={handleExportEmployeesCsv}
            isExportingPdf={isExportingPdf}
            isExportingCsv={isExportingCsv}
          />
        )}
      </main>

      {/* About Modal with CNAS_logo.png & Data Backup/Restore */}
      <AboutModal 
        isOpen={isAboutOpen} 
        onClose={() => setIsAboutOpen(false)} 
      />

      {/* Add / Edit Employee Modal */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEmployeeToEdit(null);
        }}
        existingEmployees={employees}
        employeeToEdit={employeeToEdit}
        onSaved={async (msg) => {
          await loadEmployees();
          await loadAllTasks();
          showToast(msg);
        }}
      />

      {/* Add / Edit Task Modal (Only accessible if at least one employee exists) */}
      {isTaskModalOpen && employees.length > 0 && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskToEdit(null);
            setTaskTargetEmployeeId(null);
          }}
          employeeId={activeTaskEmployee ? activeTaskEmployee.id : 0}
          employeeName={
            activeTaskEmployee
              ? [
                  activeTaskEmployee.civilite,
                  activeTaskEmployee.full_name || `Employé #${activeTaskEmployee.id}`
                ]
                  .filter(Boolean)
                  .join(' ') || `Employé #${activeTaskEmployee.id}`
              : 'Collaborateur'
          }
          employees={employees}
          taskToEdit={taskToEdit}
          onSaved={async (msg) => {
            if (selectedEmployeeId !== null) {
              await loadTasksForEmployee(selectedEmployeeId);
            }
            await loadEmployees();
            await loadAllTasks();
            showToast(msg);
          }}
        />
      )}

      {/* Delete Employee Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(employeeToDelete)}
        title="Supprimer cet employé ?"
        message={`Voulez-vous vraiment supprimer définitivement « ${
          employeeToDelete?.full_name || `Employé #${employeeToDelete?.id}`
        } » ainsi que ses tâches associées ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        onConfirm={handleConfirmDeleteEmployee}
        onCancel={() => setEmployeeToDelete(null)}
        isLoading={isDeleting}
      />

      {/* Delete Task Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Supprimer cette tâche ?"
        message={`Voulez-vous vraiment supprimer la tâche « ${
          taskToDelete?.titre || `#${taskToDelete?.id}`
        } » ?`}
        confirmLabel="Oui, supprimer"
        onConfirm={handleConfirmDeleteTask}
        onCancel={() => setTaskToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default App;
