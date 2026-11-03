import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Employee, TaskItem } from './types';
import { Navbar } from './components/Navbar';
import { AboutModal } from './components/AboutModal';
import { ConfirmModal } from './components/ConfirmModal';
import { EmployeeModal } from './components/EmployeeModal';
import { TaskModal } from './components/TaskModal';
import { EmployeesListView } from './components/views/EmployeesListView';
import { EmployeeDetailsView } from './components/views/EmployeeDetailsView';

export const App: React.FC = () => {
  // Core Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
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
  }, [loadEmployees]);

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

      {/* Top CNAS Header */}
      <Navbar
        selectedEmployee={selectedEmployee}
        onNavigateHome={() => setSelectedEmployeeId(null)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Scrollable Content */}
      <main className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7">
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
              setIsTaskModalOpen(true);
            }}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={(task) => setTaskToDelete(task)}
            onExportTasksPdf={handleExportTasksPdf}
            onExportTasksCsv={handleExportTasksCsv}
            isExportingPdf={isExportingPdf}
            isExportingCsv={isExportingCsv}
          />
        ) : (
          <EmployeesListView
            employees={employees}
            onAddEmployee={() => {
              setEmployeeToEdit(null);
              setIsEmployeeModalOpen(true);
            }}
            onEditEmployee={(emp) => {
              setEmployeeToEdit(emp);
              setIsEmployeeModalOpen(true);
            }}
            onViewEmployeeDetails={(emp) => {
              setSelectedEmployeeId(emp.id);
            }}
            onDeleteEmployee={(emp) => {
              setEmployeeToDelete(emp);
            }}
            onExportPdf={handleExportEmployeesPdf}
            onExportCsv={handleExportEmployeesCsv}
            isExportingPdf={isExportingPdf}
            isExportingCsv={isExportingCsv}
          />
        )}
      </main>

      {/* About Modal with CNAS_logo.png */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

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
          showToast(msg);
        }}
      />

      {/* Add / Edit Task Modal */}
      {selectedEmployee && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskToEdit(null);
          }}
          employeeId={selectedEmployee.id}
          employeeName={
            [
              selectedEmployee.civilite,
              selectedEmployee.full_name || `Employé #${selectedEmployee.id}`
            ]
              .filter(Boolean)
              .join(' ') || `Employé #${selectedEmployee.id}`
          }
          taskToEdit={taskToEdit}
          onSaved={async (msg) => {
            await loadTasksForEmployee(selectedEmployee.id);
            await loadEmployees();
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
