import path from 'path';
import fs from 'fs';
import os from 'os';
import { app, BrowserWindow, dialog, shell } from 'electron';

function escapeHtml(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const clean = String(val).replace(/"/g, '""');
  return `"${clean}"`;
}

function formatDateFr(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return '—';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function formatEtatLabel(etat?: string): string {
  if (etat === 'traite') return 'Traité';
  if (etat === 'non_traite') return 'Non traité';
  if (etat === 'en_cours') return 'En cours de traitement';
  return 'Non spécifié';
}

function getCnasLogoBase64(): string | null {
  const candidates = [
    path.join(process.resourcesPath || '', 'assets/CNAS_logo.png'),
    path.join(__dirname, '../dist/CNAS_logo.png'),
    path.join(process.cwd(), 'public', 'CNAS_logo.png'),
    path.join(__dirname, '../public/CNAS_logo.png')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p).toString('base64');
      }
    } catch {
      // ignore
    }
  }
  return null;
}

async function renderHtmlToPdfFile(html: string, outputPath: string): Promise<void> {
  const printWin = new BrowserWindow({
    show: false,
    width: 1200,
    height: 850,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const tempHtmlPath = path.join(os.tmpdir(), `suividesk_print_${Date.now()}.html`);
  fs.writeFileSync(tempHtmlPath, html, 'utf-8');

  try {
    await printWin.loadFile(tempHtmlPath);
    const pdfBuffer = await printWin.webContents.printToPDF({
      landscape: true,
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
    });
    fs.writeFileSync(outputPath, pdfBuffer);
  } finally {
    try {
      printWin.destroy();
    } catch {}
    try {
      if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
    } catch {}
  }
}

export async function exportEmployeesPdf(
  employees: any[],
  filterSummary = 'Tous les employés'
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const defaultName = `CNAS_Employes_${new Date().toISOString().slice(0, 10)}.pdf`;
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Exporter la Liste des Employés CNAS (PDF)',
      defaultPath: path.join(app ? app.getPath('downloads') : os.homedir(), defaultName),
      filters: [{ name: 'Document PDF', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Export annulé' };
    }

    const logoB64 = getCnasLogoBase64();
    const nowStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const totalTasks = employees.reduce((acc, e) => acc + (e.tasks_count || 0), 0);
    const withFiles = employees.filter((e) => e.file_name && e.file_name.trim() !== '').length;

    const rowsHtml = employees
      .map(
        (emp, idx) => `
        <tr>
          <td style="text-align:center;font-weight:700;color:#64748b;">${idx + 1}</td>
          <td>${escapeHtml(emp.civilite || '—')}</td>
          <td style="font-weight:700;color:#004B87;">${escapeHtml(emp.full_name || `Employé #${emp.id}`)}</td>
          <td>${escapeHtml(emp.file_name || 'Aucun document')}</td>
          <td style="text-align:center;font-weight:700;">${emp.tasks_count || 0}</td>
          <td style="text-align:center;color:#059669;font-weight:700;">${emp.traite_count || 0}</td>
          <td style="text-align:center;color:#0068B5;font-weight:700;">${emp.en_cours_count || 0}</td>
          <td style="text-align:center;color:#dc2626;font-weight:700;">${emp.non_traite_count || 0}</td>
        </tr>
      `
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0068B5; padding-bottom: 12px; margin-bottom: 16px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand img { width: 58px; height: 58px; object-fit: contain; }
    .title { font-size: 18px; font-weight: 800; color: #004B87; margin: 0; text-transform: uppercase; }
    .subtitle { font-size: 11px; color: #475569; margin: 3px 0 0 0; }
    .meta { text-align: right; font-size: 10px; color: #64748b; }
    .kpis { display: flex; gap: 12px; margin-bottom: 16px; }
    .kpi { flex: 1; background: #f0f7ff; border: 1px solid #cce3f8; border-top: 3px solid #0068B5; border-radius: 8px; padding: 10px 14px; }
    .kpi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #004B87; }
    .kpi-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0068B5; color: #ffffff; font-size: 10px; text-transform: uppercase; padding: 8px 10px; text-align: left; border: 1px solid #005696; }
    td { padding: 7px 10px; border: 1px solid #dbe7f3; font-size: 10.5px; }
    tr:nth-child(even) { background: #f8fbff; }
    .footer { margin-top: 20px; text-align: right; font-size: 9.5px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      ${logoB64 ? `<img src="data:image/png;base64,${logoB64}" alt="CNAS" />` : ''}
      <div>
        <h1 class="title">Répertoire des Collaborateurs CNAS</h1>
        <p class="subtitle">Caisse Nationale des Assurances Sociales des Travailleurs Salariés • SuiviDesk</p>
      </div>
    </div>
    <div class="meta">
      <div><strong>Édité le :</strong> ${escapeHtml(nowStr)}</div>
      <div><strong>Filtre :</strong> ${escapeHtml(filterSummary)}</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-label">Total Collaborateurs</div>
      <div class="kpi-val">${employees.length}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Documents Joints</div>
      <div class="kpi-val">${withFiles}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Total Tâches Assignées</div>
      <div class="kpi-val">${totalTasks}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:5%;text-align:center;">#</th>
        <th style="width:12%;">Civilité</th>
        <th style="width:28%;">Nom Complet</th>
        <th style="width:23%;">Document Joint</th>
        <th style="width:8%;text-align:center;">Total</th>
        <th style="width:8%;text-align:center;">Traités</th>
        <th style="width:8%;text-align:center;">En Cours</th>
        <th style="width:8%;text-align:center;">Non Traités</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="8" style="text-align:center;padding:18px;color:#64748b;">Aucun employé à afficher</td></tr>'}
    </tbody>
  </table>

  <div class="footer">SuiviDesk CNAS • Document généré automatiquement</div>
</body>
</html>`;

    await renderHtmlToPdfFile(html, filePath);
    try {
      shell.openPath(filePath);
    } catch {}
    return { success: true, filePath };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la génération PDF' };
  }
}

export async function exportEmployeesCsv(
  employees: any[]
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const defaultName = `CNAS_Employes_${new Date().toISOString().slice(0, 10)}.csv`;
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Exporter la Liste des Employés en CSV',
      defaultPath: path.join(app ? app.getPath('downloads') : os.homedir(), defaultName),
      filters: [{ name: 'Fichier CSV (Excel)', extensions: ['csv'] }]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Export annulé' };
    }

    const bom = '\uFEFF';
    const headers = [
      'ID',
      'Civilité',
      'Nom Complet',
      'Fichier Joint',
      'Total Tâches',
      'Courriers Traités',
      'En Cours de Traitement',
      'Courriers Non Traités'
    ];

    const rows = employees.map((emp) =>
      [
        escapeCsv(emp.id),
        escapeCsv(emp.civilite || ''),
        escapeCsv(emp.full_name || ''),
        escapeCsv(emp.file_name || ''),
        escapeCsv(emp.tasks_count ?? 0),
        escapeCsv(emp.traite_count ?? 0),
        escapeCsv(emp.en_cours_count ?? 0),
        escapeCsv(emp.non_traite_count ?? 0)
      ].join(';')
    );

    fs.writeFileSync(filePath, bom + headers.join(';') + '\r\n' + rows.join('\r\n'), 'utf-8');
    try {
      shell.showItemInFolder(filePath);
    } catch {}
    return { success: true, filePath };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur export CSV' };
  }
}

export async function exportEmployeeTasksPdf(
  employee: any,
  tasks: any[]
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const safeName = (employee?.full_name || `Employe_${employee?.id || ''}`)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 35);
    const defaultName = `CNAS_Taches_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Exporter les Tâches du Collaborateur (PDF)',
      defaultPath: path.join(app ? app.getPath('downloads') : os.homedir(), defaultName),
      filters: [{ name: 'Document PDF', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Export annulé' };
    }

    const logoB64 = getCnasLogoBase64();
    const nowStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const empDisplay = [employee?.civilite, employee?.full_name || `Employé #${employee?.id}`]
      .filter(Boolean)
      .join(' ');

    const rowsHtml = tasks
      .map((t) => {
        const duree =
          t.duree_traitement_jours !== null && t.duree_traitement_jours !== undefined
            ? `${t.duree_traitement_jours} j`
            : '—';
        return `
        <tr>
          <td style="font-weight:700;color:#004B87;">${escapeHtml(t.titre || '—')}</td>
          <td>${escapeHtml(t.sujet || '—')}</td>
          <td>${escapeHtml(t.personne_cible || '—')}</td>
          <td>${escapeHtml(t.reference_dossier || '—')}</td>
          <td>${escapeHtml(t.wilaya || '—')}</td>
          <td>${escapeHtml(t.priorite || '—')}</td>
          <td>${escapeHtml(formatDateFr(t.date_courrier))}</td>
          <td>${escapeHtml(formatDateFr(t.date_distribution))}</td>
          <td>${escapeHtml(formatDateFr(t.date_debut))}</td>
          <td>${escapeHtml(formatDateFr(t.date_finale))}</td>
          <td style="text-align:center;font-weight:800;color:#0068B5;">${escapeHtml(duree)}</td>
          <td style="font-weight:700;">${escapeHtml(formatEtatLabel(t.etat_courrier))}</td>
          <td>${escapeHtml(t.note || '—')}</td>
          <td>${escapeHtml(t.note_finale || '—')}</td>
        </tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 9.5px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0068B5; padding-bottom: 10px; margin-bottom: 14px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand img { width: 52px; height: 52px; object-fit: contain; }
    .title { font-size: 16px; font-weight: 800; color: #004B87; margin: 0; text-transform: uppercase; }
    .subtitle { font-size: 11px; color: #0068B5; font-weight: 700; margin: 3px 0 0 0; }
    .meta { text-align: right; font-size: 9.5px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0068B5; color: #ffffff; font-size: 8.5px; text-transform: uppercase; padding: 6px 5px; text-align: left; border: 1px solid #005696; }
    td { padding: 5px; border: 1px solid #dbe7f3; font-size: 8.5px; vertical-align: top; }
    tr:nth-child(even) { background: #f8fbff; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      ${logoB64 ? `<img src="data:image/png;base64,${logoB64}" alt="CNAS" />` : ''}
      <div>
        <h1 class="title">État des Tâches & Courriers Assignés</h1>
        <p class="subtitle">Collaborateur : ${escapeHtml(empDisplay)} (${tasks.length} tâche(s))</p>
      </div>
    </div>
    <div class="meta">
      <div><strong>CNAS • SuiviDesk</strong></div>
      <div>Édité le ${escapeHtml(nowStr)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Nom Tâche</th>
        <th>Objet</th>
        <th>Destinataire</th>
        <th>Réf.</th>
        <th>Wilaya</th>
        <th>Priorité</th>
        <th>Dt. Courrier</th>
        <th>Dt. Distrib.</th>
        <th>Dt. Début</th>
        <th>Dt. Finale</th>
        <th>Durée</th>
        <th>État Courrier</th>
        <th>Note</th>
        <th>Note Finale</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="14" style="text-align:center;padding:16px;color:#64748b;">Aucune tâche assignée</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;

    await renderHtmlToPdfFile(html, filePath);
    try {
      shell.openPath(filePath);
    } catch {}
    return { success: true, filePath };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur export PDF' };
  }
}

export async function exportEmployeeTasksCsv(
  employee: any,
  tasks: any[]
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const safeName = (employee?.full_name || `Employe_${employee?.id || ''}`)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 35);
    const defaultName = `CNAS_Taches_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Exporter les Tâches du Collaborateur en CSV',
      defaultPath: path.join(app ? app.getPath('downloads') : os.homedir(), defaultName),
      filters: [{ name: 'Fichier CSV (Excel)', extensions: ['csv'] }]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Export annulé' };
    }

    const bom = '\uFEFF';
    const headers = [
      'Collaborateur',
      'Nom de la Tâche',
      'Objet de la Tâche',
      'Personne Concernée',
      'Référence',
      'Wilaya',
      'Priorité',
      'Date de Courrier',
      'Date de Distribution',
      'Date de Début',
      'Date Finale',
      'Durée de Traitement (Jours)',
      'État de Courrier',
      'La Note',
      'La Note Finale'
    ];

    const empDisplay = [employee?.civilite, employee?.full_name].filter(Boolean).join(' ');

    const rows = tasks.map((t) =>
      [
        escapeCsv(empDisplay),
        escapeCsv(t.titre || ''),
        escapeCsv(t.sujet || ''),
        escapeCsv(t.personne_cible || ''),
        escapeCsv(t.reference_dossier || ''),
        escapeCsv(t.wilaya || ''),
        escapeCsv(t.priorite || ''),
        escapeCsv(t.date_courrier || ''),
        escapeCsv(t.date_distribution || ''),
        escapeCsv(t.date_debut || ''),
        escapeCsv(t.date_finale || ''),
        escapeCsv(t.duree_traitement_jours !== null && t.duree_traitement_jours !== undefined ? t.duree_traitement_jours : ''),
        escapeCsv(formatEtatLabel(t.etat_courrier)),
        escapeCsv(t.note || ''),
        escapeCsv(t.note_finale || '')
      ].join(';')
    );

    fs.writeFileSync(filePath, bom + headers.join(';') + '\r\n' + rows.join('\r\n'), 'utf-8');
    try {
      shell.showItemInFolder(filePath);
    } catch {}
    return { success: true, filePath };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur export CSV' };
  }
}
