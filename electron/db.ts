import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance;

  let dbPath: string;
  try {
    const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    dbPath = path.join(userDataPath, 'suividesk.sqlite');
  } catch {
    dbPath = path.join(process.cwd(), 'suividesk.sqlite');
  }

  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  initSchema(dbInstance);
  seedInitialData(dbInstance);

  return dbInstance;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricule TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT NOT NULL,
      telephone TEXT,
      service TEXT NOT NULL,
      poste TEXT NOT NULL,
      avatar TEXT,
      max_capacity INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      titre TEXT NOT NULL,
      description TEXT,
      service TEXT NOT NULL,
      priorite_defaut TEXT NOT NULL CHECK(priorite_defaut IN ('Basse', 'Moyenne', 'Haute', 'Urgente')),
      duree_estimee_jours INTEGER DEFAULT 3,
      instructions_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES task_templates(id) ON DELETE SET NULL,
      titre TEXT NOT NULL,
      description TEXT,
      service TEXT NOT NULL,
      priorite TEXT NOT NULL CHECK(priorite IN ('Basse', 'Moyenne', 'Haute', 'Urgente')),
      statut TEXT NOT NULL CHECK(statut IN ('En attente', 'En cours', 'Terminée', 'Bloquée')),
      agent_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date_debut TEXT NOT NULL,
      date_echeance TEXT NOT NULL,
      date_completion TEXT,
      reference_dossier TEXT,
      progression INTEGER DEFAULT 0,
      notes TEXT,
      motif_blocage TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_agent ON task_assignments(agent_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_statut ON task_assignments(statut);
    CREATE INDEX IF NOT EXISTS idx_tasks_date_echeance ON task_assignments(date_echeance);
    CREATE INDEX IF NOT EXISTS idx_tasks_service ON task_assignments(service);
  `);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(baseDate: Date, days: number): string {
  const d = new Date(baseDate.getTime());
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function seedInitialData(_db: Database.Database) {
  // Pure clean database schema without any dump or mock data
}
