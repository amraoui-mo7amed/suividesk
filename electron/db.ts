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
  purgeDumpData(dbInstance);

  return dbInstance;
}

function purgeDumpData(db: Database.Database) {
  try {
    // Purge any legacy employees (collaborators feature removed)
    db.exec(`DELETE FROM employees;`);

    // Purge all legacy dump/sample tasks from previous demo seeds
    db.exec(`
      DELETE FROM task_assignments WHERE reference_dossier IN (
        'CONT-2026-042', 'AT-MP-2026-551', 'DOS-MED-7712', 'MIG-INF-2026-04',
        'TICK-INF-5021', 'BORD-2026-REC-089', 'ACC-MED-9910', 'DOS-PREST-8842',
        'BORD-2026-REC-012', 'RH-2026-TIT-03', 'REC-2026-CP-11', 'CHIFA-2026-REJ-88'
      );
    `);
  } catch (err) {
    console.error('Error in purgeDumpData:', err);
  }
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
      agent_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
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

function seedInitialData(db: Database.Database) {
  const tplCount = db.prepare('SELECT COUNT(*) as count FROM task_templates').get() as { count: number };
  if (tplCount.count === 0) {
    const insertTpl = db.prepare(`
      INSERT INTO task_templates (code, titre, description, service, priorite_defaut, duree_estimee_jours, instructions_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const templates = [
      [
        'TPL-REC-01',
        'Mise en demeure pour non-déclaration DAS',
        'Émission et notification des mises en demeure trimestrielles aux employeurs défaillants.',
        'Recouvrement',
        'Haute',
        5,
        'Vérifier l’historique des cotisations sur le portail télé-déclaration avant notification formelle par LRAR.'
      ],
      [
        'TPL-REC-02',
        'Contrôle sur pièces assiette de cotisation',
        'Audit comptable et vérification des bases déclarées par les entreprises cotisantes.',
        'Recouvrement',
        'Urgente',
        3,
        'Confronter la balance générale de paie aux bordereaux CNAS.'
      ],
      [
        'TPL-MED-01',
        'Instruction accord préalable ALD',
        'Examen du protocole thérapeutique pour affection de longue durée (100% CNAS).',
        'Contrôle Médical',
        'Urgente',
        2,
        'Contrôler le compte-rendu médical spécialisé et la conformité à la nomenclature nationale.'
      ],
      [
        'TPL-MED-02',
        'Convocation contre-visite arrêt de travail',
        'Contrôle médical de légitimité suite à un arrêt maladie excédant 15 jours consécutifs.',
        'Contrôle Médical',
        'Moyenne',
        4,
        'Émettre la convocation sous 48h et consigner les conclusions médicales dans le dossier.'
      ],
      [
        'TPL-PREST-01',
        'Liquidation indemnités journalières de maternité',
        'Vérification des conditions d’ouverture de droit et calcul du décompte des 14 semaines.',
        'Prestations',
        'Haute',
        3,
        'Attestation de salaire obligatoire signée par l’employeur et certificat d’accouchement.'
      ],
      [
        'TPL-PREST-02',
        'Renouvellement et réactivation Carte CHIFA',
        'Résolution des rejets de facturation officinale et mise à jour de la puce CHIFA.',
        'Prestations',
        'Moyenne',
        2,
        'Mettre à jour l’ouverture des droits de l’assuré et de ses ayants droit.'
      ],
      [
        'TPL-CONT-01',
        'Rédaction mémoire en défense Tribunal Administratif',
        'Préparation de la défense juridique de la caisse suite à un recours employeur.',
        'Contentieux',
        'Urgente',
        4,
        'Compiler les bordereaux de créances certifiés conformes et la jurisprudence applicable.'
      ],
      [
        'TPL-INFO-01',
        'Sauvegarde & maintenance serveur frontal CHIFA',
        'Audit de disponibilité et redémarrage programmé des serveurs d’authentification.',
        'Informatique',
        'Haute',
        1,
        'Procédure hors heures de pointe avec validation des backups locaux et distants.'
      ],
      [
        'TPL-RH-01',
        'Bilan annuel des congés et gestion des titularisations',
        'Vérification de l’ancienneté et préparation des commissions paritaires administratives.',
        'Ressources Humaines',
        'Basse',
        7,
        'Recueillir les avis hiérarchiques et préparer les états récapitulatifs.'
      ]
    ];

    for (const tpl of templates) {
      insertTpl.run(...tpl);
    }
  }
}
