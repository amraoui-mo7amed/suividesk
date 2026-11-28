import { Employee, EmployeeInput, TaskItem, TaskAttachmentInput, AuthStatus, SyncStatus, SyncPreviewData, SyncResult, SyncRollbackResult } from '../types';

const STORAGE_KEYS = {
  EMPLOYEES: 'suividesk_mobile_employees',
  TASKS: 'suividesk_mobile_tasks',
  SECURITY: 'suividesk_mobile_security',
  BACKUP: 'suividesk_mobile_backup_pre_sync',
  DEVICE_ID: 'suividesk_mobile_device_id'
};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function sha256Hash(text: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(salt + text);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function initMobileAdapter() {
  if (typeof window === 'undefined') return;
  // If running inside Electron, keep native electronAPI
  if (window.electronAPI) return;

  console.log('📱 Initializing SuiviDesk Mobile Adapter (Capacitor/Web)');

  const getOrCreateDeviceId = (): string => {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
  };

  const getSecurity = () => getStored<{ passwordHash?: string; salt?: string; enabled: boolean; autoLockMinutes: number }>(
    STORAGE_KEYS.SECURITY,
    { enabled: false, autoLockMinutes: 0 }
  );

  window.electronAPI = {
    isMobile: true,
    // --- Employees ---
    getEmployees: async () => {
      const list = getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      const tasks = getStored<TaskItem[]>(STORAGE_KEYS.TASKS, []);

      return list
        .filter((e) => !e.is_deleted)
        .map((emp) => {
          const empTasks = tasks.filter((t) => t.agent_id === emp.id && !t.is_deleted);
          return {
            ...emp,
            tasks_count: empTasks.length,
            traite_count: empTasks.filter((t) => t.etat_courrier === 'traite').length,
            en_cours_count: empTasks.filter((t) => t.etat_courrier === 'en_cours').length,
            non_traite_count: empTasks.filter((t) => t.etat_courrier === 'non_traite').length
          };
        });
    },

    getEmployeeById: async (id: number) => {
      const list = getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      const emp = list.find((e) => e.id === id && !e.is_deleted);
      return emp || null;
    },

    createEmployee: async (data: EmployeeInput) => {
      const list = getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      const newId = list.length > 0 ? Math.max(...list.map((e) => e.id)) + 1 : 1;
      const now = new Date().toISOString();

      const newEmp: Employee = {
        id: newId,
        sync_uuid: generateUUID(),
        civilite: data.civilite || '',
        full_name: data.full_name || '',
        file_name: data.file_data?.name || '',
        file_path: data.file_data?.sourcePath || '',
        file_type: data.file_data?.name?.split('.').pop() || '',
        created_at: now,
        updated_at: now,
        is_deleted: 0
      };

      list.push(newEmp);
      setStored(STORAGE_KEYS.EMPLOYEES, list);
      return { success: true, id: newId };
    },

    updateEmployee: async (id: number, data: EmployeeInput) => {
      const list = getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      const idx = list.findIndex((e) => e.id === id);
      if (idx === -1) return { success: false, error: 'Employé introuvable.' };

      list[idx] = {
        ...list[idx],
        civilite: data.civilite ?? list[idx].civilite,
        full_name: data.full_name ?? list[idx].full_name,
        updated_at: new Date().toISOString()
      };

      if (data.remove_file) {
        list[idx].file_name = '';
        list[idx].file_path = '';
      }
      if (data.file_data) {
        list[idx].file_name = data.file_data.name;
      }

      setStored(STORAGE_KEYS.EMPLOYEES, list);
      return { success: true };
    },

    deleteEmployee: async (id: number) => {
      const list = getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      const idx = list.findIndex((e) => e.id === id);
      if (idx !== -1) {
        list[idx].is_deleted = 1;
        list[idx].updated_at = new Date().toISOString();
        setStored(STORAGE_KEYS.EMPLOYEES, list);
      }
      // Also soft-delete tasks
      const tasks = getStored<TaskItem[]>(STORAGE_KEYS.TASKS, []);
      for (const t of tasks) {
        if (t.agent_id === id) {
          t.is_deleted = 1;
          t.updated_at = new Date().toISOString();
        }
      }
      setStored(STORAGE_KEYS.TASKS, tasks);
      return { success: true };
    },

    // --- Tasks ---
    getAllTasks: async () => {
      const tasks = getStored<TaskItem[]>(STORAGE_KEYS.TASKS, []);
      const emps = getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
      return tasks
        .filter((t) => !t.is_deleted)
        .map((t) => {
          const emp = emps.find((e) => e.id === t.agent_id);
          return {
            ...t,
            agent_full_name: emp?.full_name || '',
            agent_civilite: emp?.civilite || ''
          };
        });
    },

    getTasksByEmployee: async (employeeId: number) => {
      const tasks = getStored<TaskItem[]>(STORAGE_KEYS.TASKS, []);
      return tasks.filter((t) => t.agent_id === employeeId && !t.is_deleted);
    },

    createTask: async (data: Partial<TaskItem> & { attachments?: TaskAttachmentInput[]; subtasks?: any[] }) => {
      const tasks = getStored<TaskItem[]>(STORAGE_KEYS.TASKS, []);
      const newId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
      const now = new Date().toISOString();

      const newTask: TaskItem = {
        id: newId,
        sync_uuid: generateUUID(),
        agent_id: data.agent_id ?? null,
        numero_ordre: data.numero_ordre || '',
        titre: data.titre || '',
        sujet: data.sujet || '',
        personne_cible: data.personne_cible || '',
        reference_dossier: data.reference_dossier || '',
        wilaya: data.wilaya || '',
        priorite: data.priorite || 'Moyenne',
        date_courrier: data.date_courrier || '',
        date_distribution: data.date_distribution || '',
        date_debut: data.date_debut || '',
        date_finale: data.date_finale || '',
        etat_courrier: data.etat_courrier || 'non_traite',
        note: data.note || '',
        note_finale: data.note_finale || '',
        created_at: now,
        updated_at: now,
        is_deleted: 0,
        documents: [],
        subtasks: Array.isArray(data.subtasks)
          ? data.subtasks.map((st, i) => {
              const files = Array.isArray(st.files)
                ? st.files
                : st.file_name
                  ? [{ name: st.file_name, type: st.file_type, size: st.file_size }]
                  : [];
              return {
                ...st,
                id: i + 1,
                sync_uuid: generateUUID(),
                task_id: newId,
                statut: st.statut || '',
                files,
                file_name: files[0]?.name || st.file_data?.name || st.file_name || '',
                file_type: files[0]?.type || st.file_data?.name?.split('.').pop() || st.file_type || '',
                file_size: files[0]?.size || st.file_data?.size || st.file_size || 0
              };
            })
          : []
      };

      tasks.push(newTask);
      setStored(STORAGE_KEYS.TASKS, tasks);
      return { success: true, id: newId };
    },

    updateTask: async (id: number, data: Partial<TaskItem> & { subtasks?: any[] }) => {
      const tasks = getStored<TaskItem[]>(STORAGE_KEYS.TASKS, []);
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) return { success: false, error: 'Tâche introuvable.' };

      let updatedSubtasks = tasks[idx].subtasks || [];
      if (Array.isArray(data.subtasks)) {
        updatedSubtasks = data.subtasks
          .filter((st) => !st.is_deleted)
          .map((st, i) => {
            const files = Array.isArray(st.files)
              ? st.files
              : st.file_name
                ? [{ name: st.file_name, type: st.file_type, size: st.file_size }]
                : [];
            return {
              ...st,
              id: st.id || Date.now() + i,
              task_id: id,
              sync_uuid: st.sync_uuid || generateUUID(),
              statut: st.statut || '',
              files,
              file_name: files[0]?.name || st.file_data?.name || (st.remove_file ? '' : st.file_name) || '',
              file_type: files[0]?.type || st.file_data?.name?.split('.').pop() || (st.remove_file ? '' : st.file_type) || '',
              file_size: files[0]?.size || st.file_data?.size || (st.remove_file ? 0 : st.file_size) || 0
            };
          });
      }

      tasks[idx] = {
        ...tasks[idx],
        ...data,
        subtasks: updatedSubtasks,
        updated_at: new Date().toISOString()
      };

      setStored(STORAGE_KEYS.TASKS, tasks);
      return { success: true };
    },

    transferTasksBulk: async (bulkData: { taskIds: number[]; targetAgentId: number }) => {
      const tasks = getStored<TaskItem[]>(STORAGE_KEYS.TASKS, []);
      const now = new Date().toISOString();
      let count = 0;
      const updated = tasks.map((t) => {
        if (bulkData.taskIds.includes(t.id)) {
          count++;
          return { ...t, agent_id: bulkData.targetAgentId, updated_at: now };
        }
        return t;
      });
      setStored(STORAGE_KEYS.TASKS, updated);
      return { success: true, count };
    },

    openSubtaskFileExternal: async (_subtaskId: number) => {
      return { success: true };
    },

    deleteTask: async (id: number) => {
      const tasks = getStored<TaskItem[]>(STORAGE_KEYS.TASKS, []);
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx !== -1) {
        tasks[idx].is_deleted = 1;
        tasks[idx].updated_at = new Date().toISOString();
        setStored(STORAGE_KEYS.TASKS, tasks);
      }
      return { success: true };
    },

    // --- Files (Mobile fallback) ---
    pickDocumentFile: async () => ({ canceled: true }),
    pickMultipleDocuments: async () => ({ canceled: true, files: [] }),
    getEmployeeFilePreview: async () => ({ success: false, kind: 'empty' }),
    openEmployeeFileExternal: async () => ({ success: false }),
    getTaskDocumentPreview: async () => ({ success: false, kind: 'empty' }),
    openTaskDocumentExternal: async () => ({ success: false }),

    // --- Exports (Web fallbacks) ---
    exportEmployeesPdf: async () => ({ success: false, error: 'Export PDF disponible sur Desktop' }),
    exportEmployeesCsv: async () => ({ success: false, error: 'Export CSV disponible sur Desktop' }),
    exportEmployeeTasksPdf: async () => ({ success: false, error: 'Export PDF disponible sur Desktop' }),
    exportEmployeeTasksCsv: async () => ({ success: false, error: 'Export CSV disponible sur Desktop' }),
    openExternal: async (url: string) => { window.open(url, '_blank'); },
    backupDatabase: async () => ({ success: false, error: 'Sauvegarde automatique intégrée sur mobile' }),
    restoreDatabase: async () => ({ success: false, error: 'Restauration via synchronisation réseau' }),

    // --- App Lock & Security ---
    getLockStatus: async () => {
      const sec = getSecurity();
      return { isConfigured: Boolean(sec.enabled && sec.passwordHash), autoLockMinutes: sec.autoLockMinutes || 0 };
    },

    verifyPassword: async (password: string) => {
      const sec = getSecurity();
      if (!sec.enabled || !sec.passwordHash || !sec.salt) return { success: true };
      const hash = await sha256Hash(password, sec.salt);
      return { success: hash === sec.passwordHash };
    },

    setPassword: async (newPassword: string, currentPassword?: string) => {
      const sec = getSecurity();
      if (sec.enabled && sec.passwordHash && sec.salt && currentPassword) {
        const curHash = await sha256Hash(currentPassword, sec.salt);
        if (curHash !== sec.passwordHash) {
          return { success: false, error: 'Mot de passe actuel incorrect.' };
        }
      }
      const salt = Math.random().toString(36).substring(2, 10);
      const hash = await sha256Hash(newPassword, salt);
      setStored(STORAGE_KEYS.SECURITY, {
        enabled: true,
        passwordHash: hash,
        salt,
        autoLockMinutes: sec.autoLockMinutes || 0
      });
      return { success: true };
    },

    disablePassword: async (currentPassword: string) => {
      const sec = getSecurity();
      if (sec.passwordHash && sec.salt) {
        const curHash = await sha256Hash(currentPassword, sec.salt);
        if (curHash !== sec.passwordHash) {
          return { success: false, error: 'Mot de passe actuel incorrect.' };
        }
      }
      setStored(STORAGE_KEYS.SECURITY, { ...sec, enabled: false });
      return { success: true };
    },

    setAutoLockMinutes: async (minutes: number) => {
      const sec = getSecurity();
      setStored(STORAGE_KEYS.SECURITY, { ...sec, autoLockMinutes: minutes });
      return { success: true };
    },

    // --- Network Sync (Mobile to Desktop PC over LAN / Wi-Fi via fetch) ---
    getSyncStatus: async () => ({
      deviceId: getOrCreateDeviceId(),
      workstationName: 'SuiviDesk Mobile',
      port: 4850
    }),

    discoverLanPeers: async () => [],

    getSyncPreview: async (remoteIp: string, remotePort = 4850) => {
      try {
        const localEmps = getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
        const localTasks = getStored<TaskItem[]>(STORAGE_KEYS.TASKS, []);

        const tasksWithAgentUuid = localTasks.map((t) => {
          const emp = localEmps.find((e) => e.id === t.agent_id);
          return {
            ...t,
            agent_sync_uuid: emp?.sync_uuid || ''
          };
        });

        const res = await fetch(`http://${remoteIp}:${remotePort}/api/sync/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: getOrCreateDeviceId(),
            workstationName: 'SuiviDesk Mobile',
            timestamp: new Date().toISOString(),
            employees: localEmps,
            tasks: tasksWithAgentUuid,
            documents: []
          })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const preview = await res.json();
        // Remember IP on successful response
        localStorage.setItem('suividesk_last_pc_ip', remoteIp);
        return { success: true, preview };
      } catch (err: any) {
        return { success: false, error: `Impossible de contacter le PC (${err?.message || 'Erreur réseau'})` };
      }
    },

    executeSync: async (remoteIp: string, remotePort = 4850) => {
      try {
        const localEmps = getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
        const localTasks = getStored<TaskItem[]>(STORAGE_KEYS.TASKS, []);

        const tasksWithAgentUuid = localTasks.map((t) => {
          const emp = localEmps.find((e) => e.id === t.agent_id);
          return {
            ...t,
            agent_sync_uuid: emp?.sync_uuid || ''
          };
        });

        // 1. Send mobile deltas to desktop PC
        const pushRes = await fetch(`http://${remoteIp}:${remotePort}/api/sync/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: getOrCreateDeviceId(),
            workstationName: 'SuiviDesk Mobile',
            timestamp: new Date().toISOString(),
            employees: localEmps,
            tasks: tasksWithAgentUuid,
            documents: []
          })
        });
        if (!pushRes.ok) throw new Error(`Erreur envoi: HTTP ${pushRes.status}`);

        // 2. Fetch PC deltas to merge onto mobile
        const pullRes = await fetch(`http://${remoteIp}:${remotePort}/api/sync/deltas`);
        if (!pullRes.ok) throw new Error(`Erreur réception: HTTP ${pullRes.status}`);
        const remoteDeltas = await pullRes.json();

        // 3. Bidirectional merge on mobile (LWW)
        const empMap = new Map<string, Employee>();
        localEmps.forEach((e) => { if (e.sync_uuid) empMap.set(e.sync_uuid, e); });
        for (const rem of remoteDeltas.employees || []) {
          if (!rem.sync_uuid) continue;
          const loc = empMap.get(rem.sync_uuid);
          if (!loc || new Date(rem.updated_at || 0) >= new Date(loc.updated_at || 0)) {
            empMap.set(rem.sync_uuid, { ...rem, id: loc ? loc.id : (empMap.size + 1) });
          }
        }
        const mergedEmployees = Array.from(empMap.values());
        setStored(STORAGE_KEYS.EMPLOYEES, mergedEmployees);

        const taskMap = new Map<string, TaskItem>();
        localTasks.forEach((t) => { if (t.sync_uuid) taskMap.set(t.sync_uuid, t); });
        for (const rem of remoteDeltas.tasks || []) {
          if (!rem.sync_uuid) continue;
          const loc = taskMap.get(rem.sync_uuid);
          let resolvedAgentId = rem.agent_id;
          if (rem.agent_sync_uuid) {
            const foundEmp = mergedEmployees.find((e) => e.sync_uuid === rem.agent_sync_uuid);
            if (foundEmp) resolvedAgentId = foundEmp.id;
          }
          if (!loc || new Date(rem.updated_at || 0) >= new Date(loc.updated_at || 0)) {
            taskMap.set(rem.sync_uuid, {
              ...rem,
              id: loc ? loc.id : (taskMap.size + 1),
              agent_id: resolvedAgentId
            });
          }
        }
        setStored(STORAGE_KEYS.TASKS, Array.from(taskMap.values()));

        localStorage.setItem('suividesk_last_pc_ip', remoteIp);

        return {
          success: true,
          appliedCount: (remoteDeltas.employees?.length || 0) + (remoteDeltas.tasks?.length || 0),
          conflictCount: 0
        };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Erreur lors de la synchronisation.' };
      }
    },

    rollbackSync: async () => ({ success: false, error: 'Fonction de rollback gérée sur le PC principal.' }),
    getSyncConflicts: async () => [],
    getSyncDevices: async () => []
  };
}
