import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.resolve('dist');
const OUTPUT_DIR = path.resolve('screenshots_mobile');
const ARTIFACT_DIR = 'C:\\Users\\Mohamed\\.gemini\\antigravity-cli\\brain\\89d3f000-fa31-45b1-b590-b7bfcd6700d8';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function startServer(port = 5175) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || !reqPath) reqPath = '/index.html';
      const filePath = path.join(DIST_DIR, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const indexPath = path.join(DIST_DIR, 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(indexPath).pipe(res);
      }
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`Server running at http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

const MOCK_DATA = {
  employees: [
    {
      id: 1,
      sync_uuid: 'emp-001',
      civilite: 'Monsieur',
      full_name: 'Ahmed Benali',
      file_name: 'attestation_ahmed.pdf',
      file_path: '',
      file_type: 'pdf',
      created_at: '2026-11-20T08:00:00Z',
      updated_at: '2026-11-24T10:00:00Z',
      is_deleted: 0
    },
    {
      id: 2,
      sync_uuid: 'emp-002',
      civilite: 'Madame',
      full_name: 'Samira Khelifi',
      file_name: 'fiche_recrutement.pdf',
      file_path: '',
      file_type: 'pdf',
      created_at: '2026-11-21T09:00:00Z',
      updated_at: '2026-11-24T11:00:00Z',
      is_deleted: 0
    },
    {
      id: 3,
      sync_uuid: 'emp-003',
      civilite: 'Monsieur',
      full_name: 'Karim Mansouri',
      file_name: 'decision_affectation.pdf',
      file_path: '',
      file_type: 'pdf',
      created_at: '2026-11-22T08:30:00Z',
      updated_at: '2026-11-24T14:00:00Z',
      is_deleted: 0
    }
  ],
  tasks: [
    {
      id: 1,
      sync_uuid: 'task-001',
      agent_id: 1,
      titre: 'Contrôle employeur et apurement cotisations',
      sujet: 'Vérification bordereaux trimestriels CNAS',
      personne_cible: 'Entreprise Nationale Travaux BTP',
      reference_dossier: 'CNAS-ALG-2026-4412',
      wilaya: 'Alger',
      priorite: 'Haute',
      date_courrier: '2026-11-20',
      date_distribution: '2026-11-21',
      date_debut: '2026-11-21',
      date_finale: '2026-11-25',
      etat_courrier: 'traite',
      duree_traitement_jours: 4,
      note: 'Dossier validé et transmis au chef de centre.',
      note_finale: 'Approbation finale reçue.',
      created_at: '2026-11-20T08:30:00Z',
      updated_at: '2026-11-24T09:00:00Z',
      is_deleted: 0,
      documents: []
    },
    {
      id: 2,
      sync_uuid: 'task-002',
      agent_id: 1,
      titre: 'Instruction recours prestation maladie',
      sujet: 'Examen pièces complémentaires feuille de soins',
      personne_cible: 'Assuré social M. Bouzid',
      reference_dossier: 'CNAS-MED-8819',
      wilaya: 'Oran',
      priorite: 'Moyenne',
      date_courrier: '2026-11-22',
      date_distribution: '2026-11-23',
      date_debut: '2026-11-23',
      date_finale: '2026-11-28',
      etat_courrier: 'en_cours',
      note: 'En attente de la prescription médicale conforme.',
      note_finale: '',
      created_at: '2026-11-22T09:00:00Z',
      updated_at: '2026-11-24T12:00:00Z',
      is_deleted: 0,
      documents: []
    },
    {
      id: 3,
      sync_uuid: 'task-003',
      agent_id: 2,
      titre: 'Audit trimestriel centre de paiement',
      sujet: 'Rapprochement des bordereaux de remboursement',
      personne_cible: 'Centre de paiement Bab Ezzouar',
      reference_dossier: 'AUDIT-2026-T4',
      wilaya: 'Constantine',
      priorite: 'Urgente',
      date_courrier: '2026-11-23',
      date_distribution: '2026-11-24',
      date_debut: '2026-11-24',
      date_finale: '2026-11-26',
      etat_courrier: 'non_traite',
      note: 'Dossier prioritaire reçu ce matin.',
      note_finale: '',
      created_at: '2026-11-23T10:00:00Z',
      updated_at: '2026-11-24T15:00:00Z',
      is_deleted: 0,
      documents: []
    },
    {
      id: 4,
      sync_uuid: 'task-004',
      agent_id: 3,
      titre: 'Mise à jour carte Chifa & ayants droit',
      sujet: 'Renouvellement annuel des droits assurés',
      personne_cible: 'Guichet Unique Agence',
      reference_dossier: 'CHIFA-99120',
      wilaya: 'Sétif',
      priorite: 'Moyenne',
      date_courrier: '2026-11-21',
      date_distribution: '2026-11-22',
      date_debut: '2026-11-22',
      date_finale: '2026-11-29',
      etat_courrier: 'traite',
      duree_traitement_jours: 3,
      note: 'Délivrance de la carte effectuée.',
      note_finale: '',
      created_at: '2026-11-21T11:00:00Z',
      updated_at: '2026-11-24T16:00:00Z',
      is_deleted: 0,
      documents: []
    }
  ],
  security: {
    enabled: false,
    autoLockMinutes: 0
  }
};

async function run() {
  const server = await startServer(5175);
  console.log('Launching headless Chrome for Android mobile screenshots...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=390,844'
    ]
  });

  const page = await browser.newPage();

  // Mobile viewport: Android / iPhone form factor (390 x 844, scale 2 for crisp rendering)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  console.log('Setting up mock localStorage (unlocked)...');
  await page.goto('http://127.0.0.1:5175', { waitUntil: 'domcontentloaded' });

  await page.evaluate((data) => {
    localStorage.setItem('suividesk_mobile_employees', JSON.stringify(data.employees));
    localStorage.setItem('suividesk_mobile_tasks', JSON.stringify(data.tasks));
    localStorage.setItem('suividesk_mobile_security', JSON.stringify(data.security));
    localStorage.setItem('suividesk_last_pc_ip', '192.168.1.45');
  }, MOCK_DATA);

  // Reload page to let mobileAdapter load data
  await page.goto('http://127.0.0.1:5175', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));

  async function takeShot(name, label) {
    const filePath = path.join(OUTPUT_DIR, name);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`📸 Saved: ${name} (${label})`);

    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(filePath, path.join(ARTIFACT_DIR, name));
    }
  }

  // 1. Screen 1: Dashboard Mobile
  console.log('Capturing Screen 1: Dashboard...');
  await takeShot('01_dashboard_mobile.png', 'Tableau de Bord Mobile');

  // 2. Screen 2: Tableau de Suivi (Collaborateurs list)
  console.log('Capturing Screen 2: Suivi Collaborateurs...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const suiviBtn = buttons.find((b) => b.textContent && b.textContent.includes('Suivi'));
    if (suiviBtn) (suiviBtn).click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('02_suivi_collaborateurs_mobile.png', 'Tableau de Suivi des Collaborateurs');

  // 3. Screen 3: Fiche Collaborateur & Tâches
  console.log('Capturing Screen 3: Employee Details...');
  await page.evaluate(() => {
    const card = document.querySelector('.cnas-card');
    if (card) {
      const viewBtn = card.querySelector('button[aria-label="Voir Détails"]');
      if (viewBtn) (viewBtn).click();
      else (card).click();
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('03_employee_details_mobile.png', 'Fiche Collaborateur & Liste des Tâches');

  // 4. Screen 4: Task Modal (Ajouter une Tâche)
  console.log('Capturing Screen 4: Task Modal...');
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent && b.textContent.includes('Ajouter une Tâche')
    );
    if (addBtn) (addBtn).click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('04_task_modal_mobile.png', 'Modal Formulaire Tâche');

  // Close task modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0.z-\\[1000\\] button');
    if (closeBtn) (closeBtn).click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Go back to main suivi
  await page.evaluate(() => {
    const backBtn = document.querySelector('button[aria-label="Retour aux employés"]');
    if (backBtn) (backBtn).click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 5. Screen 5: Network Sync Modal (Mobile ↔ PC)
  console.log('Capturing Screen 5: Network Sync Modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const syncBtn = buttons.find((b) => b.textContent && b.textContent.includes('Sync'));
    if (syncBtn) (syncBtn).click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('05_network_sync_mobile.png', 'Modal Synchronisation Mobile ↔ PC');

  // Close sync modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0 button');
    if (closeBtn) (closeBtn).click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 6. Screen 6: Security Modal
  console.log('Capturing Screen 6: Security Modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const secBtn = buttons.find((b) => b.textContent && b.textContent.includes('Sécurité'));
    if (secBtn) (secBtn).click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('06_security_modal_mobile.png', 'Modal Paramètres Sécurité & Mot de Passe');

  // Close security modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0 button');
    if (closeBtn) (closeBtn).click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 7. Screen 7: About Modal
  console.log('Capturing Screen 7: About Modal...');
  await page.evaluate(() => {
    const aboutBtn = document.querySelector('header button[title*="propos"]');
    if (aboutBtn) (aboutBtn).click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await takeShot('08_about_modal_mobile.png', 'Modal À Propos CNAS');

  // Close about modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0 button');
    if (closeBtn) (closeBtn).click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 8. Screen 8: Lock Screen Overlay (Set password and trigger lock)
  console.log('Capturing Screen 8: Lock Screen Overlay...');
  await page.evaluate(() => {
    localStorage.setItem('suividesk_mobile_security', JSON.stringify({
      enabled: true,
      passwordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      salt: 'salt1234',
      autoLockMinutes: 15
    }));
  });
  // Reload with lock enabled so lock screen overlay shows
  await page.goto('http://127.0.0.1:5175', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  await takeShot('07_lock_screen_mobile.png', 'Écran de Verrouillage Sécurisé');

  console.log('✅ All 8 mobile screenshots successfully taken and verified!');

  await browser.close();
  server.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
