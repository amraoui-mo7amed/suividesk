#!/usr/bin/env python3
"""
CNAS SuiviDesk - WeasyPrint PDF Worker
Generates official French-formatted CNAS executive reports with high-fidelity glass/corporate styling.
"""

import sys
import json
import os
import base64
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

try:
    import weasyprint
except ImportError:
    sys.stderr.write("Erreur: weasyprint n'est pas installé dans l'environnement Python.\n")
    sys.exit(1)


def get_logo_base64():
    """Locate CNAS logo and return base64 encoded string."""
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    possible_paths = [
        project_root / "assets" / "cnas-logo.svg",
        project_root / "public" / "assets" / "cnas-logo.svg",
        script_dir / "cnas-logo.svg",
    ]
    for path in possible_paths:
        if path.exists():
            try:
                with open(path, "rb") as f:
                    return base64.b64encode(f.read()).decode("utf-8")
            except Exception as e:
                sys.stderr.write(f"Avertissement: Impossible de lire le logo: {e}\n")
    return None


def main():
    if len(sys.argv) < 3:
        sys.stderr.write("Usage: generate_report.py <input_json_file> <output_pdf_path>\n")
        sys.exit(2)

    input_json_path = sys.argv[1]
    output_pdf_path = sys.argv[2]

    try:
        with open(input_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        sys.stderr.write(f"Erreur lors de la lecture du fichier JSON: {e}\n")
        sys.exit(3)

    script_dir = Path(__file__).resolve().parent
    templates_dir = script_dir / "templates"

    env = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        autoescape=True
    )

    template = env.get_template("cnas_report.html")

    logo_b64 = get_logo_base64()

    context = {
        "report_title": data.get("report_title", "Rapport d'Activité et Suivi des Échéances"),
        "generation_date": data.get("generation_date", ""),
        "generated_by": data.get("generated_by", "Responsable CNAS"),
        "filter_summary": data.get("filter_summary", "Toutes les activités"),
        "stats": data.get("stats", {
            "total": 0,
            "approaching": 0,
            "overdue": 0,
            "in_progress": 0,
            "completion_rate": 0
        }),
        "tasks": data.get("tasks", []),
        "logo_base64": logo_b64
    }

    try:
        rendered_html = template.render(**context)
    except Exception as e:
        sys.stderr.write(f"Erreur de rendu du template Jinja2: {e}\n")
        sys.exit(4)

    # Ensure output parent directory exists
    output_dir = os.path.dirname(os.path.abspath(output_pdf_path))
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    try:
        html_doc = weasyprint.HTML(string=rendered_html, base_url=str(templates_dir))
        html_doc.write_pdf(output_pdf_path)
        print(f"SUCCÈS: PDF généré avec succès -> {output_pdf_path}")
        sys.exit(0)
    except Exception as e:
        sys.stderr.write(f"Erreur lors de la génération WeasyPrint: {e}\n")
        sys.exit(5)


if __name__ == "__main__":
    main()
