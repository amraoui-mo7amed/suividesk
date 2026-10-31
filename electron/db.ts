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

function seedInitialData(db: Database.Database) {
  const empCount = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
  if (empCount.count > 0) {
    return; // Already seeded
  }

  // 1. Seed Employees
  const insertEmp = db.prepare(`
    INSERT INTO employees (matricule, nom, prenom, email, telephone, service, poste, max_capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const employees = [
    ['MAT-10492', 'Benali', 'Karim', 'k.benali@cnas.dz', '0550 12 34 56', 'Recouvrement', 'Inspecteur Principal du Recouvrement', 10],
    ['MAT-08241', 'Mansouri', 'Leila', 'l.mansouri@cnas.dz', '0555 78 90 12', 'Contrôle Médical', 'Médecin Conseil Référent', 8],
    ['MAT-12903', 'Haddad', 'Yacine', 'y.haddad@cnas.dz', '0661 45 67 89', 'Prestations', 'Gestionnaire Prestations en Espèces', 12],
    ['MAT-07314', 'Boukhalfa', 'Amel', 'a.boukhalfa@cnas.dz', '0770 23 45 67', 'Contentieux', 'Juriste Chargée des Affaires Judiciaires', 8],
    ['MAT-15022', 'Zerrouki', 'Sofiane', 's.zerrouki@cnas.dz', '0560 99 88 77', 'Informatique', 'Ingénieur Système & Réseau CHIFA', 10],
    ['MAT-09118', 'Chabane', 'Nadia', 'n.chabane@cnas.dz', '0663 11 22 33', 'Ressources Humaines', 'Responsable Formation & GPEC', 6],
    ['MAT-11405', 'Khelifi', 'Mustapha', 'm.khelifi@cnas.dz', '0552 44 55 66', 'Recouvrement', 'Agent de Contrôle & Apurement', 10],
    ['MAT-13872', 'Saidi', 'Meriem', 'm.saidi@cnas.dz', '0774 33 22 11', 'Prestations', 'Opératrice Carte CHIFA & Droits', 12],
  ];

  for (const emp of employees) {
    insertEmp.run(...emp);
  }

  // 2. Seed Task Templates (Catalogue)
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

  // No dummy tasks seeded: real operational database starts clean
}
