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

  // 3. Seed Realistic Tasks with dynamic dates relative to today
  const today = new Date();

  const insertTask = db.prepare(`
    INSERT INTO task_assignments (
      template_id, titre, description, service, priorite, statut, agent_id,
      date_debut, date_echeance, date_completion, reference_dossier, progression, notes, motif_blocage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialTasks = [
    // 🟡 J-1 (Expire Demain)
    [
      1,
      'Mise en demeure trimestrielle SARL ATLAS LOGISTIQUE',
      'Non-versement des cotisations du 3ème trimestre. Notification urgente avant blocage bancaire.',
      'Recouvrement',
      'Urgente',
      'En cours',
      1, // Karim Benali
      addDays(today, -3),
      addDays(today, 1), // Demain J-1 !
      null,
      'BORD-2026-REC-089',
      80,
      'Rapprochement bancaire préliminaire effectué. En attente de signature du chef de centre.',
      null
    ],
    // 🟡 J-2 (Expire dans 2 jours)
    [
      3,
      'Validation protocole ALD - Assuré Zerrouki M.',
      'Protocole thérapeutique d’oncologie pour prise en charge intégrale à 100%.',
      'Contrôle Médical',
      'Haute',
      'En cours',
      2, // Leila Mansouri
      addDays(today, -2),
      addDays(today, 2), // Dans 2 jours J-2 !
      null,
      'ACC-MED-9910',
      60,
      'Pièces oncologiques conformes. Validation finale du collège médical requise.',
      null
    ],
    // 🟡 J-3 (Expire dans 3 jours)
    [
      5,
      'Liquidation congés maternité dossier Mme Rahmani',
      'Dossier complet avec reprise imminente. Calcul des indemnités journalières.',
      'Prestations',
      'Haute',
      'En cours',
      3, // Yacine Haddad
      addDays(today, -4),
      addDays(today, 3), // Dans 3 jours J-3 !
      null,
      'DOS-PREST-8842',
      45,
      'Attestation employeur vérifiée. Clôture prévue après calcul du décompte.',
      null
    ],
    // 🟡 J-0 (Expire AUJOURD\'HUI)
    [
      8,
      'Audit haute disponibilité passerelle VPN CHIFA',
      'Maintenance critique du VPN interconnexion officines pharmaceutiques de la wilaya.',
      'Informatique',
      'Urgente',
      'En cours',
      5, // Sofiane Zerrouki
      addDays(today, -1),
      addDays(today, 0), // Aujourd'hui !
      null,
      'TICK-INF-5021',
      70,
      'Tests de bascule en redondance validés sur le serveur miroir.',
      null
    ],
    // 🔴 En retard (-2 jours)
    [
      4,
      'Contre-visite médicale suite arrêt prolongé M. Belkacem',
      'Absence injustifiée à la première convocation médicale du 25 courant.',
      'Contrôle Médical',
      'Haute',
      'En attente',
      2, // Leila Mansouri
      addDays(today, -8),
      addDays(today, -2), // Dépassé de 2 jours !
      null,
      'DOS-MED-7712',
      20,
      'Relance par huissier de justice envisagée si pas de présentation.',
      null
    ],
    // 🔴 En retard (-4 jours)
    [
      7,
      'Recours contentieux Société Nationale TRAVAUX-SUD',
      'Assignation en paiement devant le Tribunal de Première Instance - Chambre Sociale.',
      'Contentieux',
      'Urgente',
      'En attente',
      4, // Amel Boukhalfa
      addDays(today, -10),
      addDays(today, -4), // Dépassé de 4 jours !
      null,
      'CONT-2026-042',
      30,
      'Dossier de plaidoirie à compléter avec l’état des pénalités de retard certifié.',
      null
    ],
    // 🔵 Dans les temps (+5 jours)
    [
      2,
      'Contrôle d’assiette sur place - Groupe Agroalimentaire MITIDJA',
      'Vérification de conformité des primes et indemnités non cotisables déclarées.',
      'Recouvrement',
      'Moyenne',
      'En cours',
      7, // Mustapha Khelifi
      addDays(today, -2),
      addDays(today, 5),
      null,
      'AUD-2026-REC-115',
      35,
      'Rendez-vous fixé avec le Directeur Financier pour le contrôle des livres comptables.',
      null
    ],
    // 🔵 Dans les temps (+8 jours)
    [
      6,
      'Délivrance de 150 Cartes CHIFA biométriques nouvelle génération',
      'Encodage et distribution aux nouveaux assurés du secteur de l’Éducation.',
      'Prestations',
      'Moyenne',
      'En attente',
      8, // Meriem Saidi
      addDays(today, 0),
      addDays(today, 8),
      null,
      'LOT-CHIFA-992',
      10,
      'Puces vierges réceptionnées du centre national de personnalisation.',
      null
    ],
    // 🔵 Dans les temps (+12 jours)
    [
      9,
      'Préparation plan de formation interne législation 2026',
      'Recensement des besoins de formation des agents de guichet et contrôle.',
      'Ressources Humaines',
      'Basse',
      'En cours',
      6, // Nadia Chabane
      addDays(today, -1),
      addDays(today, 12),
      null,
      'RH-FORM-2026-01',
      50,
      'Questionnaire d’évaluation des compétences diffusé dans toutes les agences.',
      null
    ],
    // ⛔ Bloquée
    [
      1,
      'Recouvrement créances contentieuses EURL BÂTIMENT PRO',
      'Procédure de saisie conservatoire sur comptes bancaires de l’employeur.',
      'Recouvrement',
      'Haute',
      'Bloquée',
      1, // Karim Benali
      addDays(today, -7),
      addDays(today, 4),
      null,
      'BORD-2026-REC-012',
      40,
      'En attente de la mainlevée ou notification d’ouverture de redressement judiciaire.',
      'Procédure judiciaire pendante : opposition formée par la banque dépositaire.'
    ],
    // 🟢 Terminée
    [
      8,
      'Migration base de données assurés vers cluster haute disponibilité',
      'Opération d’optimisation des index et purge des tables d’historisation.',
      'Informatique',
      'Haute',
      'Terminée',
      5, // Sofiane Zerrouki
      addDays(today, -12),
      addDays(today, -2),
      addDays(today, -1),
      'MIG-INF-2026-04',
      100,
      'Migration réussie sans interruption de service pour les guichets.',
      null
    ],
    // 🟢 Terminée
    [
      5,
      'Liquidation indemnités accident du travail M. Tahri',
      'Paiement direct des frais chirurgicaux et consolidation de la rente IPP.',
      'Prestations',
      'Urgente',
      'Terminée',
      3, // Yacine Haddad
      addDays(today, -15),
      addDays(today, -3),
      addDays(today, -2),
      'AT-MP-2026-551',
      100,
      'Arrêté d’imputabilité notifié et premier virement émis avec succès.',
      null
    ]
  ];

  for (const t of initialTasks) {
    insertTask.run(...t);
  }
}
