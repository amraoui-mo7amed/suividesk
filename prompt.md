Role: Principal Full-Stack Desktop Engineer & UI/UX Designer specializing in Electron, React, Python micro-workers, and translucent design systems.

Task: Build a production-ready, fully functional Desktop Application named "SuiviDesk" for the CNAS (Caisse Nationale des Assurances Sociales) using Electron + React + TypeScript + Tailwind CSS + SQLite, featuring:
- Official CNAS logo branding.
- A 3-day proactive smart alert & reminder engine for approaching deadlines.
- Responsive Glassmorphic Cards UI (replacing rigid data tables) with extensive filtering.
- PDF generation powered by WeasyPrint and native French-formatted CSV exports.

Language & Localization:
- All UI text, badges, modals, notifications, filter labels, and PDF report templates must be strictly in French (fr-FR).

Branding & Visual Identity:
- Prominently feature the official CNAS logo and emblem in the app header/sidebar and on all exported WeasyPrint PDF headers.
- Provide a clean placeholder SVG/PNG asset path for the CNAS logo (`assets/cnas-logo.svg`) with appropriate brand-aligned color accents (CNAS royal blue `#0055A5` / cyan glow touches).

Design System: "Liquid Glass" (Organic Glassmorphism) with Dark/Light Modes
- Backdrop filter blur (`backdrop-filter: blur(24px)`), translucent surfaces (`rgba` backgrounds), and reactive glowing borders (`1px solid rgba(255,255,255,0.12)` / `rgba(0,0,0,0.08)`).
- Instant toggle between:
  1. Dark Mode (Deep Obsidian): Smoky glass, luminous neon badges, high-contrast text.
  2. Light Mode (Frosted Alabaster): Crystalline frosted panels, clean shadows, crisp dark text.
- Micro-interactions: 60 FPS transitions via Framer Motion, hover tilt/glow effects on cards, and smooth modal expansions.

Smart Alerts & Deadline Reminder Engine (3-Day Proactive Monitoring):
- Implement an automated background check that scans active task deadlines against `Date.now()`.
- Alert Levels & Logic:
  * 🟡 "Échéance Proche (J-3 à J-1)" : Triggers continuously starting 3 days before the deadline. Displays a glowing amber warning badge with a countdown (e.g., "Reste 2 jours", "Expire demain").
  * 🔴 "En retard (Dépassée)" : Triggers immediately once the deadline timestamp is passed and status != "Terminée".
  * 🔵 "Dans les temps" : Deadline is strictly greater than 3 days away.
- Notification Drawer & Native System Alerts:
  * A dedicated notification bell icon with an active counter badge in the top navigation bar.
  * Clicking reveals a glass drop-down panel listing all urgent/J-3 tasks grouped by employee.
  * Uses Electron native notifications (`new Notification({ title: 'Alerte Échéance CNAS', body: '...' })`) to notify the manager upon application launch and on an hourly background interval.

Card-Based Responsive Layout (Replacing Rigid Tables):
- Do NOT use standard flat data tables for task tracking. Use a responsive grid of dynamic **Liquid Glass Task Cards** (`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`).
- Card Content & Hierarchy:
  * Header: Task title, category badge, and priority chip (Urgente, Haute, Moyenne, Basse).
  * Body: Employee name + matricule chip, department badge, concise description/instructions preview (expandable), and start date.
  * Deadline Section: Visual progress bar and dynamic J-3 reminder badge (glowing amber for 3 days left, red for overdue).
  * Quick Actions Footer: One-click status stepper (En attente ➔ En cours ➔ Terminée / Bloquée), edit button, and view details.

Comprehensive Multi-Filter & Search Bar:
- Instant live search by task title, description keywords, employee name, or matricule.
- Filter chips and drop-down selectors:
  * Statut: Tous, En attente, En cours, Terminée, En retard, Bloquée.
  * Alerte Échéance: Toutes, Échéance dans 3 jours (J-3), En retard uniquement.
  * Service / Pôle: Recouvrement, Prestations, Contrôle Médical, Contentieux, Informatique, RH.
  * Priorité: Urgente, Haute, Moyenne, Basse.
  * Agent / Collaborateur: Single or multi-employee selection.
  * Période: Aujourd'hui, Cette semaine, Ce mois, Période personnalisée (Date Début - Date Fin).
- "Réinitialiser les filtres" quick-action button.

Core Modules to Implement:
1. Task Catalog Management (Catalogue des Tâches Maîtresses):
   - CRUD interface to define reusable standard task templates.
2. Employee Directory & Capacity (Annuaire des Collaborateurs):
   - Employee cards showing active tasks count, J-3 alert count, and workload progress gauge.
3. Task Assignment & Scheduling (Affectation & Planification):
   - Modal assigning tasks from catalog to agents with start date, deadline, and dossier/bordereau reference details.
4. Dynamic Card Tracking View (Suivi Opérationnel en Cartes):
   - Responsive card grid with the comprehensive multi-filter system and status workflow.
5. Table Dashboard (Analytique & Synthèse):
   - Top KPI cards (including a dedicated "Alertes J-3 actives" metric).
   - Recharts graphs: Workload per agent, category breakdown, monthly completion rate.

Export Engine Integration (WeasyPrint & CSV):
1. WeasyPrint PDF Worker:
   - Python script (`generate_report.py`) called via Electron `child_process.spawn`.
   - Injects the CNAS logo, executive headers, filter summaries, and clean card-derived tabular reports into a Jinja2 HTML/CSS template rendered to PDF via `weasyprint.HTML(string=html).write_pdf(target)`.
2. Native CSV Export:
   - Semicolon-delimited (`;`) UTF-8 with BOM (`\uFEFF`) export ensuring proper accents (`é`, `è`, `à`) and automatic column splitting in French versions of Excel.

Technical Specifications & Architecture:
- Electron (latest) + React 18 + TypeScript + Vite.
- IPC Security: `contextIsolation: true`, `nodeIntegration: false`, typed preload script exposing `window.electronAPI`.
- Database: Local SQLite via `better-sqlite3` (`employees`, `task_templates`, `task_assignments`) with relations, foreign keys, and indexes.
- Pre-populated with realistic French CNAS seed data (including tasks scheduled within the 3-day reminder window to demonstrate smart alerts immediately).

Deliver the complete project structure, the Python WeasyPrint script and HTML template with CNAS branding, IPC handlers, SQLite setup, Tailwind configuration for Liquid Glass cards, and all React components.

