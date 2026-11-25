import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';
import { app } from 'electron';

export interface DbStatement {
  all: (...params: any[]) => any[];
  get: (...params: any[]) => any;
  run: (...params: any[]) => { lastInsertRowid: number | bigint; changes: number | bigint };
}

export interface DbInstance {
  exec: (sql: string) => void;
  prepare: (sql: string) => DbStatement;
}

let dbInstance: DbInstance | null = null;

function openSqliteDatabase(dbPath: string): DbInstance {
  try {
    // Try better-sqlite3 first if native binary is available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BetterSqlite3 = require('better-sqlite3');
    const db = new BetterSqlite3(dbPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    return db;
  } catch (err) {
    // Fallback to Node/Electron built-in node:sqlite DatabaseSync
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    return db;
  }
}

export function getUserFilesDirectory(): string {
  const basePath = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
  const filesDir = path.join(basePath, 'employee_files');
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
  }
  return filesDir;
}

export function getTaskFilesDirectory(): string {
  const basePath = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
  const filesDir = path.join(basePath, 'task_files');
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
  }
  return filesDir;
}

export function getBackupsDirectory(): string {
  const basePath = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
  const backupDir = path.join(basePath, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

export function getDatabasePath(): string {
  try {
    const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
    return path.join(userDataPath, 'suividesk.sqlite');
  } catch {
    return path.join(process.cwd(), 'suividesk.sqlite');
  }
}

export function getDatabase(): DbInstance {
  if (dbInstance) return dbInstance;

  let dbPath: string;
  try {
    const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    dbPath = path.join(userDataPath, 'suividesk.sqlite');
    
    // Auto-backup database on launch before any migration
    if (fs.existsSync(dbPath)) {
      try {
        const backupDir = getBackupsDirectory();
        const backupFile = path.join(backupDir, `suividesk_backup_launch.sqlite`);
        fs.copyFileSync(dbPath, backupFile);
      } catch (backupErr) {
        console.warn('Backup warning:', backupErr);
      }
    }
  } catch {
    dbPath = path.join(process.cwd(), 'suividesk.sqlite');
  }

  dbInstance = openSqliteDatabase(dbPath);
  initAndMigrateSchema(dbInstance);

  return dbInstance;
}

function initAndMigrateSchema(db: DbInstance) {
  // 1. App Security Table (Password Lock & App Settings)
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_security (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 2. Check if employees table exists and whether it already uses the v2 workflow schema
  const empCols = db.prepare("PRAGMA table_info('employees')").all() as Array<{ name: string }>;

  if (empCols.length > 0 && !empCols.some((c) => c.name === 'full_name')) {
    // Migrate legacy v1 employees table to v2 optional workflow schema
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        civilite TEXT DEFAULT '',
        full_name TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        file_path TEXT DEFAULT '',
        file_type TEXT DEFAULT '',
        sync_uuid TEXT DEFAULT '',
        is_deleted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO employees_v2 (id, civilite, full_name, created_at, updated_at)
      SELECT
        id,
        '',
        TRIM(COALESCE(prenom, '') || ' ' || COALESCE(nom, '')),
        COALESCE(created_at, CURRENT_TIMESTAMP),
        CURRENT_TIMESTAMP
      FROM employees;

      DROP TABLE employees;
      ALTER TABLE employees_v2 RENAME TO employees;
    `);
    db.exec('PRAGMA foreign_keys = ON;');
  } else if (empCols.length === 0) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        civilite TEXT DEFAULT '',
        full_name TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        file_path TEXT DEFAULT '',
        file_type TEXT DEFAULT '',
        sync_uuid TEXT DEFAULT '',
        is_deleted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
    // Non-destructive additions for v1.0-v1.4 databases
    if (!empCols.some((c) => c.name === 'sync_uuid')) {
      db.exec("ALTER TABLE employees ADD COLUMN sync_uuid TEXT DEFAULT '';");
    }
    if (!empCols.some((c) => c.name === 'is_deleted')) {
      db.exec('ALTER TABLE employees ADD COLUMN is_deleted INTEGER DEFAULT 0;');
    }
    if (!empCols.some((c) => c.name === 'updated_at')) {
      db.exec('ALTER TABLE employees ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;');
    }
  }

  // Unique constraint on non-empty full_name (case-insensitive) while keeping full_name optional
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_unique_fullname
    ON employees(LOWER(TRIM(full_name)))
    WHERE full_name IS NOT NULL AND TRIM(full_name) != '';
  `);

  // 3. Check if task_assignments table exists and whether it already uses the v2 workflow schema
  const taskCols = db.prepare("PRAGMA table_info('task_assignments')").all() as Array<{ name: string }>;

  if (taskCols.length > 0 && !taskCols.some((c) => c.name === 'etat_courrier')) {
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_assignments_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        titre TEXT DEFAULT '',
        sujet TEXT DEFAULT '',
        personne_cible TEXT DEFAULT '',
        reference_dossier TEXT DEFAULT '',
        wilaya TEXT DEFAULT '',
        priorite TEXT DEFAULT '',
        date_courrier TEXT DEFAULT '',
        date_distribution TEXT DEFAULT '',
        date_debut TEXT DEFAULT '',
        date_finale TEXT DEFAULT '',
        etat_courrier TEXT DEFAULT '',
        note TEXT DEFAULT '',
        note_finale TEXT DEFAULT '',
        sync_uuid TEXT DEFAULT '',
        is_deleted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO task_assignments_v2 (
        id, agent_id, titre, sujet, personne_cible, reference_dossier, wilaya,
        priorite, date_courrier, date_distribution, date_debut, date_finale,
        etat_courrier, note, created_at, updated_at
      )
      SELECT
        id,
        agent_id,
        COALESCE(titre, ''),
        COALESCE(description, ''),
        '',
        '',
        '',
        CASE
          WHEN priorite = 'Faible' THEN 'Basse'
          WHEN priorite = 'Moyenne' THEN 'Moyenne'
          WHEN priorite = 'Haute' THEN 'Haute'
          WHEN priorite = 'Urgente' THEN 'Urgente'
          ELSE ''
        END,
        '',
        '',
        COALESCE(date_debut, ''),
        COALESCE(date_echeance, ''),
        CASE
          WHEN statut = 'Terminée' THEN 'traite'
          WHEN statut = 'En cours' THEN 'en_cours'
          WHEN statut = 'En attente' OR statut = 'Bloquée' THEN 'non_traite'
          ELSE ''
        END,
        COALESCE(notes, ''),
        COALESCE(created_at, CURRENT_TIMESTAMP),
        COALESCE(updated_at, CURRENT_TIMESTAMP)
      FROM task_assignments;

      DROP TABLE task_assignments;
      ALTER TABLE task_assignments_v2 RENAME TO task_assignments;
    `);
    db.exec('PRAGMA foreign_keys = ON;');
  } else if (taskCols.length === 0) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        titre TEXT DEFAULT '',
        sujet TEXT DEFAULT '',
        personne_cible TEXT DEFAULT '',
        reference_dossier TEXT DEFAULT '',
        wilaya TEXT DEFAULT '',
        priorite TEXT DEFAULT '',
        date_courrier TEXT DEFAULT '',
        date_distribution TEXT DEFAULT '',
        date_debut TEXT DEFAULT '',
        date_finale TEXT DEFAULT '',
        etat_courrier TEXT DEFAULT '',
        note TEXT DEFAULT '',
        note_finale TEXT DEFAULT '',
        sync_uuid TEXT DEFAULT '',
        is_deleted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
    // Non-destructive additions for v1.0-v1.4 databases
    if (!taskCols.some((c) => c.name === 'sync_uuid')) {
      db.exec("ALTER TABLE task_assignments ADD COLUMN sync_uuid TEXT DEFAULT '';");
    }
    if (!taskCols.some((c) => c.name === 'is_deleted')) {
      db.exec('ALTER TABLE task_assignments ADD COLUMN is_deleted INTEGER DEFAULT 0;');
    }
    if (!taskCols.some((c) => c.name === 'updated_at')) {
      db.exec('ALTER TABLE task_assignments ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;');
    }
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_agent ON task_assignments(agent_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_etat ON task_assignments(etat_courrier);

    CREATE TABLE IF NOT EXISTS task_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES task_assignments(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      sync_uuid TEXT DEFAULT '',
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_task_docs_task ON task_documents(task_id);
  `);

  const docCols = db.prepare("PRAGMA table_info('task_documents')").all() as Array<{ name: string }>;
  if (!docCols.some((c) => c.name === 'sync_uuid')) {
    db.exec("ALTER TABLE task_documents ADD COLUMN sync_uuid TEXT DEFAULT '';");
  }
  if (!docCols.some((c) => c.name === 'is_deleted')) {
    db.exec('ALTER TABLE task_documents ADD COLUMN is_deleted INTEGER DEFAULT 0;');
  }

  // 4. Retroactive UUIDv4 Generation for All Existing Data
  try {
    const emptyEmps = db
      .prepare("SELECT id FROM employees WHERE sync_uuid IS NULL OR TRIM(sync_uuid) = ''")
      .all() as Array<{ id: number }>;
    for (const emp of emptyEmps) {
      db.prepare('UPDATE employees SET sync_uuid = ? WHERE id = ?').run(crypto.randomUUID(), emp.id);
    }

    const emptyTasks = db
      .prepare("SELECT id FROM task_assignments WHERE sync_uuid IS NULL OR TRIM(sync_uuid) = ''")
      .all() as Array<{ id: number }>;
    for (const task of emptyTasks) {
      db.prepare('UPDATE task_assignments SET sync_uuid = ? WHERE id = ?').run(crypto.randomUUID(), task.id);
    }

    const emptyDocs = db
      .prepare("SELECT id FROM task_documents WHERE sync_uuid IS NULL OR TRIM(sync_uuid) = ''")
      .all() as Array<{ id: number }>;
    for (const doc of emptyDocs) {
      db.prepare('UPDATE task_documents SET sync_uuid = ? WHERE id = ?').run(crypto.randomUUID(), doc.id);
    }
  } catch (err) {
    console.warn('Retroactive UUID assignment warning:', err);
  }

  // 5. Sync Conflict Audit Table & Paired Devices
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_uuid TEXT NOT NULL,
      remote_device TEXT DEFAULT '',
      original_data TEXT NOT NULL,
      incoming_data TEXT NOT NULL,
      resolution TEXT DEFAULT 'last_write_wins',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      device_name TEXT NOT NULL,
      ip_address TEXT DEFAULT '',
      last_synced_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// -------------------------------------------------------------
// Security & Password Helpers (PBKDF2 Salted Hashing)
// -------------------------------------------------------------

export function getSecuritySetting(key: string): string | null {
  const db = getDatabase();
  const row = db.prepare('SELECT value FROM app_security WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

export function setSecuritySetting(key: string, value: string): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO app_security (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

export function isPasswordSet(): boolean {
  const hash = getSecuritySetting('lock_password_hash');
  const enabled = getSecuritySetting('lock_enabled');
  return Boolean(hash && enabled !== 'false');
}

export function hashPassword(password: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string): boolean {
  const stored = getSecuritySetting('lock_password_hash');
  if (!stored) return true; // No password set
  const [salt, expectedHash] = stored.split(':');
  if (!salt || !expectedHash) return false;
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

export function setAppPassword(newPassword: string, currentPassword?: string): { success: boolean; error?: string } {
  if (isPasswordSet() && currentPassword !== undefined && currentPassword !== '') {
    if (!verifyPassword(currentPassword)) {
      return { success: false, error: 'Mot de passe actuel incorrect.' };
    }
  }
  const { salt, hash } = hashPassword(newPassword);
  setSecuritySetting('lock_password_hash', `${salt}:${hash}`);
  setSecuritySetting('lock_enabled', 'true');
  return { success: true };
}

export function disableAppPassword(currentPassword?: string): { success: boolean; error?: string } {
  if (isPasswordSet() && currentPassword !== undefined && currentPassword !== '') {
    if (!verifyPassword(currentPassword)) {
      return { success: false, error: 'Mot de passe actuel incorrect.' };
    }
  }
  setSecuritySetting('lock_enabled', 'false');
  return { success: true };
}

export function getAutoLockMinutes(): number {
  const val = getSecuritySetting('auto_lock_minutes');
  return val ? parseInt(val, 10) || 0 : 0;
}

export function setAutoLockMinutes(minutes: number): void {
  setSecuritySetting('auto_lock_minutes', String(minutes));
}

export function getOrCreateDeviceId(): string {
  let id = getSecuritySetting('device_id');
  if (!id) {
    id = crypto.randomUUID();
    setSecuritySetting('device_id', id);
  }
  return id;
}

export function getWorkstationName(): string {
  return os.hostname() || 'SuiviDesk-PC';
}

export function getSyncConflicts(): any[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM sync_conflicts ORDER BY id DESC LIMIT 100').all() as any[];
}

export function getKnownDevices(): any[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM sync_devices ORDER BY last_synced_at DESC').all() as any[];
}
