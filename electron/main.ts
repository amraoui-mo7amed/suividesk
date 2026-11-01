import { app, BrowserWindow, ipcMain, shell, Notification, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import { getDatabase } from './db.js';

if (process.platform === 'win32') {
  app.setAppUserModelId('dz.cnas.suividesk');
}
import { computeAlertStatus, scanActiveAlerts, checkAndNotify } from './alerts.js';
import { generatePdfReport, exportCsvReport } from './pdfWorker.js';

export { getDatabase } from './db.js';
export { computeAlertStatus, scanActiveAlerts, checkAndNotify } from './alerts.js';
export { generatePdfReport, exportCsvReport } from './pdfWorker.js';

let mainWindow: BrowserWindow | null = null;
let alertInterval: NodeJS.Timeout | null = null;

const isDev = process.env.NODE_ENV !== 'production' && !app?.isPackaged;

function getAppIcon() {
  const possiblePaths = [
    path.join(__dirname, '../assets/icon.ico'),
    path.join(process.resourcesPath || '', 'assets/icon.ico'),
    path.join(__dirname, '../assets/icon.png'),
    path.join(process.resourcesPath || '', 'assets/icon.png')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return nativeImage.createFromPath(p);
  }
  return undefined;
}

function createWindow() {
  const appIcon = getAppIcon();

  if (process.platform === 'darwin' && app.dock) {
    try {
      const macIcon = path.join(__dirname, '../assets/icon.png');
      if (fs.existsSync(macIcon)) app.dock.setIcon(macIcon);
    } catch (e) {
      console.error('Dock icon error:', e);
    }
  }

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    title: 'SuiviDesk',
    backgroundColor: '#0a0f1d',
    icon: appIcon,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// -------------------------------------------------------------
// IPC Handlers
// -------------------------------------------------------------
function registerIpcHandlers() {
  const db = getDatabase();

  // 1. Tasks Handlers
  ipcMain.handle('tasks:getAll', async (_, filters) => {
    let query = `
      SELECT 
        t.id, t.template_id, t.titre, t.description, t.service, t.priorite, t.statut,
        t.agent_id, t.date_debut, t.date_echeance, t.date_completion, t.reference_dossier,
        t.progression, t.notes, t.motif_blocage, t.created_at, t.updated_at,
        e.nom AS agent_nom, e.prenom AS agent_prenom, e.matricule AS agent_matricule, e.service AS agent_service, e.avatar AS agent_avatar
      FROM task_assignments t
      LEFT JOIN employees e ON t.agent_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.service && filters.service !== 'Tous') {
      query += ' AND t.service = ?';
      params.push(filters.service);
    }

    if (filters?.statut && filters.statut !== 'Tous') {
      if (filters.statut === 'En retard') {
        // Will be filtered in JS or date condition
        query += " AND t.statut != 'Terminée' AND t.date_echeance < date('now')";
      } else {
        query += ' AND t.statut = ?';
        params.push(filters.statut);
      }
    }

    if (filters?.priorite && filters.priorite !== 'Toutes') {
      query += ' AND t.priorite = ?';
      params.push(filters.priorite);
    }

    if (filters?.agent_id && filters.agent_id !== 'Tous') {
      query += ' AND t.agent_id = ?';
      params.push(filters.agent_id);
    }

    if (filters?.date_debut) {
      query += ' AND t.date_debut >= ?';
      params.push(filters.date_debut);
    }

    if (filters?.date_fin) {
      query += ' AND t.date_echeance <= ?';
      params.push(filters.date_fin);
    }

    query += ' ORDER BY t.date_echeance ASC';

    let rows = db.prepare(query).all(...params) as any[];

    // Add computed alert properties
    let computedRows = rows.map((r) => {
      const alertInfo = computeAlertStatus(r.date_echeance, r.statut);
      const [y, m, d] = r.date_echeance.split('-');
      const [sy, sm, sd] = r.date_debut.split('-');
      return {
        ...r,
        ...alertInfo,
        date_echeance_fr: `${d}/${m}/${y}`,
        date_debut_fr: `${sd}/${sm}/${sy}`
      };
    });

    // Handle alert_filter (e.g. 'j-3', 'overdue')
    if (filters?.alerte && filters.alerte !== 'Toutes') {
      if (filters.alerte === 'j-3') {
        computedRows = computedRows.filter((t) => t.alert_level === 'j-3');
      } else if (filters.alerte === 'overdue') {
        computedRows = computedRows.filter((t) => t.alert_level === 'overdue');
      }
    }

    // Keyword live search
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.trim().toLowerCase();
      computedRows = computedRows.filter((t) =>
        t.titre.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.reference_dossier && t.reference_dossier.toLowerCase().includes(q)) ||
        t.agent_nom.toLowerCase().includes(q) ||
        t.agent_prenom.toLowerCase().includes(q) ||
        t.agent_matricule.toLowerCase().includes(q)
      );
    }

    return computedRows;
  });

  ipcMain.handle('tasks:getById', async (_, id: number) => {
    const row = db.prepare(`
      SELECT 
        t.*,
        e.nom AS agent_nom, e.prenom AS agent_prenom, e.matricule AS agent_matricule, e.service AS agent_service
      FROM task_assignments t
      LEFT JOIN employees e ON t.agent_id = e.id
      WHERE t.id = ?
    `).get(id) as any;

    if (!row) return null;
    const alertInfo = computeAlertStatus(row.date_echeance, row.statut);
    return { ...row, ...alertInfo };
  });

  ipcMain.handle('tasks:create', async (_, data) => {
    const stmt = db.prepare(`
      INSERT INTO task_assignments (
        template_id, titre, description, service, priorite, statut,
        agent_id, date_debut, date_echeance, reference_dossier, progression, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.template_id || null,
      data.titre,
      data.description || '',
      data.service,
      data.priorite || 'Moyenne',
      data.statut || 'En attente',
      data.agent_id ? Number(data.agent_id) : null,
      data.date_debut,
      data.date_echeance,
      data.reference_dossier || null,
      data.progression || 0,
      data.notes || ''
    );

    return { success: true, id: result.lastInsertRowid };
  });

  ipcMain.handle('tasks:update', async (_, id: number, data) => {
    const stmt = db.prepare(`
      UPDATE task_assignments SET
        titre = ?, description = ?, service = ?, priorite = ?, statut = ?,
        agent_id = ?, date_debut = ?, date_echeance = ?, reference_dossier = ?,
        progression = ?, notes = ?, motif_blocage = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      data.titre,
      data.description || '',
      data.service,
      data.priorite,
      data.statut,
      data.agent_id,
      data.date_debut,
      data.date_echeance,
      data.reference_dossier || null,
      data.progression ?? 0,
      data.notes || '',
      data.motif_blocage || null,
      id
    );

    return { success: true };
  });

  ipcMain.handle('tasks:updateStatus', async (_, id: number, status: string, notes?: string, motifBlocage?: string, progression?: number) => {
    let query = 'UPDATE task_assignments SET statut = ?, updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [status];

    if (status === 'Terminée') {
      query += ", date_completion = date('now'), progression = 100";
    } else if (progression !== undefined) {
      query += ', progression = ?';
      params.push(progression);
    }

    if (notes !== undefined) {
      query += ', notes = ?';
      params.push(notes);
    }

    if (motifBlocage !== undefined) {
      query += ', motif_blocage = ?';
      params.push(motifBlocage);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.prepare(query).run(...params);
    return { success: true };
  });

  ipcMain.handle('tasks:delete', async (_, id: number) => {
    db.prepare('DELETE FROM task_assignments WHERE id = ?').run(id);
    return { success: true };
  });

  // 2. Employees Handlers
  ipcMain.handle('employees:getAll', async () => {
    const employees = db.prepare('SELECT * FROM employees ORDER BY service ASC, nom ASC').all() as any[];

    // Calculate active tasks, J-3 alerts and workload
    const tasks = db.prepare("SELECT agent_id, statut, date_echeance FROM task_assignments WHERE statut != 'Terminée'").all() as any[];

    return employees.map((emp) => {
      const empTasks = tasks.filter((t) => t.agent_id === emp.id);
      const activeCount = empTasks.length;
      let j3Count = 0;
      let overdueCount = 0;

      for (const t of empTasks) {
        const { alert_level } = computeAlertStatus(t.date_echeance, t.statut);
        if (alert_level === 'j-3') j3Count++;
        if (alert_level === 'overdue') overdueCount++;
      }

      const workloadPercent = Math.min(100, Math.round((activeCount / (emp.max_capacity || 10)) * 100));

      return {
        ...emp,
        active_tasks_count: activeCount,
        j3_alerts_count: j3Count,
        overdue_count: overdueCount,
        workload_percentage: workloadPercent
      };
    });
  });

  ipcMain.handle('employees:getById', async (_, id: number) => {
    return db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  });

  ipcMain.handle('employees:create', async (_, data) => {
    const stmt = db.prepare(`
      INSERT INTO employees (matricule, nom, prenom, email, telephone, service, poste, max_capacity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const emailVal = (data.email && data.email.trim()) 
      ? data.email.trim() 
      : `${(data.prenom || 'agent').toLowerCase().replace(/\s+/g, '')}.${(data.nom || 'cnas').toLowerCase().replace(/\s+/g, '')}@cnas.dz`;
    const res = stmt.run(
      data.matricule.trim().toUpperCase(),
      data.nom.trim(),
      data.prenom.trim(),
      emailVal,
      data.telephone || '',
      data.service || 'Recouvrement',
      data.poste || 'Agent',
      data.max_capacity || 10
    );
    return { success: true, id: res.lastInsertRowid };
  });

  ipcMain.handle('employees:update', async (_, id: number, data) => {
    const stmt = db.prepare(`
      UPDATE employees SET
        matricule = ?, nom = ?, prenom = ?, email = ?, telephone = ?,
        service = ?, poste = ?, max_capacity = ?
      WHERE id = ?
    `);
    stmt.run(data.matricule, data.nom, data.prenom, data.email, data.telephone || '', data.service, data.poste, data.max_capacity || 10, id);
    return { success: true };
  });

  ipcMain.handle('employees:delete', async (_, id: number) => {
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);
    return { success: true };
  });

  // 3. Task Templates Handlers (Catalogue)
  ipcMain.handle('templates:getAll', async (_, service?: string) => {
    if (service && service !== 'Tous') {
      return db.prepare('SELECT * FROM task_templates WHERE service = ? ORDER BY code ASC').all(service);
    }
    return db.prepare('SELECT * FROM task_templates ORDER BY service ASC, code ASC').all();
  });

  ipcMain.handle('templates:create', async (_, data) => {
    const stmt = db.prepare(`
      INSERT INTO task_templates (code, titre, description, service, priorite_defaut, duree_estimee_jours, instructions_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(data.code, data.titre, data.description || '', data.service, data.priorite_defaut, data.duree_estimee_jours || 3, data.instructions_type || '');
    return { success: true, id: res.lastInsertRowid };
  });

  ipcMain.handle('templates:update', async (_, id: number, data) => {
    const stmt = db.prepare(`
      UPDATE task_templates SET
        code = ?, titre = ?, description = ?, service = ?, priorite_defaut = ?,
        duree_estimee_jours = ?, instructions_type = ?
      WHERE id = ?
    `);
    stmt.run(data.code, data.titre, data.description || '', data.service, data.priorite_defaut, data.duree_estimee_jours || 3, data.instructions_type || '', id);
    return { success: true };
  });

  ipcMain.handle('templates:delete', async (_, id: number) => {
    db.prepare('DELETE FROM task_templates WHERE id = ?').run(id);
    return { success: true };
  });

  // 4. Alerts & Dashboard Handlers
  ipcMain.handle('alerts:getActive', async () => {
    return scanActiveAlerts(db);
  });

  ipcMain.handle('dashboard:getStats', async () => {
    const allTasks = db.prepare(`
      SELECT t.*, e.nom AS agent_nom, e.prenom AS agent_prenom, e.service AS agent_service
      FROM task_assignments t
      LEFT JOIN employees e ON t.agent_id = e.id
    `).all() as any[];

    let total = allTasks.length;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let blocked = 0;
    let approachingJ3 = 0;
    let overdue = 0;

    const serviceCounts: Record<string, { total: number; completed: number; active: number }> = {};
    const agentWorkloadMap: Record<string, { name: string; service: string; active: number; j3: number; overdue: number; capacity: number }> = {};

    for (const t of allTasks) {
      const alertInfo = computeAlertStatus(t.date_echeance, t.statut);
      if (t.statut === 'Terminée') {
        completed++;
      } else {
        if (t.statut === 'En cours') inProgress++;
        if (t.statut === 'En attente') pending++;
        if (t.statut === 'Bloquée') blocked++;

        if (alertInfo.alert_level === 'j-3') approachingJ3++;
        if (alertInfo.alert_level === 'overdue') overdue++;
      }

      // Group by service
      if (!serviceCounts[t.service]) {
        serviceCounts[t.service] = { total: 0, completed: 0, active: 0 };
      }
      serviceCounts[t.service].total++;
      if (t.statut === 'Terminée') {
        serviceCounts[t.service].completed++;
      } else {
        serviceCounts[t.service].active++;
      }

      // Group by agent if assigned
      if (t.agent_nom) {
        const agentKey = `${t.agent_prenom || ''} ${t.agent_nom}`.trim();
        if (!agentWorkloadMap[agentKey]) {
          agentWorkloadMap[agentKey] = {
            name: agentKey,
            service: t.agent_service || t.service,
            active: 0,
            j3: 0,
            overdue: 0,
            capacity: 10
          };
        }
        if (t.statut !== 'Terminée') {
          agentWorkloadMap[agentKey].active++;
          if (alertInfo.alert_level === 'j-3') agentWorkloadMap[agentKey].j3++;
          if (alertInfo.alert_level === 'overdue') agentWorkloadMap[agentKey].overdue++;
        }
      }
    }

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const serviceBreakdown = Object.entries(serviceCounts).map(([service, counts]) => ({
      service,
      total: counts.total,
      active: counts.active,
      completed: counts.completed
    }));

    const agentWorkload = Object.values(agentWorkloadMap);

    return {
      kpis: {
        total,
        completed,
        inProgress,
        pending,
        blocked,
        approachingJ3,
        overdue,
        completionRate
      },
      serviceBreakdown,
      agentWorkload
    };
  });

  ipcMain.handle('alerts:notify', async (_, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
      return true;
    }
    return false;
  });

  // 5. Export Handlers
  ipcMain.handle('export:generatePdf', async (_, options) => {
    return generatePdfReport(options);
  });

  ipcMain.handle('export:generateCsv', async (_, tasks) => {
    return exportCsvReport(tasks);
  });

  ipcMain.handle('app:openExternal', async (_, url: string) => {
    shell.openExternal(url);
  });
}

// -------------------------------------------------------------
// App Lifecycle
// -------------------------------------------------------------
if (app) {
  app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();

    // Initial proactive alert check
    const db = getDatabase();
    setTimeout(() => {
      checkAndNotify(db, true);
    }, 2500);

    // Periodic alert check every 60 minutes
    alertInterval = setInterval(() => {
      checkAndNotify(db, false);
    }, 60 * 60 * 1000);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    if (process.env.TEST_EXIT === '1') {
      console.log('TEST_EXIT: SuiviDesk Electron and SQLite initialized cleanly.');
      setTimeout(() => {
        app.quit();
      }, 1500);
    }
  });

  app.on('window-all-closed', () => {
    if (alertInterval) clearInterval(alertInterval);
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
