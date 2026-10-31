import { Notification } from 'electron';
import Database from 'better-sqlite3';

export interface AlertTask {
  id: number;
  titre: string;
  service: string;
  priorite: string;
  statut: string;
  agent_nom: string;
  agent_prenom: string;
  agent_matricule: string;
  agent_service: string;
  reference_dossier: string | null;
  date_debut: string;
  date_echeance: string;
  progression: number;
  alert_level: 'overdue' | 'j-3' | 'normal' | 'done';
  diff_days: number;
  delay_text: string;
}

export function computeAlertStatus(dateEcheanceStr: string, statut: string): {
  alert_level: 'overdue' | 'j-3' | 'normal' | 'done';
  diff_days: number;
  delay_text: string;
} {
  if (statut === 'Terminée') {
    return {
      alert_level: 'done',
      diff_days: 0,
      delay_text: 'Tâche clôturée'
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [year, month, day] = dateEcheanceStr.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      alert_level: 'overdue',
      diff_days: diffDays,
      delay_text: overdueDays === 1 ? 'En retard de 1 jour' : `En retard de ${overdueDays} jours`
    };
  }

  if (diffDays === 0) {
    return {
      alert_level: 'j-3',
      diff_days: 0,
      delay_text: "Expire aujourd'hui !"
    };
  }

  if (diffDays === 1) {
    return {
      alert_level: 'j-3',
      diff_days: 1,
      delay_text: 'Expire demain (J-1)'
    };
  }

  if (diffDays <= 3) {
    return {
      alert_level: 'j-3',
      diff_days: diffDays,
      delay_text: `Reste ${diffDays} jours (J-${diffDays})`
    };
  }

  return {
    alert_level: 'normal',
    diff_days: diffDays,
    delay_text: `Dans ${diffDays} jours`
  };
}

export function scanActiveAlerts(db: Database.Database): AlertTask[] {
  const query = `
    SELECT 
      t.id, t.titre, t.service, t.priorite, t.statut, t.reference_dossier,
      t.date_debut, t.date_echeance, t.progression,
      e.nom AS agent_nom, e.prenom AS agent_prenom, e.matricule AS agent_matricule, e.service AS agent_service
    FROM task_assignments t
    JOIN employees e ON t.agent_id = e.id
    WHERE t.statut != 'Terminée'
    ORDER BY t.date_echeance ASC
  `;

  const rows = db.prepare(query).all() as any[];

  const tasksWithAlerts: AlertTask[] = [];

  for (const row of rows) {
    const computed = computeAlertStatus(row.date_echeance, row.statut);
    tasksWithAlerts.push({
      ...row,
      ...computed
    });
  }

  return tasksWithAlerts;
}

export function checkAndNotify(db: Database.Database, isStartup = false) {
  try {
    const tasks = scanActiveAlerts(db);
    const overdueCount = tasks.filter(t => t.alert_level === 'overdue').length;
    const j3Count = tasks.filter(t => t.alert_level === 'j-3').length;

    const totalUrgent = overdueCount + j3Count;

    if (totalUrgent > 0 && Notification.isSupported()) {
      let body = '';
      if (overdueCount > 0 && j3Count > 0) {
        body = `⚠️ ${overdueCount} dossier(s) en retard et ${j3Count} échéance(s) critique(s) dans les 3 jours.`;
      } else if (overdueCount > 0) {
        body = `🔴 Attention : ${overdueCount} dossier(s) CNAS en dépassement d'échéance.`;
      } else {
        body = `🟡 Rappel J-3 : ${j3Count} dossier(s) CNAS arrivent à échéance d'ici 72 heures.`;
      }

      const notif = new Notification({
        title: 'SuiviDesk CNAS • Alerte Échéances',
        body,
        silent: !isStartup
      });

      notif.show();
    }
  } catch (err) {
    console.error('Erreur lors du déclenchement de la notification native:', err);
  }
}
