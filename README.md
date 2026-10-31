# SuiviDesk

Application desktop de suivi opérationnel et de gestion des échéances pour la CNAS (Caisse Nationale des Assurances Sociales).

## Présentation

SuiviDesk permet aux services de la CNAS de planifier, d'assigner et de suivre le traitement des dossiers administratifs et contentieux avec un contrôle automatisé des délais réglementaires.

### Fonctionnalités

- **Suivi opérationnel** : Gestion des dossiers par statut (`En attente`, `En cours`, `Terminée`, `Bloquée`) et par pôle d'activité (Recouvrement, Prestations, Contrôle Médical, Contentieux, Informatique, RH).
- **Contrôle des échéances** : Calcul automatique des délais restants, alertes préventives à J-3 (72h) et détection des dépassements.
- **Tableau de bord** : Statistiques d'activité, taux d'achèvement et suivi de la charge de travail par collaborateur.
- **Catalogue de procédures** : Modèles de tâches types avec durées estimées et instructions de traitement.
- **Annuaire des collaborateurs** : Gestion des agents, matricules et capacités de traitement.
- **Exports** :
  - Rapports officiels au format PDF (générés via WeasyPrint).
  - Registre au format Excel (CSV encodé UTF-8 avec séparateur point-virgule).
- **Thème** : Support des modes sombre et clair.

## Stack technique

- **Runtime** : Electron 45
- **Frontend** : React 19, TypeScript, Tailwind CSS 4, Lucide Icons
- **Base de données** : SQLite (via `better-sqlite3`, mode WAL)
- **Moteur PDF** : Python (WeasyPrint & Jinja2)
- **Packaging** : electron-builder (NSIS & Portable pour Windows x64)

## Structure du projet

```
suividesk/
├── electron/           # Processus principal Electron, base de données et IPC
├── src/                # Application React (composants, vues, contextes)
├── python/             # Scripts et gabarits de génération PDF
├── release/            # Binaires de distribution générés
├── electron-builder.json
├── package.json
└── vite.config.ts
```

## Démarrage rapide

### Prérequis

- Node.js (version 20 ou supérieure recommandée)
- npm
- Python 3 (avec l'environnement virtuel `.venv` configuré pour WeasyPrint)

### Installation

```bash
npm install
```

### Développement

Lancer l'application en mode développement :

```bash
npm run dev
```

### Compilation

Générer les fichiers de production pour Electron et le frontend :

```bash
npm run build
```

Pour lancer la version compilée en local :

```bash
npm start
```

### Génération de l'exécutable Windows

Pour créer l'installateur NSIS et la version portable pour Windows :

```bash
npm run package:win
```

Les fichiers exécutables sont générés dans le dossier `release/` :
- `SuiviDesk Setup 1.0.0.exe` (installateur NSIS)
- `SuiviDesk 1.0.0.exe` (exécutable portable)

## Stockage des données

Les données sont enregistrées localement dans une base SQLite stockée dans le répertoire de données de l'application :
- **macOS** : `~/Library/Application Support/suividesk/suividesk.sqlite`
- **Windows** : `%APPDATA%/suividesk/suividesk.sqlite`
- **Linux** : `~/.config/suividesk/suividesk.sqlite`

## Licence

Usage interne CNAS.
