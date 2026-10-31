# SuiviDesk • CNAS (Caisse Nationale des Assurances Sociales)

**SuiviDesk** est une application desktop de gestion et de suivi opérationnel conçue spécifiquement pour la **CNAS** (Caisse Nationale des Assurances Sociales des Travailleurs Salariés).

Conçue avec **Electron**, **React 19**, **TypeScript**, **Tailwind CSS 4** et **SQLite**, elle intègre un système proactif d'alertes à 3 jours (J-3), une interface « Liquid Glass » (Glassmorphisme organique avec mode sombre Deep Obsidian et mode clair Frosted Alabaster), et un moteur d'exportation officiel (PDF haute fidélité via **WeasyPrint** & Jinja2, et CSV Excel natif UTF-8 avec BOM).

---

## 🏛️ Identité Visuelle & Spécificités CNAS

- **Logo Officiel CNAS** : Emblème vectoriel SVG haute résolution (`assets/cnas-logo.svg`) avec les couleurs institutionnelles :
  - Bleu Royal CNAS : `#0055A5`
  - Bleu Profond : `#0A2540`
  - Accents Cyan Lumineux : `#00A3E0`
- **Typographie et Localisation** : 100% en français (fr-FR), aligné sur les procédures internes (Bordereaux de cotisations DAS, protocoles ALD, cartes CHIFA, contrôles d'assiette, contentieux judiciaire).

---

## 🌟 Fonctionnalités Clés

### 1. 🟡 Moteur d'Alerte Proactive Intelligent (J-3)
- Analyse automatique en temps réel de la date d'échéance par rapport à l'heure actuelle :
  - 🟡 **Échéance Proche (J-3 à J-1)** : Déclenchement automatique 72h avant l'échéance. Badge ambré clignotant avec compte à rebours précis (*"Reste 3 jours"*, *"Reste 2 jours"*, *"Expire demain"*, *"Expire aujourd'hui !*).
  - 🔴 **En retard (Dépassée)** : Déclenchement dès que la date limite est expirée et que le statut est non clôturé (*"En retard de X jours"*).
  - 🔵 **Dans les temps** : Échéance supérieure à 3 jours.
  - 🟢 **Terminée** & ⛔ **Bloquée** (avec motif explicite).
- **Tiroir de notifications glissant** : Accessible via la cloche active en haut à droite, groupant automatiquement les dossiers prioritaires par collaborateur.
- **Notifications système natives Electron** : Émises dès le lancement de l'application et sur un intervalle horaire programmé.

### 2. 🪟 Interface "Liquid Glass" (Glassmorphisme Organique)
- `backdrop-filter: blur(24px)`, surfaces translucides `rgba`, liserés réactifs lumineux.
- **Bascule instantanée Dark / Light Mode** :
  - **Dark Mode (Deep Obsidian)** : Verre fumé profond, accents néon, contraste élevé.
  - **Light Mode (Frosted Alabaster)** : Panneaux dépolis cristallins, ombres pures, texte net.
- **Cartes Opérationnelles Réactives** (`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`) remplaçant les tableaux froids :
  - Pôle CNAS, priorité, intitulé, référence bordereau (`BORD-2026-REC-089`, etc.).
  - Collaborateur assigné avec matricule officiel (`MAT-10492`).
  - Barre de progression animée et compte à rebours J-3.
  - Stepper de statut en un clic (`En attente ➔ En cours ➔ Terminée / Bloquée`).

### 3. 🔍 Barre Multi-Filtres & Recherche en Direct
- Recherche instantanée par mot-clé sur l'intitulé, la référence, le matricule ou le nom du collaborateur.
- Filtres combinables : Statut, Alerte Échéance (J-3 / Retard), Pôle / Service (Recouvrement, Prestations, Contrôle Médical, Contentieux, Informatique, RH), Priorité, Collaborateur, Période.

### 4. 📊 Tableau de Bord Analytique (Recharts)
- 5 KPIs en verre : Total dossiers, 🟡 Alertes J-3 actives, 🔴 Retards critiques, Dossiers en cours, Taux d'achèvement.
- Graphiques dynamiques :
  - Charge de travail par collaborateur (Actifs vs seuils d'alertes).
  - Répartition par pôle CNAS.
  - Diagramme d'état d'avancement.

### 5. 🗃️ Modules Complémentaires
- **Catalogue des Tâches Maîtresses** : Référentiel des procédures types CNAS avec durées prescrites, priorités par défaut et possibilité d'affectation en 1 clic.
- **Annuaire des Collaborateurs** : Suivi des capacités opérationnelles individuelles (ex: 7/10 dossiers - 70%) et indicateurs d'alertes par agent.

### 6. 📄 Moteur d'Exportation Professionnel
- **Rapport PDF Officiel WeasyPrint** :
  - Script Python micro-worker (`python/generate_report.py`) avec template Jinja2 (`python/templates/cnas_report.html`).
  - Intègre l'en-tête officiel CNAS, le logo vectoriel, le résumé exécutif des KPIs, le tableau complet avec badges d'alerte, la pagination et le bloc de signature/visa de direction.
- **Export CSV Formaté pour Microsoft Excel** :
  - Séparateur point-virgule (`;`), encodage UTF-8 avec BOM (`\uFEFF`) pour la préservation parfaite des accents français (`é`, `è`, `à`) et découpage automatique des colonnes sous Excel.

---

## 🛠️ Architecture Technique

```
suividesk/
├── assets/
│   └── cnas-logo.svg           # Logo vectoriel officiel CNAS
├── electron/
│   ├── main.ts                 # Processus principal Electron + Handlers IPC typés
│   ├── preload.ts              # Script Preload sécurisé (contextIsolation: true)
│   ├── db.ts                   # Base SQLite locale WAL avec relations & seed CNAS
│   ├── alerts.ts               # Moteur de surveillance proactive J-3 & notifications
│   └── pdfWorker.ts            # Spawner Python WeasyPrint & export CSV UTF-8 BOM
├── python/
│   ├── generate_report.py      # Micro-worker Python WeasyPrint
│   └── templates/
│       └── cnas_report.html    # Gabarit Jinja2 certifié CNAS
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # Barre d'en-tête, horloge, alertes & exports
│   │   ├── Sidebar.tsx         # Navigation modulaire & sentinelle J-3
│   │   ├── FilterBar.tsx       # Filtrage dynamique multi-critères
│   │   ├── TaskCard.tsx        # Carte Liquid Glass avec stepper & glow
│   │   ├── NotificationDrawer.tsx # Tiroir latéral des alertes groupées
│   │   ├── TaskDetailModal.tsx # Consultation & mise à jour d'avancement
│   │   ├── TaskAssignModal.tsx # Affectation & planification depuis catalogue
│   │   ├── TaskEditModal.tsx   # Modification rapide d'un dossier
│   │   └── views/
│   │       ├── TaskTrackingView.tsx       # Vue opérationnelle en cartes
│   │       ├── DashboardView.tsx          # Tableau de bord analytique Recharts
│   │       ├── CatalogView.tsx            # Référentiel des tâches maîtresses
│   │       └── EmployeeDirectoryView.tsx  # Annuaire et jauges de capacité
│   ├── context/
│   │   └── ThemeContext.tsx    # Gestionnaire de thème Deep Obsidian / Frosted Alabaster
│   ├── types/
│   │   └── index.ts            # Types TypeScript stricts
│   ├── App.tsx                 # Composant racine
│   ├── index.css               # Feuilles de style Liquid Glass Tailwind v4
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 🚀 Installation & Démarrage

### 1. Prérequis
- **Node.js** (v18+) et **npm**
- **Python 3** avec l'environnement `.venv` (inclus et configuré avec `weasyprint` et `jinja2`)

### 2. Lancement en Mode Développement
Pour lancer simultanément le serveur Vite et Electron avec hot-reloading :
```bash
npm run dev
```

### 3. Compilation et Production
Pour compiler les scripts Electron et l'application React :
```bash
npm run build
npm start
```

---

## 🔒 Sécurité & Intégrité des Données
- Base de données locale autonome stockée dans le dossier utilisateur sécurisé (`userData/suividesk.sqlite`), garantissant la confidentialité des données des assurés sociaux.
- Mode `contextIsolation: true` et `nodeIntegration: false` via l'API sécurisée `window.electronAPI`.
