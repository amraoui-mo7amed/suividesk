# Changelog — SuiviDesk CNAS

All notable changes to **SuiviDesk** are documented in this file.

## [1.3.0] — 2026-11-03

### Identité Visuelle & Interface (UI/UX)
- **Charte Graphique Officielle CNAS (Mode Clair Haute Contraste)** :
  - Adoption intégrale de la palette institutionnelle dérivée du logo officiel `CNAS_logo.png` (`#003A6B`, `#005A9E`, `#0068B5`, `#E3EEF9`).
  - Suppression complète du mode sombre (et verrouillage `color-scheme: light only` + `nativeTheme.themeSource = 'light'`) pour garantir une lisibilité WCAG AA/AAA parfaite même lorsque Windows est en thème sombre.
  - Suppression de la barre de menu native Windows (`File / Edit / View / Help`) pour une expérience bureautique épurée.
  - Correction des bordures arrondies (`@layer components`) sur toutes les fenêtres modales et cartes, ainsi que boutons de retour minimalistes (icône seule).
  - Ajout de la fenêtre modale **À propos** présentant les détails de l'application et le logo officiel CNAS.
  - Sélecteurs et menus déroulants rendus en portail (`CustomSelect` & `PortalDropdown`) afin de ne jamais être coupés par les conteneurs ou fenêtres modales.

### Nouveau Flux Métier (Collaborateurs & Courriers)
- **Accueil — Liste des Collaborateurs en Cartes** :
  - Affichage en grille de cartes responsives triées **par ordre alphabétique (A → Z)** par défaut.
  - Barre d'outils unifiée : Recherche instantanée, Filtres multi-critères, Tri dynamique et Exportation officielle (**PDF** via moteur natif Electron & **CSV** compatible Excel UTF-8 BOM).
  - Actions rapides par icônes sur chaque carte : **Modifier**, **Voir les détails** et **Supprimer** (avec confirmation).
  - Formulaire d'ajout/modification d'employé avec champs optionnels (`Civilité : Monsieur / Madame`, `Nom Complet` unique si renseigné, pièce jointe `PDF / DOCX / Excel`).
- **Page Collaborateur par Onglets (Onglet Tâches par défaut)** :
  - Onglet **Tâches Assignées** (ouvert par défaut) : recherche, filtres par état et priorité, cartes détaillées des courriers, modification en fenêtre modale et export PDF/CSV individuel.
  - Onglet **Détails de l'Employé** : fiche récapitulative du collaborateur et bilan chiffré des courriers (`Total`, `Traités`, `En cours`, `Non traités`).
  - Onglet **Aperçu du Document** : visionneuse intégrée hors-ligne pour les fichiers **PDF**, **Word (`.docx`)** et **Excel (`.xlsx`, `.xls`, `.csv`)**.
- **Gestion des Tâches & 69 Wilayas** :
  - Formulaire complet à 13 champs optionnels incluant la liste officielle recherchable des **69 Wilayas d'Algérie** (`01 - Adrar` à `69 - El Abiodh Sidi Cheikh`).
  - Calcul automatique et affichage de la **Durée de traitement (`Date finale − Date de début`)** exprimée strictement **en jours**.

### Distribution & Stockage
- **Installateurs Officiels Windows** : Distribution exclusivement sous forme d'installateurs (`NSIS Setup Wizard x64/arm64` avec choix du dossier d'installation et raccourcis Bureau/Menu Démarrer, ainsi que `MSI Installer x64`).
- ** Autonomie 100% Hors-Ligne** : Génération PDF native intégrée (sans dépendance externe Python/WeasyPrint) et migration transparente de la base SQLite locale.

---

## [1.2.0] — 2026-11-01
- Base de données vierge de toute donnée de test lors de l'installation.
- Configuration multi-architectures macOS & Windows.

## [1.1.0] — 2026-10-31
- Amélioration de l'enregistrement `AppUserModelId` dans la barre des tâches Windows et nouvelle icône applicative.

## [1.0.0] — 2026-10-31
- Version initiale de SuiviDesk CNAS.
