import path from 'path';
import fs from 'fs';
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
        const backupDir = path.join(userDataPath, 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
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
  // Check if employees table exists and whether it already uses the v2 workflow schema
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO employees_v2 (id, civilite, full_name, created_at)
      SELECT
        id,
        '',
        TRIM(COALESCE(prenom, '') || ' ' || COALESCE(nom, '')),
        COALESCE(created_at, CURRENT_TIMESTAMP)
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Unique constraint on non-empty full_name (case-insensitive) while keeping full_name optional
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_unique_fullname
    ON employees(LOWER(TRIM(full_name)))
    WHERE full_name IS NOT NULL AND TRIM(full_name) != '';
  `);

  // Check if task_assignments table exists and whether it already uses the v2 workflow schema
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO task_assignments_v2 (
        id, agent_id, titre, sujet, reference_dossier, priorite,
        date_debut, date_finale, etat_courrier, note, created_at, updated_at
      )
      SELECT
        id,
        agent_id,
        COALESCE(titre, ''),
        COALESCE(description, ''),
        COALESCE(reference_dossier, ''),
        COALESCE(priorite, ''),
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_agent ON task_assignments(agent_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_etat ON task_assignments(etat_courrier);
  `);
}
