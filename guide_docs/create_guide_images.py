import os
import subprocess
import base64
from pathlib import Path

GUIDE_DIR = Path(r"C:\Users\Mohamed\github\suividesk\guide_docs")
ASSETS_DIR = GUIDE_DIR / "assets"
LOGO_PATH = ASSETS_DIR / "CNAS_logo.png"

with open(LOGO_PATH, "rb") as f:
    logo_b64 = base64.b64encode(f.read()).decode("utf-8")

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def take_screenshot(html_content, output_png, width=950, height=450):
    temp_html = GUIDE_DIR / f"temp_{Path(output_png).stem}.html"
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--disable-gpu",
        f"--window-size={width},{height}",
        f"--screenshot={output_png}",
        temp_html.as_uri()
    ]
    subprocess.run(cmd, check=True)
    if temp_html.exists():
        temp_html.unlink()
    print(f"Generated: {output_png}")

# ==========================================
# 1. NAVBAR SCREENSHOT WITH CALLOUT
# ==========================================
html_nav = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }}
  body {{ background: #f8fafc; padding: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; }}
  .card-container {{
    width: 900px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 10px 25px -5px rgba(0, 58, 107, 0.15), 0 8px 10px -6px rgba(0, 58, 107, 0.1);
    border: 2px solid #9EC3E6;
    overflow: visible;
    position: relative;
  }}
  .navbar {{
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: #ffffff;
    border-radius: 14px;
  }}
  .brand {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}
  .brand-logo {{
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid #9EC3E6;
    padding: 2px;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }}
  .brand-title {{
    font-size: 17px;
    font-weight: 900;
    color: #003A6B;
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .badge-cnas {{
    background: #005A9E;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 5px;
  }}
  .brand-sub {{
    font-size: 11px;
    color: #475569;
    font-weight: 600;
  }}
  .nav-tabs {{
    display: flex;
    background: #EEF6FC;
    border: 1px solid #C6DDF2;
    padding: 4px;
    border-radius: 12px;
    gap: 6px;
  }}
  .nav-tab {{
    padding: 7px 16px;
    font-size: 12px;
    font-weight: 700;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #003A6B;
  }}
  .nav-tab.active {{
    background: #005A9E;
    color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 90, 158, 0.25);
  }}
  .btn-about {{
    display: flex;
    align-items: center;
    gap: 7px;
    background: #EEF6FC;
    border: 2px solid #005A9E;
    color: #003A6B;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 800;
    position: relative;
    box-shadow: 0 0 0 4px rgba(0, 90, 158, 0.15);
  }}
  /* Callout badge */
  .callout-box {{
    position: absolute;
    top: 76px;
    right: 20px;
    background: #DC2626;
    color: white;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 8px 16px rgba(220, 38, 38, 0.35);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 10;
  }}
  .callout-arrow {{
    position: absolute;
    top: -8px;
    right: 45px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid #DC2626;
  }}
  .icon-svg {{
    width: 16px;
    height: 16px;
  }}
</style>
</head>
<body>
  <div class="card-container">
    <div class="navbar">
      <div class="brand">
        <img class="brand-logo" src="data:image/png;base64,{logo_b64}" alt="CNAS">
        <div>
          <div class="brand-title">SuiviDesk <span class="badge-cnas">CNAS</span></div>
          <div class="brand-sub">Système de Suivi Opérationnel & Échéances</div>
        </div>
      </div>

      <div class="nav-tabs">
        <div class="nav-tab active">
          <svg class="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          Tableau de Bord
        </div>
        <div class="nav-tab">
          <svg class="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M9 14h6"/><path d="M9 18h6"/></svg>
          Tableau de Suivi
        </div>
      </div>

      <div class="btn-about">
        <svg class="icon-svg" style="color: #005A9E;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        À propos
      </div>
    </div>

    <div class="callout-box">
      <div class="callout-arrow"></div>
      <span style="background: white; color: #DC2626; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900;">1</span>
      <span><strong>Étape 1 :</strong> Cliquez sur <strong>« À propos »</strong> en haut à droite</span>
    </div>
  </div>
</body>
</html>"""

# ==========================================
# 2. ABOUT MODAL SCREENSHOT WITH BACKUP EMPHASIS
# ==========================================
html_modal = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }}
  body {{ background: rgba(15, 23, 42, 0.7); padding: 25px; display: flex; align-items: center; justify-content: center; }}
  .modal-card {{
    width: 520px;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 58, 107, 0.45);
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(0, 58, 107, 0.2);
  }}
  .modal-header {{
    background: linear-gradient(135deg, #003A6B 0%, #005A9E 50%, #0077C2 100%);
    padding: 24px 20px 20px;
    color: white;
    text-align: center;
    position: relative;
  }}
  .logo-box {{
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: white;
    padding: 6px;
    margin: 0 auto 10px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.25);
    border: 4px solid rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .logo-img {{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }}
  .app-name {{
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.3px;
  }}
  .app-inst {{
    font-size: 11px;
    color: #E0F2FE;
    font-weight: 600;
    margin-top: 2px;
  }}
  .app-ar {{
    font-size: 12px;
    font-weight: 700;
    margin-top: 3px;
    color: #ffffff;
  }}
  .app-ver {{
    display: inline-block;
    margin-top: 8px;
    background: rgba(255, 255, 255, 0.2);
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 700;
  }}
  .modal-body {{
    padding: 20px;
  }}
  .intro-text {{
    font-size: 11.5px;
    color: #334155;
    line-height: 1.5;
    text-align: center;
    margin-bottom: 14px;
  }}
  .backup-card {{
    background: #F2F8FE;
    border: 2px solid #005A9E;
    border-radius: 16px;
    padding: 16px;
    position: relative;
  }}
  .card-title {{
    font-size: 12.5px;
    font-weight: 800;
    color: #003A6B;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }}
  .card-desc {{
    font-size: 11px;
    color: #475569;
    line-height: 1.45;
    margin-bottom: 12px;
  }}
  .btn-row {{
    display: flex;
    gap: 10px;
  }}
  .btn-primary {{
    flex: 1;
    background: #005A9E;
    color: white;
    border: none;
    padding: 9px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 0 4px 10px rgba(0, 90, 158, 0.3);
    outline: 3px solid #DC2626;
  }}
  .btn-secondary {{
    background: white;
    color: #003A6B;
    border: 1.5px solid #C6DDF2;
    padding: 9px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }}
  /* Callout pointer */
  .callout-badge {{
    position: absolute;
    bottom: -15px;
    left: 25px;
    background: #DC2626;
    color: white;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 800;
    box-shadow: 0 4px 10px rgba(220, 38, 38, 0.4);
    display: flex;
    align-items: center;
    gap: 6px;
  }}
</style>
</head>
<body>
  <div class="modal-card">
    <div class="modal-header">
      <div class="logo-box">
        <img class="logo-img" src="data:image/png;base64,{logo_b64}" alt="CNAS">
      </div>
      <div class="app-name">SuiviDesk — CNAS</div>
      <div class="app-inst">Caisse Nationale des Assurances Sociales des Travailleurs Salariés</div>
      <div class="app-ar" dir="rtl">الصندوق الوطني للتأمينات الإجتماعية للعمال الأجراء</div>
      <div class="app-ver">Version 1.4.0 • Édition Desktop</div>
    </div>

    <div class="modal-body">
      <div class="intro-text">
        <strong>SuiviDesk</strong> est l'application bureautique officielle de la CNAS dédiée au suivi des collaborateurs, des courriers administratifs et des échéances de traitement.
      </div>

      <div class="backup-card">
        <div class="card-title">
          <svg style="width:16px;height:16px;color:#005A9E;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
          Sauvegarde & Sécurité des Données
        </div>
        <div class="card-desc">
          Vos données sont stockées localement en toute sécurité. Les mises à jour de l'application ne suppriment jamais votre base. Vous pouvez également exporter une sauvegarde à tout moment :
        </div>

        <div class="btn-row">
          <div class="btn-primary">
            <svg style="width:15px;height:15px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Sauvegarder la base
          </div>
          <div class="btn-secondary">
            <svg style="width:15px;height:15px;color:#005A9E;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Restaurer
          </div>
        </div>

        <div class="callout-badge">
          <span>➔ Étape 2A : Cliquez ici pour Exporter la base SQLite</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""

# ==========================================
# 3. WINDOWS SAVE DIALOG + SUCCESS ALERT
# ==========================================
html_save_dialog = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }}
  body {{ background: #f1f5f9; padding: 25px; display: flex; flex-direction: column; align-items: center; gap: 18px; }}
  .dialog-window {{
    width: 780px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.18);
    border: 1px solid #cbd5e1;
    overflow: hidden;
  }}
  .dialog-titlebar {{
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 10px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
  }}
  .dialog-body {{
    padding: 18px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }}
  .path-bar {{
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
    color: #334155;
  }}
  .field-row {{
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 12.5px;
    color: #1e293b;
  }}
  .field-label {{
    width: 140px;
    font-weight: 600;
    text-align: right;
  }}
  .field-input {{
    flex: 1;
    border: 1.5px solid #005A9E;
    background: #ffffff;
    border-radius: 6px;
    padding: 7px 12px;
    font-size: 12.5px;
    font-family: monospace;
    font-weight: 700;
    color: #003A6B;
    box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.15);
  }}
  .dialog-footer {{
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 12px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }}
  .btn-save {{
    background: #005A9E;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 7px 24px;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(0, 90, 158, 0.3);
  }}
  .btn-cancel {{
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 7px 20px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
  }}
  /* Success Notification */
  .success-banner {{
    width: 780px;
    background: #ECFDF5;
    border: 2px solid #10B981;
    border-radius: 12px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  }}
  .success-icon {{
    width: 28px;
    height: 28px;
    background: #10B981;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 900;
    flex-shrink: 0;
  }}
  .success-text {{
    font-size: 13px;
    font-weight: 700;
    color: #065F46;
  }}
  .success-sub {{
    font-size: 11.5px;
    color: #047857;
    margin-top: 2px;
  }}
</style>
</head>
<body>
  <div class="dialog-window">
    <div class="dialog-titlebar">
      <span>Sauvegarder la base de données</span>
      <span style="color:#94a3b8;cursor:pointer;">✕</span>
    </div>
    <div class="dialog-body">
      <div class="path-bar">
        📁 Ce PC &gt; Documents &gt; <strong>Sauvegardes CNAS</strong>
      </div>
      <div class="field-row">
        <div class="field-label">Nom du fichier :</div>
        <input class="field-input" type="text" value="CNAS_SuiviDesk_Backup_2026-11-16.sqlite" readonly>
      </div>
      <div class="field-row">
        <div class="field-label">Type :</div>
        <div style="flex:1;font-size:12px;color:#475569;background:#f8fafc;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;">
          Base SQLite (*.sqlite, *.db)
        </div>
      </div>
    </div>
    <div class="dialog-footer">
      <div class="btn-save">Enregistrer</div>
      <div class="btn-cancel">Annuler</div>
    </div>
  </div>

  <div class="success-banner">
    <div class="success-icon">✓</div>
    <div>
      <div class="success-text">Base de données sauvegardée avec succès !</div>
      <div class="success-sub">Le fichier complet contient tous vos collaborateurs, courriers et historique de traitement.</div>
    </div>
  </div>
</body>
</html>"""

# ==========================================
# 4. RESTORATION & SECURITY BACKUP WORKFLOW
# ==========================================
html_restore_flow = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }}
  body {{ background: #f8fafc; padding: 25px; display: flex; flex-direction: column; align-items: center; gap: 16px; }}
  .restore-card {{
    width: 780px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 58, 107, 0.1);
    border: 1.5px solid #C6DDF2;
    overflow: hidden;
  }}
  .restore-header {{
    background: #EEF6FC;
    border-bottom: 1.5px solid #C6DDF2;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 800;
    color: #003A6B;
  }}
  .restore-body {{
    padding: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }}
  .step-box {{
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 16px;
    position: relative;
  }}
  .step-num {{
    width: 26px;
    height: 26px;
    background: #005A9E;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 8px;
  }}
  .step-title {{
    font-size: 13px;
    font-weight: 700;
    color: #003A6B;
    margin-bottom: 6px;
  }}
  .step-desc {{
    font-size: 11.5px;
    color: #475569;
    line-height: 1.45;
  }}
  .alert-warning {{
    background: #FEF3C7;
    border: 1px solid #F59E0B;
    border-radius: 8px;
    padding: 8px 12px;
    margin-top: 8px;
    font-size: 10.5px;
    color: #92400E;
    font-weight: 600;
  }}
  .security-feature {{
    grid-column: span 2;
    background: #EFF6FF;
    border: 1.5px dashed #005A9E;
    border-radius: 12px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
  }}
  .shield-icon {{
    width: 36px;
    height: 36px;
    background: #005A9E;
    color: white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }}
  .sec-title {{
    font-size: 12.5px;
    font-weight: 800;
    color: #003A6B;
  }}
  .sec-desc {{
    font-size: 11px;
    color: #334155;
    margin-top: 2px;
    line-height: 1.4;
  }}
</style>
</head>
<body>
  <div class="restore-card">
    <div class="restore-header">
      <svg style="width:20px;height:20px;color:#005A9E;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <span>Procédure de Restauration & Importation Sécurisée</span>
    </div>

    <div class="restore-body">
      <div class="step-box">
        <div class="step-num">1</div>
        <div class="step-title">Confirmation Préalable</div>
        <div class="step-desc">
          En cliquant sur « Restaurer », l'application demande confirmation pour éviter tout écrasement accidentel.
        </div>
        <div class="alert-warning">
          ⚠️ <em>« ATTENTION: La restauration va remplacer la base actuelle. Voulez-vous continuer ? »</em>
        </div>
      </div>

      <div class="step-box">
        <div class="step-num">2</div>
        <div class="step-title">Sélection du Fichier SQLite</div>
        <div class="step-desc">
          L'explorateur Windows s'ouvre : sélectionnez votre fichier de sauvegarde <strong>.sqlite</strong> ou <strong>.db</strong>.
        </div>
        <div style="background:#EEF6FC;border:1px solid #9EC3E6;border-radius:8px;padding:8px 12px;margin-top:8px;font-size:10.5px;color:#003A6B;font-weight:700;">
          📁 CNAS_SuiviDesk_Backup_2026-11-16.sqlite
        </div>
      </div>

      <div class="security-feature">
        <div class="shield-icon">🛡️</div>
        <div>
          <div class="sec-title">Protection Exclusive SuiviDesk : Copie de Secours Automatique</div>
          <div class="sec-desc">
            Avant d'écraser la base actuelle, le moteur SuiviDesk crée <strong>instantanément et automatiquement</strong> un fichier de secours <code>suividesk_pre_restore_[date].sqlite</code> dans votre dossier de données. Aucune perte accidentelle n'est possible !
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""

# ==========================================
# 5. WORKFLOW INFOGRAPHIC DIAGRAM
# ==========================================
html_workflow = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }}
  body {{ background: #ffffff; padding: 20px; display: flex; justify-content: center; align-items: center; }}
  .infographic {{
    width: 880px;
    background: linear-gradient(to right, #F8FAFD, #F0F6FC);
    border: 2px solid #C6DDF2;
    border-radius: 20px;
    padding: 24px 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }}
  .node {{
    width: 220px;
    background: #ffffff;
    border-radius: 14px;
    padding: 16px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0, 58, 107, 0.08);
    border: 1.5px solid #9EC3E6;
    position: relative;
    z-index: 2;
  }}
  .node-icon {{
    width: 44px;
    height: 44px;
    border-radius: 50%;
    margin: 0 auto 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }}
  .icon-db {{ background: #E0F2FE; color: #005A9E; border: 2px solid #005A9E; }}
  .icon-file {{ background: #FEF3C7; color: #D97706; border: 2px solid #D97706; }}
  .icon-safe {{ background: #DCFCE7; color: #16A34A; border: 2px solid #16A34A; }}

  .node-title {{
    font-size: 13px;
    font-weight: 800;
    color: #003A6B;
    margin-bottom: 4px;
  }}
  .node-desc {{
    font-size: 10.5px;
    color: #475569;
    line-height: 1.4;
  }}
  .arrow-flow {{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 80px;
    z-index: 2;
  }}
  .arrow-tag {{
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 3px 8px;
    border-radius: 6px;
  }}
  .tag-export {{ background: #005A9E; color: white; }}
  .tag-import {{ background: #059669; color: white; }}
  .arrow-symbol {{
    font-size: 20px;
    font-weight: 900;
    color: #005A9E;
  }}
</style>
</head>
<body>
  <div class="infographic">
    <!-- Node 1 -->
    <div class="node">
      <div class="node-icon icon-db">🗄️</div>
      <div class="node-title">Base SuiviDesk Active</div>
      <div class="node-desc">
        <code>suividesk.sqlite</code> stockée en local sous Windows AppData.
      </div>
    </div>

    <!-- Arrow 1 -->
    <div class="arrow-flow">
      <div class="arrow-tag tag-export">Export</div>
      <div class="arrow-symbol">➔</div>
    </div>

    <!-- Node 2 -->
    <div class="node">
      <div class="node-icon icon-file">📦</div>
      <div class="node-title">Fichier de Sauvegarde</div>
      <div class="node-desc">
        Format <code>.sqlite</code> autonome et horodaté, prêt à être archivé.
      </div>
    </div>

    <!-- Arrow 2 -->
    <div class="arrow-flow">
      <div class="arrow-tag tag-import">Import</div>
      <div class="arrow-symbol">➔</div>
    </div>

    <!-- Node 3 -->
    <div class="node">
      <div class="node-icon icon-safe">💻</div>
      <div class="node-title">Restauration & Sécurité</div>
      <div class="node-desc">
        Sauvegarde préalable automatique puis réactualisation immédiate.
      </div>
    </div>
  </div>
</body>
</html>"""

take_screenshot(html_nav, GUIDE_DIR / "step1_navbar.png", width=950, height=190)
take_screenshot(html_modal, GUIDE_DIR / "step2_modal.png", width=570, height=530)
take_screenshot(html_save_dialog, GUIDE_DIR / "step3_dialog.png", width=840, height=310)
take_screenshot(html_restore_flow, GUIDE_DIR / "step4_restore.png", width=840, height=360)
take_screenshot(html_workflow, GUIDE_DIR / "step5_workflow.png", width=930, height=210)
print("All images generated successfully!")
