import { app, BrowserWindow, Menu, nativeTheme, ipcMain, shell, dialog, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { getDatabase, getUserFilesDirectory } from './db.js';
import {
  exportEmployeesPdf,
  exportEmployeesCsv,
  exportEmployeeTasksPdf,
  exportEmployeeTasksCsv
} from './pdfWorker.js';

if (process.platform === 'win32' && app) {
  app.setAppUserModelId('dz.cnas.suividesk');
}

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development';

function detectFileType(fileName: string): string {
  const ext = path.extname(fileName || '').toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx' || ext === '.doc') return 'docx';
  if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') return 'excel';
  return ext ? ext.slice(1) : '';
}

function computeTreatmentDays(dateDebut?: string, dateFinale?: string): number | null {
  if (!dateDebut || !dateFinale) return null;
  const d1 = dateDebut.trim().split('-').map(Number);
  const d2 = dateFinale.trim().split('-').map(Number);
  if (d1.length !== 3 || d2.length !== 3) return null;
  if (d1.some(isNaN) || d2.some(isNaN)) return null;

  const startUtc = Date.UTC(d1[0], d1[1] - 1, d1[2]);
  const endUtc = Date.UTC(d2[0], d2[1] - 1, d2[2]);
  return Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24));
}

function saveEmployeeAttachment(fileData: { name: string; base64?: string; sourcePath?: string }): {
  fileName: string;
  filePath: string;
  fileType: string;
} {
  const filesDir = getUserFilesDirectory();
  const safeBaseName = path
    .basename(fileData.name || 'document')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  const storedName = `${Date.now()}_${safeBaseName}`;
  const destPath = path.join(filesDir, storedName);

  if (fileData.sourcePath && fs.existsSync(fileData.sourcePath)) {
    fs.copyFileSync(fileData.sourcePath, destPath);
  } else if (fileData.base64) {
    const rawB64 = fileData.base64.includes(',')
      ? fileData.base64.split(',')[1]
      : fileData.base64;
    fs.writeFileSync(destPath, Buffer.from(rawB64, 'base64'));
  } else {
    throw new Error('Fichier source introuvable.');
  }

  return {
    fileName: fileData.name,
    filePath: destPath,
    fileType: detectFileType(fileData.name)
  };
}

function getAppIcon() {
  const possiblePaths = [
    path.join(process.resourcesPath || '', 'assets/icon.ico'),
    path.join(process.resourcesPath || '', 'assets/CNAS_logo.png'),
    path.join(__dirname, '../assets/icon.ico'),
    path.join(process.cwd(), 'public', 'CNAS_logo.png'),
    path.join(__dirname, '../public/CNAS_logo.png'),
    path.join(__dirname, '../dist/CNAS_logo.png'),
    path.join(__dirname, '../assets/icon.png')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return nativeImage.createFromPath(p);
  }
  return undefined;
}

function createWindow() {
  const appIcon = getAppIcon();

  // Force light native theme (prevents Windows Dark Mode from affecting inputs/dialogs)
  nativeTheme.themeSource = 'light';

  // Completely remove the native application menu bar (File, Edit, View, Window, Help)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: true,
    autoHideMenuBar: true,
    title: 'SuiviDesk — CNAS',
    backgroundColor: '#E4EEF8',
    icon: appIcon,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.removeMenu();
  mainWindow.setMenuBarVisibility(false);
  mainWindow.show();
  mainWindow.focus();

  mainWindow.webContents.on('did-finish-load', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.setAlwaysOnTop(true);
      mainWindow.focus();
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setAlwaysOnTop(false);
        }
      }, 600);
    }
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173';
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

function enrichEmployeeCounts(db: ReturnType<typeof getDatabase>, emp: any) {
  const tasks = db
    .prepare('SELECT etat_courrier FROM task_assignments WHERE agent_id = ?')
    .all(emp.id) as Array<{ etat_courrier: string }>;

  let traiteCount = 0;
  let enCoursCount = 0;
  let nonTraiteCount = 0;

  for (const t of tasks) {
    if (t.etat_courrier === 'traite') traiteCount++;
    else if (t.etat_courrier === 'en_cours') enCoursCount++;
    else if (t.etat_courrier === 'non_traite') nonTraiteCount++;
  }

  return {
    ...emp,
    tasks_count: tasks.length,
    traite_count: traiteCount,
    en_cours_count: enCoursCount,
    non_traite_count: nonTraiteCount
  };
}

function registerIpcHandlers() {
  const db = getDatabase();

  // -------------------------------------------------------------
  // 1. Employees Handlers
  // -------------------------------------------------------------
  ipcMain.handle('employees:getAll', async () => {
    const rows = db
      .prepare(
        `SELECT * FROM employees
         ORDER BY
           CASE WHEN TRIM(COALESCE(full_name, '')) = '' THEN 1 ELSE 0 END ASC,
           LOWER(TRIM(full_name)) ASC,
           id ASC`
      )
      .all() as any[];

    return rows.map((emp) => enrichEmployeeCounts(db, emp));
  });

  ipcMain.handle('employees:getById', async (_, id: number) => {
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!emp) return null;
    return enrichEmployeeCounts(db, emp);
  });

  ipcMain.handle('employees:create', async (_, data) => {
    try {
      const civilite = (data?.civilite || '').trim();
      const fullName = (data?.full_name || '').trim();

      if (fullName !== '') {
        const existing = db
          .prepare('SELECT id FROM employees WHERE LOWER(TRIM(full_name)) = LOWER(?)')
          .get(fullName);
        if (existing) {
          return {
            success: false,
            error: 'Ce nom complet est déjà utilisé. Le nom complet doit être unique.'
          };
        }
      }

      let fileName = '';
      let filePath = '';
      let fileType = '';

      if (data?.file_data && data.file_data.name) {
        const saved = saveEmployeeAttachment(data.file_data);
        fileName = saved.fileName;
        filePath = saved.filePath;
        fileType = saved.fileType;
      }

      const res = db
        .prepare(
          `INSERT INTO employees (civilite, full_name, file_name, file_path, file_type)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(civilite, fullName, fileName, filePath, fileType);

      return { success: true, id: Number(res.lastInsertRowid) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la création de l’employé.' };
    }
  });

  ipcMain.handle('employees:update', async (_, id: number, data) => {
    try {
      const current = db.prepare('SELECT * FROM employees WHERE id = ?').get(id) as any;
      if (!current) {
        return { success: false, error: 'Employé introuvable.' };
      }

      const civilite = (data?.civilite ?? current.civilite ?? '').trim();
      const fullName = (data?.full_name ?? current.full_name ?? '').trim();

      if (fullName !== '') {
        const duplicate = db
          .prepare('SELECT id FROM employees WHERE LOWER(TRIM(full_name)) = LOWER(?) AND id != ?')
          .get(fullName, id);
        if (duplicate) {
          return {
            success: false,
            error: 'Ce nom complet est déjà utilisé par un autre employé.'
          };
        }
      }

      let fileName = current.file_name || '';
      let filePath = current.file_path || '';
      let fileType = current.file_type || '';

      if (data?.remove_file) {
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {}
        }
        fileName = '';
        filePath = '';
        fileType = '';
      }

      if (data?.file_data && data.file_data.name) {
        if (current.file_path && fs.existsSync(current.file_path)) {
          try {
            fs.unlinkSync(current.file_path);
          } catch {}
        }
        const saved = saveEmployeeAttachment(data.file_data);
        fileName = saved.fileName;
        filePath = saved.filePath;
        fileType = saved.fileType;
      }

      db.prepare(
        `UPDATE employees SET
           civilite = ?,
           full_name = ?,
           file_name = ?,
           file_path = ?,
           file_type = ?,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(civilite, fullName, fileName, filePath, fileType, id);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la modification de l’employé.' };
    }
  });

  ipcMain.handle('employees:delete', async (_, id: number) => {
    try {
      const current = db.prepare('SELECT file_path FROM employees WHERE id = ?').get(id) as any;
      if (current?.file_path && fs.existsSync(current.file_path)) {
        try {
          fs.unlinkSync(current.file_path);
        } catch {}
      }
      db.prepare('DELETE FROM task_assignments WHERE agent_id = ?').run(id);
      db.prepare('DELETE FROM employees WHERE id = ?').run(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la suppression.' };
    }
  });

  // -------------------------------------------------------------
  // 2. Tasks Handlers
  // -------------------------------------------------------------
  ipcMain.handle('tasks:getByEmployee', async (_, employeeId: number) => {
    const rows = db
      .prepare(
        `SELECT t.*, e.full_name AS agent_full_name, e.civilite AS agent_civilite
         FROM task_assignments t
         LEFT JOIN employees e ON t.agent_id = e.id
         WHERE t.agent_id = ?
         ORDER BY t.id DESC`
      )
      .all(employeeId) as any[];

    return rows.map((r) => ({
      ...r,
      duree_traitement_jours: computeTreatmentDays(r.date_debut, r.date_finale)
    }));
  });

  ipcMain.handle('tasks:getAll', async () => {
    const rows = db
      .prepare(
        `SELECT t.*, e.full_name AS agent_full_name, e.civilite AS agent_civilite
         FROM task_assignments t
         LEFT JOIN employees e ON t.agent_id = e.id
         ORDER BY t.id DESC`
      )
      .all() as any[];

    return rows.map((r) => ({
      ...r,
      duree_traitement_jours: computeTreatmentDays(r.date_debut, r.date_finale)
    }));
  });

  ipcMain.handle('tasks:create', async (_, data) => {
    try {
      const res = db
        .prepare(
          `INSERT INTO task_assignments (
             agent_id, titre, sujet, personne_cible, reference_dossier, wilaya, priorite,
             date_courrier, date_distribution, date_debut, date_finale, etat_courrier, note, note_finale
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          data?.agent_id ? Number(data.agent_id) : null,
          (data?.titre || '').trim(),
          (data?.sujet || '').trim(),
          (data?.personne_cible || '').trim(),
          (data?.reference_dossier || '').trim(),
          (data?.wilaya || '').trim(),
          (data?.priorite || '').trim(),
          (data?.date_courrier || '').trim(),
          (data?.date_distribution || '').trim(),
          (data?.date_debut || '').trim(),
          (data?.date_finale || '').trim(),
          (data?.etat_courrier || '').trim(),
          (data?.note || '').trim(),
          (data?.note_finale || '').trim()
        );

      return { success: true, id: Number(res.lastInsertRowid) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de l’ajout de la tâche.' };
    }
  });

  ipcMain.handle('tasks:update', async (_, id: number, data) => {
    try {
      db.prepare(
        `UPDATE task_assignments SET
           agent_id = ?,
           titre = ?,
           sujet = ?,
           personne_cible = ?,
           reference_dossier = ?,
           wilaya = ?,
           priorite = ?,
           date_courrier = ?,
           date_distribution = ?,
           date_debut = ?,
           date_finale = ?,
           etat_courrier = ?,
           note = ?,
           note_finale = ?,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        data?.agent_id ? Number(data.agent_id) : null,
        (data?.titre || '').trim(),
        (data?.sujet || '').trim(),
        (data?.personne_cible || '').trim(),
        (data?.reference_dossier || '').trim(),
        (data?.wilaya || '').trim(),
        (data?.priorite || '').trim(),
        (data?.date_courrier || '').trim(),
        (data?.date_distribution || '').trim(),
        (data?.date_debut || '').trim(),
        (data?.date_finale || '').trim(),
        (data?.etat_courrier || '').trim(),
        (data?.note || '').trim(),
        (data?.note_finale || '').trim(),
        id
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la modification de la tâche.' };
    }
  });

  ipcMain.handle('tasks:delete', async (_, id: number) => {
    try {
      db.prepare('DELETE FROM task_assignments WHERE id = ?').run(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la suppression de la tâche.' };
    }
  });

  // -------------------------------------------------------------
  // 3. Files & Document Preview Handlers (PDF / DOCX / Excel)
  // -------------------------------------------------------------
  ipcMain.handle('files:pickDocument', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Sélectionner un document (PDF, Word DOCX, Excel)',
      properties: ['openFile'],
      filters: [
        {
          name: 'Documents (PDF, Word, Excel)',
          extensions: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv']
        },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const chosenPath = result.filePaths[0];
    return {
      canceled: false,
      name: path.basename(chosenPath),
      sourcePath: chosenPath
    };
  });

  ipcMain.handle('files:getEmployeePreview', async (_, employeeId: number) => {
    try {
      const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId) as any;
      if (!emp || !emp.file_path || !fs.existsSync(emp.file_path)) {
        return { success: true, kind: 'empty' };
      }

      const ext = path.extname(emp.file_name || emp.file_path).toLowerCase();
      const buffer = fs.readFileSync(emp.file_path);

      if (ext === '.pdf') {
        return {
          success: true,
          kind: 'pdf',
          fileName: emp.file_name,
          filePath: emp.file_path,
          base64: buffer.toString('base64')
        };
      }

      if (ext === '.docx') {
        const result = await mammoth.convertToHtml({ buffer });
        return {
          success: true,
          kind: 'docx',
          fileName: emp.file_name,
          filePath: emp.file_path,
          html: result.value || '<p><em>Document vide</em></p>'
        };
      }

      if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheets = workbook.SheetNames.slice(0, 8).map((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, {
            header: 1,
            defval: ''
          });
          const trimmedRows = rawRows.slice(0, 200).map((row) =>
            (Array.isArray(row) ? row : []).map((cell) => (cell !== null && cell !== undefined ? String(cell) : ''))
          );
          return {
            name: sheetName,
            rows: trimmedRows
          };
        });

        return {
          success: true,
          kind: 'excel',
          fileName: emp.file_name,
          filePath: emp.file_path,
          sheets
        };
      }

      return {
        success: true,
        kind: 'unsupported',
        fileName: emp.file_name,
        filePath: emp.file_path
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Impossible de prévisualiser ce fichier.'
      };
    }
  });

  ipcMain.handle('files:openEmployeeExternal', async (_, employeeId: number) => {
    try {
      const emp = db.prepare('SELECT file_path FROM employees WHERE id = ?').get(employeeId) as any;
      if (!emp?.file_path || !fs.existsSync(emp.file_path)) {
        return { success: false, error: 'Fichier introuvable sur le disque.' };
      }
      await shell.openPath(emp.file_path);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Impossible d’ouvrir le fichier.' };
    }
  });

  // -------------------------------------------------------------
  // 4. Export Handlers
  // -------------------------------------------------------------
  ipcMain.handle('export:employeesPdf', async (_, employees, filterSummary) => {
    return exportEmployeesPdf(employees, filterSummary);
  });

  ipcMain.handle('export:employeesCsv', async (_, employees) => {
    return exportEmployeesCsv(employees);
  });

  ipcMain.handle('export:employeeTasksPdf', async (_, employee, tasks) => {
    return exportEmployeeTasksPdf(employee, tasks);
  });

  ipcMain.handle('export:employeeTasksCsv', async (_, employee, tasks) => {
    return exportEmployeeTasksCsv(employee, tasks);
  });

  ipcMain.handle('app:openExternal', async (_, url: string) => {
    shell.openExternal(url);
  });
}

if (app) {
  app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();

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
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
