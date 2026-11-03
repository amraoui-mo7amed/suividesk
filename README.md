# SuiviDesk — CNAS (v1.3.0)

Application bureautique native de suivi des collaborateurs, de gestion des courriers et de contrôle des délais de traitement pour la **CNAS** (*Caisse Nationale des Assurances Sociales des Travailleurs Salariés*).

## Nouveautés Majeures (v1.3.0)

- **Identité Visuelle CNAS Haute Contraste** : Interface claire institutionnelle inspirée du logo officiel `CNAS_logo.png`, sans barre de menu système superflue, avec fenêtre **À propos** dédiée.
- **Répertoire des Collaborateurs en Cartes** : Tri alphabétique (`A → Z`) par défaut, recherche instantanée, filtres avancés, exports **PDF** & **CSV (Excel)** et actions rapides par icônes (*Modifier*, *Voir détails*, *Supprimer avec confirmation*).
- **Dossier Collaborateur par Onglets** :
  1. **Tâches Assignées** *(onglet par défaut)* : Cartes de suivi affichant automatiquement la **Durée de traitement (`Date finale − Date de début`) en jours**, recherche/filtres et modification en modale.
  2. **Détails de l'Employé** : Profil complet et bilan statistique (`Total`, `Traités`, `En cours`, `Non traités`).
  3. **Aperçu du Document** : Prévisualisation intégrée hors-ligne des fichiers **PDF**, **Word (`.docx`)** et **Excel (`.xlsx`, `.xls`, `.csv`)**.
- **69 Wilayas d'Algérie & Champs Optionnels** : Tous les champs des formulaires sont optionnels (unicité garantie sur le nom complet lorsqu'il est renseigné) avec sélecteur recherchable des **69 Wilayas** (`01 - Adrar` → `69 - El Abiodh Sidi Cheikh`) et menus déroulants en portail sans débordement coupé.
- **100% Autonome & Hors-Ligne** : Base SQLite locale et moteur d'export PDF natif intégré (aucune installation Python requise).

## Stack Technique

- **Runtime Desktop** : Electron 45
- **Frontend** : React 19, TypeScript, Tailwind CSS 4, Lucide Icons
- **Base de données** : SQLite locale (`%APPDATA%/suividesk/suividesk.sqlite`)
- **Aperçu Documents** : PDF natif, `mammoth` (DOCX), `xlsx` (Excel/CSV)
- **Packaging Installable** : `electron-builder` — Installateurs **NSIS Setup** (`x64` / `arm64`) et **MSI** (`x64`)

## Développement & Compilation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement (ou double-cliquer sur dev.bat sous Windows)
npm run dev

# Compiler le code TypeScript / Vite / Electron
npm run build

# Générer les installateurs Windows dans release/
npm run package:win
```

Voir [CHANGELOG.md](./CHANGELOG.md) pour le détail complet des versions.

## Licence

Usage interne CNAS — Tous droits réservés.
