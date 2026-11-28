import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { exec } from 'child_process';
import dns from 'dns';
import {
  getDatabase,
  getDatabasePath,
  getUserFilesDirectory,
  getTaskFilesDirectory,
  getBackupsDirectory,
  getOrCreateDeviceId,
  getWorkstationName
} from './db.js';

export interface SyncDeltas {
  deviceId: string;
  workstationName: string;
  timestamp: string;
  employees: any[];
  tasks: any[];
  documents: any[];
}

export interface SyncPreview {
  remoteDeviceId: string;
  remoteWorkstation: string;
  remoteIp: string;
  incoming: {
    newEmployees: number;
    updatedEmployees: number;
    deletedEmployees: number;
    newTasks: number;
    updatedTasks: number;
    deletedTasks: number;
    missingDocuments: Array<{ name: string; size: number; sync_uuid: string }>;
  };
  outgoing: {
    newEmployees: number;
    updatedEmployees: number;
    newTasks: number;
    updatedTasks: number;
  };
}

let syncServer: http.Server | null = null;
let activePort = 4850;

// -------------------------------------------------------------
// 1. Local Deltas Retrieval
// -------------------------------------------------------------

export function getLocalDeltas(sinceTimestamp?: string): SyncDeltas {
  const db = getDatabase();
  const timestamp = new Date().toISOString();

  let empQuery = 'SELECT * FROM employees';
  let taskQuery = 'SELECT * FROM task_assignments';
  let docQuery = 'SELECT * FROM task_documents';

  if (sinceTimestamp) {
    empQuery += ` WHERE updated_at > '${sinceTimestamp}' OR created_at > '${sinceTimestamp}'`;
    taskQuery += ` WHERE updated_at > '${sinceTimestamp}' OR created_at > '${sinceTimestamp}'`;
    docQuery += ` WHERE created_at > '${sinceTimestamp}'`;
  }

  const employees = db.prepare(empQuery).all() as any[];
  const tasks = db.prepare(taskQuery).all() as any[];
  const documents = db.prepare(docQuery).all() as any[];

  // Map employee sync_uuid onto tasks for robust relational mapping across PCs
  const tasksWithUuid = tasks.map((t) => {
    let agent_sync_uuid = '';
    if (t.agent_id) {
      const emp = db.prepare('SELECT sync_uuid FROM employees WHERE id = ?').get(t.agent_id) as any;
      if (emp?.sync_uuid) agent_sync_uuid = emp.sync_uuid;
    }
    return { ...t, agent_sync_uuid };
  });

  // Map task sync_uuid onto documents
  const docsWithUuid = documents.map((d) => {
    let task_sync_uuid = '';
    if (d.task_id) {
      const task = db.prepare('SELECT sync_uuid FROM task_assignments WHERE id = ?').get(d.task_id) as any;
      if (task?.sync_uuid) task_sync_uuid = task.sync_uuid;
    }
    return { ...d, task_sync_uuid };
  });

  return {
    deviceId: getOrCreateDeviceId(),
    workstationName: getWorkstationName(),
    timestamp,
    employees,
    tasks: tasksWithUuid,
    documents: docsWithUuid
  };
}

// -------------------------------------------------------------
// 2. Pre-Sync Preview & Diff Calculation
// -------------------------------------------------------------

export function calculateSyncPreview(incoming: SyncDeltas, remoteIp = ''): SyncPreview {
  const db = getDatabase();
  const taskFilesDir = getTaskFilesDirectory();
  const employeeFilesDir = getUserFilesDirectory();

  let newEmployees = 0;
  let updatedEmployees = 0;
  let deletedEmployees = 0;

  for (const emp of incoming.employees) {
    if (!emp.sync_uuid) continue;
    const local = db.prepare('SELECT * FROM employees WHERE sync_uuid = ?').get(emp.sync_uuid) as any;
    if (!local) {
      if (emp.is_deleted) deletedEmployees++;
      else newEmployees++;
    } else if (emp.is_deleted && !local.is_deleted) {
      deletedEmployees++;
    } else if (new Date(emp.updated_at || 0) > new Date(local.updated_at || 0)) {
      updatedEmployees++;
    }
  }

  let newTasks = 0;
  let updatedTasks = 0;
  let deletedTasks = 0;

  for (const t of incoming.tasks) {
    if (!t.sync_uuid) continue;
    const local = db.prepare('SELECT * FROM task_assignments WHERE sync_uuid = ?').get(t.sync_uuid) as any;
    if (!local) {
      if (t.is_deleted) deletedTasks++;
      else newTasks++;
    } else if (t.is_deleted && !local.is_deleted) {
      deletedTasks++;
    } else if (new Date(t.updated_at || 0) > new Date(local.updated_at || 0)) {
      updatedTasks++;
    }
  }

  const missingDocuments: Array<{ name: string; size: number; sync_uuid: string }> = [];
  for (const doc of incoming.documents) {
    if (!doc.sync_uuid || doc.is_deleted) continue;
    const local = db.prepare('SELECT * FROM task_documents WHERE sync_uuid = ?').get(doc.sync_uuid) as any;
    const existsLocally = local?.file_path && fs.existsSync(local.file_path);
    if (!existsLocally) {
      missingDocuments.push({
        name: doc.file_name,
        size: doc.file_size || 0,
        sync_uuid: doc.sync_uuid
      });
    }
  }

  // Calculate local outgoing changes
  const localDeltas = getLocalDeltas();
  const incomingEmpUuids = new Set(incoming.employees.map((e) => e.sync_uuid));
  const incomingTaskUuids = new Set(incoming.tasks.map((t) => t.sync_uuid));

  const outNewEmps = localDeltas.employees.filter((e) => !incomingEmpUuids.has(e.sync_uuid) && !e.is_deleted).length;
  const outNewTasks = localDeltas.tasks.filter((t) => !incomingTaskUuids.has(t.sync_uuid) && !t.is_deleted).length;

  return {
    remoteDeviceId: incoming.deviceId,
    remoteWorkstation: incoming.workstationName,
    remoteIp,
    incoming: {
      newEmployees,
      updatedEmployees,
      deletedEmployees,
      newTasks,
      updatedTasks,
      deletedTasks,
      missingDocuments
    },
    outgoing: {
      newEmployees: outNewEmps,
      updatedEmployees: 0,
      newTasks: outNewTasks,
      updatedTasks: 0
    }
  };
}

// -------------------------------------------------------------
// 3. Two-Way Merge & Conflict Resolution Engine
// -------------------------------------------------------------

export function applyIncomingDeltas(
  incoming: SyncDeltas,
  remoteIp = ''
): { success: boolean; appliedCount: number; conflictCount: number; error?: string } {
  const db = getDatabase();
  const dbPath = getDatabasePath();

  // Safety Snapshot before any merge
  try {
    const backupDir = getBackupsDirectory();
    const backupFile = path.join(backupDir, `suividesk_pre_sync_${Date.now()}.sqlite`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupFile);
    }
  } catch (backupErr) {
    console.warn('Pre-sync auto-backup warning:', backupErr);
  }

  let appliedCount = 0;
  let conflictCount = 0;

  try {
    db.exec('BEGIN TRANSACTION;');

    // 1. Merge Employees
    for (const emp of incoming.employees) {
      if (!emp.sync_uuid) continue;
      const local = db.prepare('SELECT * FROM employees WHERE sync_uuid = ?').get(emp.sync_uuid) as any;

      if (!local) {
        // Insert new employee
        db.prepare(`
          INSERT INTO employees (
            civilite, full_name, file_name, file_path, file_type,
            sync_uuid, is_deleted, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          emp.civilite || '',
          emp.full_name || '',
          emp.file_name || '',
          emp.file_path || '',
          emp.file_type || '',
          emp.sync_uuid,
          emp.is_deleted ? 1 : 0,
          emp.created_at || new Date().toISOString(),
          emp.updated_at || new Date().toISOString()
        );
        appliedCount++;
      } else {
        // Conflict Check & Last-Write-Wins
        const incomingTime = new Date(emp.updated_at || emp.created_at || 0).getTime();
        const localTime = new Date(local.updated_at || local.created_at || 0).getTime();

        if (incomingTime >= localTime) {
          // Log conflict if local was also modified
          if (localTime > 0 && incomingTime - localTime < 24 * 3600 * 1000 && local.full_name !== emp.full_name) {
            db.prepare(`
              INSERT INTO sync_conflicts (
                entity_type, entity_uuid, remote_device, original_data, incoming_data, resolution
              ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              'employee',
              emp.sync_uuid,
              incoming.workstationName,
              JSON.stringify(local),
              JSON.stringify(emp),
              'last_write_wins'
            );
            conflictCount++;
          }

          db.prepare(`
            UPDATE employees SET
              civilite = ?,
              full_name = ?,
              file_name = ?,
              file_type = ?,
              is_deleted = ?,
              updated_at = ?
            WHERE sync_uuid = ?
          `).run(
            emp.civilite ?? local.civilite,
            emp.full_name ?? local.full_name,
            emp.file_name ?? local.file_name,
            emp.file_type ?? local.file_type,
            emp.is_deleted ? 1 : 0,
            emp.updated_at || new Date().toISOString(),
            emp.sync_uuid
          );
          appliedCount++;
        }
      }
    }

    // 2. Merge Tasks
    for (const t of incoming.tasks) {
      if (!t.sync_uuid) continue;

      // Resolve local agent_id from agent_sync_uuid
      let localAgentId: number | null = null;
      if (t.agent_sync_uuid) {
        const agent = db.prepare('SELECT id FROM employees WHERE sync_uuid = ?').get(t.agent_sync_uuid) as any;
        if (agent?.id) localAgentId = agent.id;
      }

      const local = db.prepare('SELECT * FROM task_assignments WHERE sync_uuid = ?').get(t.sync_uuid) as any;

      if (!local) {
        db.prepare(`
          INSERT INTO task_assignments (
            agent_id, titre, sujet, personne_cible, reference_dossier, wilaya, numero_ordre,
            priorite, date_courrier, date_distribution, date_debut, date_finale,
            etat_courrier, note, note_finale, sync_uuid, is_deleted, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          localAgentId,
          t.titre || '',
          t.sujet || '',
          t.personne_cible || '',
          t.reference_dossier || '',
          t.wilaya || '',
          t.numero_ordre || '',
          t.priorite || '',
          t.date_courrier || '',
          t.date_distribution || '',
          t.date_debut || '',
          t.date_finale || '',
          t.etat_courrier || '',
          t.note || '',
          t.note_finale || '',
          t.sync_uuid,
          t.is_deleted ? 1 : 0,
          t.created_at || new Date().toISOString(),
          t.updated_at || new Date().toISOString()
        );
        appliedCount++;
      } else {
        const incomingTime = new Date(t.updated_at || t.created_at || 0).getTime();
        const localTime = new Date(local.updated_at || local.created_at || 0).getTime();

        if (incomingTime >= localTime) {
          if (localTime > 0 && (local.etat_courrier !== t.etat_courrier || local.titre !== t.titre)) {
            db.prepare(`
              INSERT INTO sync_conflicts (
                entity_type, entity_uuid, remote_device, original_data, incoming_data, resolution
              ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              'task',
              t.sync_uuid,
              incoming.workstationName,
              JSON.stringify(local),
              JSON.stringify(t),
              'last_write_wins'
            );
            conflictCount++;
          }

          db.prepare(`
            UPDATE task_assignments SET
              agent_id = COALESCE(?, agent_id),
              titre = ?,
              sujet = ?,
              personne_cible = ?,
              reference_dossier = ?,
              wilaya = ?,
              numero_ordre = ?,
              priorite = ?,
              date_courrier = ?,
              date_distribution = ?,
              date_debut = ?,
              date_finale = ?,
              etat_courrier = ?,
              note = ?,
              note_finale = ?,
              is_deleted = ?,
              updated_at = ?
            WHERE sync_uuid = ?
          `).run(
            localAgentId,
            t.titre ?? local.titre,
            t.sujet ?? local.sujet,
            t.personne_cible ?? local.personne_cible,
            t.reference_dossier ?? local.reference_dossier,
            t.wilaya ?? local.wilaya,
            t.numero_ordre ?? local.numero_ordre,
            t.priorite ?? local.priorite,
            t.date_courrier ?? local.date_courrier,
            t.date_distribution ?? local.date_distribution,
            t.date_debut ?? local.date_debut,
            t.date_finale ?? local.date_finale,
            t.etat_courrier ?? local.etat_courrier,
            t.note ?? local.note,
            t.note_finale ?? local.note_finale,
            t.is_deleted ? 1 : 0,
            t.updated_at || new Date().toISOString(),
            t.sync_uuid
          );
          appliedCount++;
        }
      }
    }

    // 3. Merge Documents Metadata
    for (const d of incoming.documents) {
      if (!d.sync_uuid) continue;
      let localTaskId: number | null = null;
      if (d.task_sync_uuid) {
        const task = db.prepare('SELECT id FROM task_assignments WHERE sync_uuid = ?').get(d.task_sync_uuid) as any;
        if (task?.id) localTaskId = task.id;
      }

      const local = db.prepare('SELECT * FROM task_documents WHERE sync_uuid = ?').get(d.sync_uuid) as any;
      if (!local) {
        db.prepare(`
          INSERT INTO task_documents (
            task_id, file_name, file_path, file_type, file_size, sync_uuid, is_deleted, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          localTaskId,
          d.file_name || 'document',
          d.file_path || '',
          d.file_type || '',
          d.file_size || 0,
          d.sync_uuid,
          d.is_deleted ? 1 : 0,
          d.created_at || new Date().toISOString()
        );
        appliedCount++;
      } else if (d.is_deleted && !local.is_deleted) {
        db.prepare('UPDATE task_documents SET is_deleted = 1 WHERE sync_uuid = ?').run(d.sync_uuid);
        appliedCount++;
      }
    }

    // Record paired device in sync_devices
    db.prepare(`
      INSERT INTO sync_devices (device_id, device_name, ip_address, last_synced_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(device_id) DO UPDATE SET
        device_name = excluded.device_name,
        ip_address = excluded.ip_address,
        last_synced_at = CURRENT_TIMESTAMP
    `).run(incoming.deviceId, incoming.workstationName, remoteIp);

    db.exec('COMMIT;');
    return { success: true, appliedCount, conflictCount };
  } catch (err: any) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    return { success: false, appliedCount: 0, conflictCount: 0, error: err.message };
  }
}

// -------------------------------------------------------------
// 4. Rollback to Pre-Sync Snapshot
// -------------------------------------------------------------

export function rollbackLastSync(): { success: boolean; error?: string; backupName?: string } {
  try {
    const backupDir = getBackupsDirectory();
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith('suividesk_pre_sync_') && f.endsWith('.sqlite'))
      .sort()
      .reverse();

    if (files.length === 0) {
      return { success: false, error: 'Aucune sauvegarde pré-synchronisation trouvée.' };
    }

    const latestBackup = path.join(backupDir, files[0]);
    const dbPath = getDatabasePath();

    fs.copyFileSync(latestBackup, dbPath);
    return { success: true, backupName: files[0] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// 5. Local HTTP Sync Server
// -------------------------------------------------------------

export function startLocalSyncServer(preferredPort = 4850): Promise<number> {
  if (syncServer) return Promise.resolve(activePort);

  return new Promise((resolve, reject) => {
    syncServer = http.createServer((req, res) => {
      // CORS headers for local LAN communication
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;

      // Endpoint: POST /api/sync/announce (Permet à un smartphone ou poste SuiviDesk de s'annoncer)
      if (req.method === 'POST' && pathname === '/api/sync/announce') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            const remoteIp = (req.socket.remoteAddress || '').replace(/^.*:/, '');
            if (remoteIp) {
              activeAnnouncedPeers.set(remoteIp, {
                ip: remoteIp,
                port: data.port || 4850,
                name: data.deviceName || 'Smartphone Mobile',
                deviceId: data.deviceId || `device-${remoteIp.replace(/\./g, '-')}`,
                deviceType: (data.deviceType as any) || 'phone',
                isSuiviDesk: true,
                version: data.version || '1.5.0',
                statusText: 'SuiviDesk Mobile Prêt'
              });
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Appareil enregistré avec succès' }));
          } catch (e: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // Endpoint: GET /api/sync/info
      if (req.method === 'GET' && pathname === '/api/sync/info') {
        const info = {
          deviceId: getOrCreateDeviceId(),
          workstationName: getWorkstationName(),
          version: '1.4.0',
          port: activePort
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info));
        return;
      }

      // Endpoint: GET /api/sync/deltas
      if (req.method === 'GET' && pathname === '/api/sync/deltas') {
        const since = parsedUrl.searchParams.get('since') || undefined;
        const deltas = getLocalDeltas(since);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(deltas));
        return;
      }

      // Endpoint: POST /api/sync/preview
      if (req.method === 'POST' && pathname === '/api/sync/preview') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body) as SyncDeltas;
            const remoteIp = (req.socket.remoteAddress || '').replace(/^.*:/, '');
            const preview = calculateSyncPreview(incoming, remoteIp);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(preview));
          } catch (e: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // Endpoint: POST /api/sync/apply
      if (req.method === 'POST' && pathname === '/api/sync/apply') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body) as SyncDeltas;
            const remoteIp = (req.socket.remoteAddress || '').replace(/^.*:/, '');
            const result = applyIncomingDeltas(incoming, remoteIp);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // Endpoint: GET /api/sync/file/:syncUuid
      if (req.method === 'GET' && pathname.startsWith('/api/sync/file/')) {
        const syncUuid = pathname.replace('/api/sync/file/', '');
        const db = getDatabase();
        const doc = db.prepare('SELECT file_path, file_name FROM task_documents WHERE sync_uuid = ?').get(syncUuid) as any;
        if (doc?.file_path && fs.existsSync(doc.file_path)) {
          res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${path.basename(doc.file_name)}"`
          });
          fs.createReadStream(doc.file_path).pipe(res);
          return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fichier introuvable.' }));
        return;
      }

      res.writeHead(404);
      res.end();
    });

    syncServer.listen(preferredPort, '0.0.0.0', () => {
      activePort = preferredPort;
      console.log(`SuiviDesk Sync Server running on port ${activePort}`);
      resolve(activePort);
    });

    syncServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        startLocalSyncServer(preferredPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

export function stopLocalSyncServer(): Promise<void> {
  return new Promise((resolve) => {
    if (syncServer) {
      syncServer.close(() => {
        syncServer = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// -------------------------------------------------------------
// 6. Subnet Peer & Device Discovery (Smartphones & Desktops)
// -------------------------------------------------------------

export interface DiscoveredPeerInfo {
  ip: string;
  port: number;
  name: string;
  deviceId: string;
  deviceType: 'phone' | 'desktop' | 'router' | 'other';
  isSuiviDesk: boolean;
  mac?: string;
  vendor?: string;
  version?: string;
  statusText?: string;
}

const activeAnnouncedPeers = new Map<string, DiscoveredPeerInfo>();

const KNOWN_OUIs: Record<string, { vendor: string; type: 'phone' | 'desktop' | 'router'; label: string }> = {
  // Mobile / Smartphone brands
  'a4:55:90': { vendor: 'Xiaomi', type: 'phone', label: 'Smartphone Xiaomi Redmi/Poco' },
  '98:90:96': { vendor: 'Xiaomi', type: 'phone', label: 'Smartphone Xiaomi' },
  'd8:43:ae': { vendor: 'Xiaomi', type: 'phone', label: 'Smartphone Xiaomi' },
  '78:02:f8': { vendor: 'Xiaomi', type: 'phone', label: 'Smartphone Xiaomi' },
  '64:cc:2e': { vendor: 'Xiaomi', type: 'phone', label: 'Smartphone Xiaomi' },
  '34:ce:00': { vendor: 'Xiaomi', type: 'phone', label: 'Smartphone Xiaomi' },
  '28:6c:07': { vendor: 'Xiaomi', type: 'phone', label: 'Smartphone Xiaomi' },
  '00:07:ab': { vendor: 'Samsung', type: 'phone', label: 'Smartphone Samsung Galaxy' },
  '00:12:47': { vendor: 'Samsung', type: 'phone', label: 'Smartphone Samsung Galaxy' },
  '34:c0:59': { vendor: 'Samsung', type: 'phone', label: 'Smartphone Samsung Galaxy' },
  '84:25:19': { vendor: 'Samsung', type: 'phone', label: 'Smartphone Samsung Galaxy' },
  'bc:d1:77': { vendor: 'Samsung', type: 'phone', label: 'Smartphone Samsung Galaxy' },
  'cc:07:ab': { vendor: 'Samsung', type: 'phone', label: 'Smartphone Samsung Galaxy' },
  'e4:e0:c5': { vendor: 'Samsung', type: 'phone', label: 'Smartphone Samsung Galaxy' },
  'f0:18:98': { vendor: 'Apple', type: 'phone', label: 'iPhone / iPad Apple' },
  'bc:d1:1f': { vendor: 'Apple', type: 'phone', label: 'iPhone / iPad Apple' },
  'a4:5e:60': { vendor: 'Apple', type: 'phone', label: 'iPhone / iPad Apple' },
  '3c:22:fb': { vendor: 'Apple', type: 'phone', label: 'iPhone / iPad Apple' },
  '70:ec:e4': { vendor: 'Apple', type: 'phone', label: 'iPhone / iPad Apple' },
  'ac:bc:32': { vendor: 'Apple', type: 'phone', label: 'iPhone / iPad Apple' },
  '2c:f0:ee': { vendor: 'Apple', type: 'phone', label: 'iPhone / iPad Apple' },
  '68:db:ca': { vendor: 'Apple', type: 'phone', label: 'iPhone / iPad Apple' },
  '00:18:82': { vendor: 'Huawei', type: 'phone', label: 'Smartphone Huawei' },
  '00:1e:10': { vendor: 'Huawei', type: 'phone', label: 'Smartphone Huawei' },
  '48:46:fb': { vendor: 'Huawei', type: 'phone', label: 'Smartphone Huawei' },
  '70:72:3c': { vendor: 'Huawei', type: 'phone', label: 'Smartphone Huawei' },
  '74:51:ba': { vendor: 'Oppo', type: 'phone', label: 'Smartphone Oppo' },
  '9c:28:bf': { vendor: 'Vivo', type: 'phone', label: 'Smartphone Vivo' },
  'b0:41:1d': { vendor: 'Realme', type: 'phone', label: 'Smartphone Realme' },
  '20:55:31': { vendor: 'Google Pixel', type: 'phone', label: 'Smartphone Google Pixel' },
  'e0:dc:ff': { vendor: 'OnePlus', type: 'phone', label: 'Smartphone OnePlus' },
  'f8:cf:c5': { vendor: 'Motorola', type: 'phone', label: 'Smartphone Motorola' },
  // PC / Workstation vendors
  'c4:12:f5': { vendor: 'Realtek / PC', type: 'desktop', label: 'Poste de travail / PC' },
  '00:1a:a0': { vendor: 'Dell', type: 'desktop', label: 'PC Dell Workstation' },
  '18:66:da': { vendor: 'Dell', type: 'desktop', label: 'PC Dell' },
  '00:25:b3': { vendor: 'HP', type: 'desktop', label: 'PC HP' },
  '30:8d:99': { vendor: 'HP', type: 'desktop', label: 'PC HP' },
  '00:21:cc': { vendor: 'Lenovo', type: 'desktop', label: 'PC Lenovo ThinkPad' },
  '54:ee:75': { vendor: 'Lenovo', type: 'desktop', label: 'PC Lenovo' },
  '00:15:5d': { vendor: 'Microsoft', type: 'desktop', label: 'Poste Windows' },
  '00:23:18': { vendor: 'ASUS', type: 'desktop', label: 'PC ASUS' },
  '00:1e:67': { vendor: 'Intel', type: 'desktop', label: 'PC Intel' },
  '3c:97:0e': { vendor: 'Intel', type: 'desktop', label: 'PC Intel' },
  // Network / Routers
  '4c:06:17': { vendor: 'Huawei', type: 'router', label: 'Routeur / Modem Fibre' },
  '00:72:ee': { vendor: 'Alcatel-Lucent / Nokia', type: 'router', label: 'Équipement Réseau / Passerelle' },
  'e8:65:d4': { vendor: 'TP-Link', type: 'router', label: 'Routeur TP-Link' },
  '50:d4:f7': { vendor: 'TP-Link', type: 'router', label: 'Routeur TP-Link' }
};

export async function discoverLanPeers(port = 4850): Promise<DiscoveredPeerInfo[]> {
  const localDeviceId = getOrCreateDeviceId();
  const interfaces = os.networkInterfaces();
  const subnets: string[] = [];
  const localIps = new Set<string>(['127.0.0.1', '0.0.0.0']);

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIps.add(iface.address);
        const parts = iface.address.split('.');
        if (parts.length === 4) {
          const s = `${parts[0]}.${parts[1]}.${parts[2]}`;
          if (!subnets.includes(s)) subnets.push(s);
        }
      }
    }
  }

  const peersMap = new Map<string, DiscoveredPeerInfo>();

  // Include peers that announced themselves recently
  for (const [ip, peer] of activeAnnouncedPeers.entries()) {
    if (!localIps.has(ip)) {
      peersMap.set(ip, { ...peer });
    }
  }

  // 1. Probe port 4850 on subnet (finds SuiviDesk instances & forces ARP cache populate)
  const checkSuiviDeskPort = (ip: string): Promise<void> => {
    return new Promise((resolve) => {
      const req = http.get(
        {
          host: ip,
          port,
          path: '/api/sync/info',
          timeout: 450
        },
        (res) => {
          if (res.statusCode === 200) {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
              try {
                const info = JSON.parse(data);
                if (info?.deviceId && info.deviceId !== localDeviceId) {
                  const isMobile =
                    (info.workstationName || '').toLowerCase().includes('mobile') ||
                    (info.workstationName || '').toLowerCase().includes('android') ||
                    (info.workstationName || '').toLowerCase().includes('iphone');

                  peersMap.set(ip, {
                    ip,
                    port,
                    name: info.workstationName || (isMobile ? 'SuiviDesk Mobile' : 'SuiviDesk-PC'),
                    deviceId: info.deviceId,
                    deviceType: isMobile ? 'phone' : 'desktop',
                    isSuiviDesk: true,
                    version: info.version || '1.5.0',
                    statusText: 'Prêt à synchroniser'
                  });
                }
              } catch {}
              resolve();
            });
          } else {
            resolve();
          }
        }
      );
      req.on('error', () => resolve());
      req.on('timeout', () => {
        req.destroy();
        resolve();
      });
    });
  };

  if (subnets.length > 0) {
    const base = subnets[0];
    const probes: Promise<void>[] = [];
    for (let i = 1; i <= 254; i++) {
      probes.push(checkSuiviDeskPort(`${base}.${i}`));
    }
    await Promise.all(probes);
  }

  // 2. Read ARP table to enrich MAC addresses of detected SuiviDesk devices
  let arpOutput = '';
  try {
    arpOutput = await new Promise<string>((resolve) => {
      exec('arp -a', { timeout: 1000 }, (err, stdout) => {
        resolve(stdout || '');
      });
    });
  } catch {}

  const arpLines = arpOutput.split('\n');
  for (const line of arpLines) {
    const match = line.trim().match(/^([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\s+([0-9a-fA-F-]+)\s+(\w+)/);
    if (!match) continue;
    const [_, ip, rawMac] = match;
    const existing = peersMap.get(ip);
    if (existing) {
      existing.mac = rawMac.replace(/-/g, ':').toLowerCase();
    }
  }

  // STRICT FILTER: Only return devices that have SuiviDesk installed & running (Mobile or PC)
  const verifiedSuiviDeskPeers = Array.from(peersMap.values()).filter((p) => p.isSuiviDesk);

  return verifiedSuiviDeskPeers.sort((a, b) => {
    // Sort SuiviDesk Mobile first, then SuiviDesk PC
    if (a.deviceType === 'phone' && b.deviceType !== 'phone') return -1;
    if (a.deviceType !== 'phone' && b.deviceType === 'phone') return 1;
    return a.name.localeCompare(b.name);
  });
}

// -------------------------------------------------------------
// 7. Remote Peer Client Sync Helpers
// -------------------------------------------------------------

export async function fetchRemoteInfo(ip: string, port = 4850): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: ip, port, path: '/api/sync/info', timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Délai de connexion dépassé'));
    });
  });
}

export async function requestRemoteSyncPreview(remoteIp: string, remotePort = 4850): Promise<SyncPreview> {
  const localDeltas = getLocalDeltas();
  const postData = JSON.stringify(localDeltas);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: remoteIp,
        port: remotePort,
        path: '/api/sync/preview',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 6000
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Délai dépassé lors du calcul du rapport'));
    });
    req.write(postData);
    req.end();
  });
}

export async function executeBidirectionalSync(
  remoteIp: string,
  remotePort = 4850
): Promise<{ success: boolean; appliedCount: number; conflictCount: number; error?: string }> {
  const localDeltas = getLocalDeltas();

  // 1. Send local deltas to remote PC
  const postData = JSON.stringify(localDeltas);
  await new Promise<void>((resolve, reject) => {
    const req = http.request(
      {
        host: remoteIp,
        port: remotePort,
        path: '/api/sync/apply',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve());
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  // 2. Fetch remote deltas and apply them locally
  const remoteDeltas = await new Promise<SyncDeltas>((resolve, reject) => {
    const req = http.get(
      {
        host: remoteIp,
        port: remotePort,
        path: '/api/sync/deltas',
        timeout: 8000
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
  });

  const localResult = applyIncomingDeltas(remoteDeltas, remoteIp);

  // 3. Download any missing document attachments from remote PC
  const taskFilesDir = getTaskFilesDirectory();
  for (const doc of remoteDeltas.documents) {
    if (!doc.sync_uuid || doc.is_deleted) continue;
    const destName = `${Date.now()}_${path.basename(doc.file_name)}`;
    const destPath = path.join(taskFilesDir, destName);

    try {
      await new Promise<void>((resolve) => {
        const fileReq = http.get(
          {
            host: remoteIp,
            port: remotePort,
            path: `/api/sync/file/${doc.sync_uuid}`,
            timeout: 5000
          },
          (fileRes) => {
            if (fileRes.statusCode === 200) {
              const fileStream = fs.createWriteStream(destPath);
              fileRes.pipe(fileStream);
              fileStream.on('finish', () => {
                fileStream.close();
                // Update local document path
                const db = getDatabase();
                db.prepare('UPDATE task_documents SET file_path = ? WHERE sync_uuid = ?').run(destPath, doc.sync_uuid);
                resolve();
              });
            } else {
              resolve();
            }
          }
        );
        fileReq.on('error', () => resolve());
      });
    } catch {}
  }

  return localResult;
}
