const path = require('path');
const fs = require('fs');

// Determine database path
const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
const dbDir = path.join(appData, 'suividesk');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'suividesk.sqlite');
const taskFilesDir = path.join(dbDir, 'task_files');
if (!fs.existsSync(taskFilesDir)) {
  fs.mkdirSync(taskFilesDir, { recursive: true });
}

console.log('Seeding database at:', dbPath);
console.log('Task files directory at:', taskFilesDir);

// Open database
let DatabaseSync;
try {
  const sqlite = require('node:sqlite');
  DatabaseSync = sqlite.DatabaseSync;
} catch {
  const BetterSqlite3 = require('better-sqlite3');
  DatabaseSync = BetterSqlite3;
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

// Ensure tables exist
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

  CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_unique_fullname
  ON employees(LOWER(TRIM(full_name)))
  WHERE full_name IS NOT NULL AND TRIM(full_name) != '';

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

  CREATE INDEX IF NOT EXISTS idx_tasks_agent ON task_assignments(agent_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_etat ON task_assignments(etat_courrier);

  CREATE TABLE IF NOT EXISTS task_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES task_assignments(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_task_docs_task ON task_documents(task_id);
`);

// Sample Employees
const sampleEmployees = [
  { civilite: 'Monsieur', full_name: 'Benali Mohamed' },
  { civilite: 'Madame', full_name: 'Khelifi Amina' },
  { civilite: 'Monsieur', full_name: 'Mansouri Karim' },
  { civilite: 'Madame', full_name: 'Saidi Fatima' },
  { civilite: 'Monsieur', full_name: 'Benaissa Youcef' }
];

const empStmt = db.prepare(`
  INSERT INTO employees (civilite, full_name)
  VALUES (?, ?)
`);

const insertedEmployees = [];
for (const emp of sampleEmployees) {
  // Check if exists
  const existing = db.prepare('SELECT id, civilite, full_name FROM employees WHERE LOWER(TRIM(full_name)) = LOWER(?)').get(emp.full_name);
  if (existing) {
    insertedEmployees.push(existing);
  } else {
    const res = empStmt.run(emp.civilite, emp.full_name);
    insertedEmployees.push({
      id: Number(res.lastInsertRowid),
      civilite: emp.civilite,
      full_name: emp.full_name
    });
  }
}

console.log(`Employees ready: ${insertedEmployees.length}`);

// Sample Tasks Data
const sampleTasks = [
  // Emp 1: Benali Mohamed
  {
    empIndex: 0,
    titre: 'Traitement réclamation indemnité journalière',
    sujet: 'Recours suite à suspension des indemnités maladie',
    personne_cible: 'M. Belkacem Rachid',
    reference_dossier: 'CNAS/2026/REC-8841',
    wilaya: '16 - Alger',
    priorite: 'Urgente',
    date_courrier: '2026-10-20',
    date_distribution: '2026-10-22',
    date_debut: '2026-10-23',
    date_finale: '2026-10-28',
    etat_courrier: 'traite',
    note: 'Dossier médical complet reçu de l’agence d’El Harrach.',
    note_finale: 'Recours validé et indemnité débloquée avec rappel.',
    created_at: '2026-10-23 09:15:00',
    files: [
      { name: 'Rapport_Medical_CNAS.pdf', type: 'pdf', content: '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF' },
      { name: 'Recap_Paiements.csv', type: 'excel', content: 'Mois,Montant,Statut\nAoût 2026,35000 DZD,Payé\nSeptembre 2026,35000 DZD,Validé\n' }
    ]
  },
  {
    empIndex: 0,
    titre: 'Contrôle affiliation employeur',
    sujet: 'Vérification déclaration DAS 2025 entreprise SARL BATI-PRO',
    personne_cible: 'Directeur Général SARL BATI-PRO',
    reference_dossier: 'CNAS/2026/DAS-1049',
    wilaya: '16 - Alger',
    priorite: 'Haute',
    date_courrier: '2026-11-01',
    date_distribution: '2026-11-02',
    date_debut: '2026-11-02',
    date_finale: '2026-11-07',
    etat_courrier: 'en_cours',
    note: 'Convocation envoyée pour vérification des fiches de paie.',
    note_finale: '',
    created_at: '2026-11-02 11:30:00',
    files: [
      { name: 'Bordereau_Cotisations.csv', type: 'excel', content: 'Matricule,Nom,Salaire,Cotisation\n10442,Bouchareb A.,68000,23460\n10443,Zouari T.,55000,18975\n' },
      { name: 'Attestation_Mise_A_Jour.png', type: 'image', isImage: true }
    ]
  },
  {
    empIndex: 0,
    titre: 'Renouvellement carte Chifa',
    sujet: 'Demande de duplicata suite à perte carte Chifa',
    personne_cible: 'Mme Djebbar Nadia',
    reference_dossier: 'CNAS/2026/CHIFA-4412',
    wilaya: '09 - Blida',
    priorite: 'Moyenne',
    date_courrier: '2026-11-03',
    date_distribution: '2026-11-03',
    date_debut: '2026-11-03',
    date_finale: '2026-11-10',
    etat_courrier: 'non_traite',
    note: 'Formulaire de déclaration de perte joint.',
    note_finale: '',
    created_at: '2026-11-03 14:20:00',
    files: [
      { name: 'Declaration_Perte_Chifa.pdf', type: 'pdf', content: '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF' }
    ]
  },

  // Emp 2: Khelifi Amina
  {
    empIndex: 1,
    titre: 'Validation prise en charge scanner et IRM',
    sujet: 'Demande d’entente préalable pour imagerie médicale spécialisée',
    personne_cible: 'Clinique Al-Azhar (Dr. Rahmouni)',
    reference_dossier: 'CNAS/2026/PRISE-9921',
    wilaya: '31 - Oran',
    priorite: 'Urgente',
    date_courrier: '2026-10-29',
    date_distribution: '2026-10-30',
    date_debut: '2026-10-30',
    date_finale: '2026-11-01',
    etat_courrier: 'traite',
    note: 'Avis favorable du médecin conseil.',
    note_finale: 'Prise en charge à 100% accordée et faxée à la clinique.',
    created_at: '2026-10-30 08:45:00',
    files: [
      { name: 'Accord_Medecin_Conseil.pdf', type: 'pdf', content: '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF' },
      { name: 'Prescription_IRM.png', type: 'image', isImage: true }
    ]
  },
  {
    empIndex: 1,
    titre: 'Mise à jour taux incapacité IPP',
    sujet: 'Réévaluation rente accident de travail',
    personne_cible: 'M. Cherif Mouloud',
    reference_dossier: 'CNAS/2026/ATMP-3310',
    wilaya: '31 - Oran',
    priorite: 'Moyenne',
    date_courrier: '2026-11-02',
    date_distribution: '2026-11-02',
    date_debut: '2026-11-02',
    date_finale: '2026-11-15',
    etat_courrier: 'en_cours',
    note: 'En attente du rapport d’expertise médicale de consolidation.',
    note_finale: '',
    created_at: '2026-11-02 16:10:00',
    files: [
      { name: 'Bareme_Incapacite.csv', type: 'excel', content: 'Critere,Taux_Initial,Taux_Propose\nSéquelle fonctionnelle,15%,20%\n' }
    ]
  },

  // Emp 3: Mansouri Karim
  {
    empIndex: 2,
    titre: 'Contentieux recouvrement cotisations',
    sujet: 'Mise en demeure avant poursuites judiciaires',
    personne_cible: 'EURL AGRO-SUD',
    reference_dossier: 'CNAS/2026/CONT-5519',
    wilaya: '25 - Constantine',
    priorite: 'Haute',
    date_courrier: '2026-10-15',
    date_distribution: '2026-10-18',
    date_debut: '2026-10-19',
    date_finale: '2026-11-02',
    etat_courrier: 'traite',
    note: 'Échéancier de paiement négocié en 6 mensualités.',
    note_finale: 'Premier versement de 450 000 DZD encaissé avec succès.',
    created_at: '2026-10-19 10:00:00',
    files: [
      { name: 'Protocole_Accord_Echeancier.pdf', type: 'pdf', content: '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF' },
      { name: 'Tableau_Amortissement_Dette.csv', type: 'excel', content: 'Echeance,Date,Montant,Statut\n1,01/11/2026,450000,Payé\n2,01/12/2026,450000,En attente\n3,01/01/2027,450000,En attente\n' }
    ]
  },

  // Emp 4: Saidi Fatima
  {
    empIndex: 3,
    titre: 'Dossier ALD - Affection Longue Durée',
    sujet: 'Prise en charge à 100% protocole diabète et hypertension',
    personne_cible: 'Mme Belarbi Kheira',
    reference_dossier: 'CNAS/2026/ALD-7742',
    wilaya: '15 - Tizi Ouzou',
    priorite: 'Moyenne',
    date_courrier: '2026-11-01',
    date_distribution: '2026-11-02',
    date_debut: '2026-11-02',
    date_finale: '2026-11-06',
    etat_courrier: 'en_cours',
    note: 'Attestation de médecin traitant vérifiée.',
    note_finale: '',
    created_at: '2026-11-02 13:45:00',
    files: [
      { name: 'Protocole_ALD_Diabete.pdf', type: 'pdf', content: '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF' }
    ]
  },

  // Emp 5: Benaissa Youcef
  {
    empIndex: 4,
    titre: 'Transfert dossier retraité CNR',
    sujet: 'Coordination droits retraite et maintien couverture assurance maladie',
    personne_cible: 'Agence CNR Constantine',
    reference_dossier: 'CNAS/2026/CNR-1109',
    wilaya: '25 - Constantine',
    priorite: 'Basse',
    date_courrier: '2026-11-03',
    date_distribution: '2026-11-03',
    date_debut: '2026-11-03',
    date_finale: '2026-11-20',
    etat_courrier: 'non_traite',
    note: 'Dossier reçu du guichet unique CNR.',
    note_finale: '',
    created_at: '2026-11-03 15:00:00',
    files: [
      { name: 'Formulaire_Coordination_CNR.pdf', type: 'pdf', content: '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF' }
    ]
  }
];

// Helper to generate a dummy 1x1 transparent/colored PNG
const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const taskStmt = db.prepare(`
  INSERT INTO task_assignments (
    agent_id, titre, sujet, personne_cible, reference_dossier, wilaya, priorite,
    date_courrier, date_distribution, date_debut, date_finale, etat_courrier, note, note_finale, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const docStmt = db.prepare(`
  INSERT INTO task_documents (task_id, file_name, file_path, file_type, file_size, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

let tasksCount = 0;
let docsCount = 0;

for (const t of sampleTasks) {
  const emp = insertedEmployees[t.empIndex];
  if (!emp) continue;

  // Check if task with same reference already exists
  const existing = db.prepare('SELECT id FROM task_assignments WHERE reference_dossier = ?').get(t.reference_dossier);
  let taskId;
  if (existing) {
    taskId = existing.id;
  } else {
    const res = taskStmt.run(
      emp.id,
      t.titre,
      t.sujet,
      t.personne_cible,
      t.reference_dossier,
      t.wilaya,
      t.priorite,
      t.date_courrier,
      t.date_distribution,
      t.date_debut,
      t.date_finale,
      t.etat_courrier,
      t.note,
      t.note_finale,
      t.created_at,
      t.created_at
    );
    taskId = Number(res.lastInsertRowid);
    tasksCount++;
  }

  // Add files
  if (t.files && t.files.length > 0) {
    for (const f of t.files) {
      const existingDoc = db.prepare('SELECT id FROM task_documents WHERE task_id = ? AND file_name = ?').get(taskId, f.name);
      if (!existingDoc) {
        const storedName = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${f.name}`;
        const filePath = path.join(taskFilesDir, storedName);

        if (f.isImage) {
          fs.writeFileSync(filePath, Buffer.from(samplePngBase64, 'base64'));
        } else {
          fs.writeFileSync(filePath, f.content || 'Sample content');
        }

        const size = fs.statSync(filePath).size;
        docStmt.run(taskId, f.name, filePath, f.type, size, t.created_at);
        docsCount++;
      }
    }
  }
}

console.log(`Seeding complete: ${tasksCount} new tasks, ${docsCount} new documents.`);
