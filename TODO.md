# SuiviDesk — Roadmap & Feature Specifications

---

## 🔒 1. Application Password Lock (App Lock)

Secure local access to confidential dossiers, staff records, and administrative mail tracking with a user-chosen password or PIN.

- [x] **Password Configuration & Management**
  - [x] Settings interface (accessible via Settings / About) to configure a master password or PIN.
  - [x] Secure password storage using salted hashing (PBKDF2 / SHA-256 with unique salt) in the local SQLite configuration table.
  - [x] Ability to change the existing password (requiring current password verification).
  - [x] Option to disable password lock (requiring current password verification).

- [x] **Lock Screen Overlay**
  - [x] Display an immersive lock screen with official CNAS branding upon app launch whenever a password is configured.
  - [x] Completely mask and protect background data until a valid password is entered.
  - [x] Clear error feedback with animation on invalid attempts and rate-limiting to prevent brute-force attacks.

- [x] **Manual & Automatic Locking**
  - [x] Quick-lock button in the top navigation bar (`Navbar`) to instantly lock the workstation when stepping away.
  - [x] Dedicated keyboard shortcut (e.g., `Ctrl + L`).
  - [x] Configurable auto-lock on inactivity timer (e.g., 5 min, 15 min, 30 min, Never).

---

## 🔄 2. Local Network Synchronization (PC ↔ PC)

Enable on-demand data and document synchronization between multiple SuiviDesk workstations across the local office network (LAN / Wi-Fi) without requiring any external cloud server.

### A. User Permission & Explicit Consent (100% Manual — No Automatic Sync)
- [x] **No silent or automatic background sync**: Every data exchange must be explicitly initiated and approved by the user.
- [x] **Dedicated UI button**: Add a "Network Sync" button in the top navigation bar.
- [x] **Workstation Authorization Prompt**: Show a pairing confirmation modal when another PC attempts to connect (e.g., *"💻 Workstation detected: Bureau-Direction (192.168.1.45). Authorize connection?"*).
- [x] **Pre-Sync Diff & Preview Dialog**:
  - Display a clear summary before applying any changes:
    - Number of new dossiers/tasks to import from the remote PC.
    - Number of modifications to apply (with field-level change details).
    - Number of deletions to propagate.
    - List of attached document files / scans to transfer.
  - Explicit action buttons: `[ Cancel ]` or `[ Confirm & Sync ]`.

### B. Legacy Data Migration & Retrocompatibility (v1.0 – v1.4)
- [x] **Non-destructive database schema migration (`electron/db.ts`)**:
  - Keep all existing integer IDs (`id: 1, 2, 3...`) and foreign key relationships (`agent_id`, `task_id`) 100% intact.
  - Add sync metadata columns non-destructively:
    - `sync_uuid TEXT DEFAULT ''` on `employees`, `task_assignments`, and `task_documents`.
    - `updated_at DATETIME` and `is_deleted INTEGER DEFAULT 0` on all tables.
  - Automatically generate and retroactively assign a unique **UUID v4** to every pre-existing record that lacks one during the first launch of the updated version.
  - Guarantee zero data loss and 100% compatibility with older database files.

### C. Smart Two-Way Merge Engine (Delta Sync & Conflict Resolution)
- [x] **Incremental Delta Exchange**: Only rows created, updated, or deleted since the last synchronization timestamp (`last_synced_at`) are transmitted between PCs.
- [x] **Smart Conflict Resolution**:
  - *Field-level merge*: If PC-1 updated the task status and PC-2 changed the wilaya on the same task, both edits merge cleanly without conflict.
  - *Last-Write-Wins (LWW)*: If the exact same field was modified concurrently on both PCs, the version with the newer timestamp (`updated_at`) prevails.
  - *Conflict Audit Log (`sync_conflicts`)*: Automatically archive overwritten versions for review and single-click restoration if needed.
- [x] **Soft Deletes**: Deletions are flagged as `is_deleted = 1` with a deletion timestamp, ensuring deleted records never reappear after synchronization.

### D. Document & Attachment File Streaming
- [x] Hash-based comparison against local storage (`%APPDATA%\suividesk\employee_files\`).
- [x] Stream missing binary files (`.pdf`, `.docx`, `.xlsx`, `.csv`) directly between PCs over the local HTTP/WebSocket connection.
- [x] Verify file integrity using SHA-256 checksums following transfer.

### E. Safety Net & Pre-Sync Auto-Backup
- [x] **Automatic Snapshot**: Create an instantaneous database backup right before any sync begins (`%APPDATA%\suividesk\backups\suividesk_pre_sync_[timestamp].sqlite`).
- [x] **Single-Click Rollback**: Provide a "Revert Sync" button to instantly restore the database to its pre-sync state in case of user error.
