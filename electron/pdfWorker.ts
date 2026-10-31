import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { app, dialog, shell } from 'electron';

export interface GeneratePdfOptions {
  report_title: string;
  generation_date: string;
  generated_by: string;
  filter_summary: string;
  stats: {
    total: number;
    approaching: number;
    overdue: number;
    in_progress: number;
    completion_rate: number;
  };
  tasks: any[];
  targetPath?: string;
}

export async function generatePdfReport(options: GeneratePdfOptions): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const defaultName = `Rapport_CNAS_SuiviDesk_${new Date().toISOString().slice(0, 10)}.pdf`;
    let outputPath = options.targetPath;

    if (!outputPath) {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Enregistrer le Rapport Officiel CNAS (PDF)',
        defaultPath: path.join(app ? app.getPath('downloads') : os.homedir(), defaultName),
        filters: [{ name: 'Document PDF', extensions: ['pdf'] }]
      });

      if (canceled || !filePath) {
        return { success: false, error: 'Export annulé par l’utilisateur' };
      }
      outputPath = filePath;
    }

    // Write input JSON to temporary file
    const tempJsonPath = path.join(os.tmpdir(), `cnas_report_${Date.now()}.json`);
    fs.writeFileSync(tempJsonPath, JSON.stringify(options, null, 2), 'utf-8');

    // Locate python executable
    const appDir = app && app.isPackaged ? process.resourcesPath : process.cwd();
    const venvPythonMac = path.join(process.cwd(), '.venv', 'bin', 'python3');
    const venvPythonWin = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    
    let pythonBin = 'python3';
    if (fs.existsSync(venvPythonMac)) {
      pythonBin = venvPythonMac;
    } else if (fs.existsSync(venvPythonWin)) {
      pythonBin = venvPythonWin;
    }

    const scriptPath = path.join(process.cwd(), 'python', 'generate_report.py');

    return new Promise((resolve) => {
      const pyProcess = spawn(pythonBin, [scriptPath, tempJsonPath, outputPath!], {
        cwd: process.cwd()
      });

      let stdErr = '';
      let stdOut = '';

      pyProcess.stdout.on('data', (d) => {
        stdOut += d.toString();
      });

      pyProcess.stderr.on('data', (d) => {
        stdErr += d.toString();
      });

      pyProcess.on('close', (code) => {
        // Clean up temp file
        try {
          if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath);
        } catch {
          // Ignore temp cleanup error
        }

        if (code === 0) {
          // Open PDF or reveal it in finder
          try {
            shell.openPath(outputPath!);
          } catch (e) {
            console.error('Impossible d’ouvrir le fichier:', e);
          }
          resolve({ success: true, filePath: outputPath });
        } else {
          resolve({
            success: false,
            error: `Échec du worker WeasyPrint (Code ${code}): ${stdErr || stdOut}`
          });
        }
      });

      pyProcess.on('error', (err) => {
        try {
          if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath);
        } catch {}
        resolve({
          success: false,
          error: `Erreur d’exécution du processus Python: ${err.message}`
        });
      });
    });
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur inattendue' };
  }
}

export async function exportCsvReport(tasks: any[]): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const defaultName = `Export_CNAS_SuiviDesk_${new Date().toISOString().slice(0, 10)}.csv`;
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Exporter les Tâches CNAS en CSV (Format Excel)',
      defaultPath: path.join(app ? app.getPath('downloads') : os.homedir(), defaultName),
      filters: [{ name: 'Fichier CSV (Point-virgule)', extensions: ['csv'] }]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Export annulé par l’utilisateur' };
    }

    // CSV Header with BOM \uFEFF for Excel UTF-8 support and semicolon delimiter
    const bom = '\uFEFF';
    const headers = [
      'Référence Dossier',
      'Intitulé Tâche',
      'Pôle / Service',
      'Priorité',
      'Statut',
      'Avancement (%)',
      'Collaborateur Nom',
      'Collaborateur Prénom',
      'Matricule CNAS',
      'Date Début',
      'Date Échéance',
      'Alerte Échéance',
      'Notes & Observations',
      'Motif Blocage'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = tasks.map((t) => [
      escapeCsv(t.reference_dossier || ''),
      escapeCsv(t.titre || ''),
      escapeCsv(t.service || ''),
      escapeCsv(t.priorite || ''),
      escapeCsv(t.statut || ''),
      escapeCsv(t.progression ?? 0),
      escapeCsv(t.agent_nom || ''),
      escapeCsv(t.agent_prenom || ''),
      escapeCsv(t.agent_matricule || ''),
      escapeCsv(t.date_debut || ''),
      escapeCsv(t.date_echeance || ''),
      escapeCsv(t.delay_text || t.alert_level || ''),
      escapeCsv(t.notes || ''),
      escapeCsv(t.motif_blocage || '')
    ].join(';'));

    const csvContent = bom + headers.join(';') + '\r\n' + rows.join('\r\n');

    fs.writeFileSync(filePath, csvContent, 'utf-8');

    try {
      shell.showItemInFolder(filePath);
    } catch {}

    return { success: true, filePath };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur lors de l’export CSV' };
  }
}
