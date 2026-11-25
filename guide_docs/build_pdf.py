import os
import subprocess
import base64
from pathlib import Path
import fitz
import shutil

GUIDE_DIR = Path(r"C:\Users\Mohamed\github\suividesk\guide_docs")
ASSETS_DIR = GUIDE_DIR / "assets"
LOGO_PATH = ASSETS_DIR / "CNAS_logo.png"

def to_b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

logo_b64 = to_b64(LOGO_PATH)
step1_b64 = to_b64(GUIDE_DIR / "step1_navbar.png")
step2_b64 = to_b64(GUIDE_DIR / "step2_modal.png")
step3_b64 = to_b64(GUIDE_DIR / "step3_dialog.png")
step4_b64 = to_b64(GUIDE_DIR / "step4_restore.png")
step5_b64 = to_b64(GUIDE_DIR / "step5_workflow.png")

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
OUTPUT_PDF = Path(r"C:\Users\Mohamed\github\suividesk\Guide_Export_Import_Base_Donnees_SuiviDesk.pdf")
DESKTOP_PDF = Path(r"C:\Users\Mohamed\Desktop\Guide_Export_Import_Base_Donnees_SuiviDesk.pdf")

# Read template HTML
template_path = GUIDE_DIR / "template.html"
with open(template_path, "r", encoding="utf-8") as f:
    tpl = f.read()

html_content = (
    tpl.replace("{{logo_b64}}", logo_b64)
       .replace("{{step1_b64}}", step1_b64)
       .replace("{{step2_b64}}", step2_b64)
       .replace("{{step3_b64}}", step3_b64)
       .replace("{{step4_b64}}", step4_b64)
       .replace("{{step5_b64}}", step5_b64)
)

final_html = GUIDE_DIR / "guide_final.html"
with open(final_html, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML guide written to {final_html}")

cmd = [
    EDGE_PATH,
    "--headless=new",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={OUTPUT_PDF}",
    final_html.as_uri()
]

subprocess.run(cmd, check=True)
print(f"PDF successfully generated at: {OUTPUT_PDF}")

shutil.copyfile(OUTPUT_PDF, DESKTOP_PDF)
print(f"PDF also copied to Desktop: {DESKTOP_PDF}")

doc = fitz.open(OUTPUT_PDF)
print(f"Total pages: {len(doc)}")
for i, page in enumerate(doc):
    print(f"Page {i+1} rect: {page.rect}")
doc.close()
