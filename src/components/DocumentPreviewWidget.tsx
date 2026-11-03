import React, { useEffect, useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  ExternalLink,
  Maximize2,
  Minimize2,
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Employee, FilePreviewResult } from '../types';

interface DocumentPreviewWidgetProps {
  employee: Employee;
  onEditEmployeeFile: () => void;
}

export const DocumentPreviewWidget: React.FC<DocumentPreviewWidgetProps> = ({
  employee,
  onEditEmployeeFile
}) => {
  const [preview, setPreview] = useState<FilePreviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let revokedUrl: string | null = null;

    const loadPreview = async () => {
      if (!employee.file_name || !window.electronAPI) {
        setPreview({ success: true, kind: 'empty' });
        setPdfBlobUrl(null);
        return;
      }

      setIsLoading(true);
      setActiveSheetIdx(0);
      try {
        const res = await window.electronAPI.getEmployeeFilePreview(employee.id);
        setPreview(res);

        if (res.success && res.kind === 'pdf' && res.base64) {
          const byteChars = atob(res.base64);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          revokedUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(revokedUrl);
        } else {
          setPdfBlobUrl(null);
        }
      } catch (err: any) {
        setPreview({ success: false, error: err.message || 'Erreur de lecture du document.' });
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [employee.id, employee.file_name, employee.file_path]);

  const handleOpenExternal = async () => {
    if (window.electronAPI) {
      await window.electronAPI.openEmployeeFileExternal(employee.id);
    }
  };

  return (
    <div className="rounded-2xl p-5 flex flex-col justify-between transition-all cnas-panel text-slate-900">
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[#B4D1EC]">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center flex-shrink-0">
            {preview?.kind === 'excel' ? (
              <FileSpreadsheet className="w-4.5 h-4.5" />
            ) : (
              <FileText className="w-4.5 h-4.5" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#003A6B]">
              Aperçu du Document (PDF / Word / Excel)
            </h2>
            <p className="text-xs font-semibold text-slate-700 truncate">
              {employee.file_name || 'Aucun document joint pour cet employé'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {employee.file_name && (
            <>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                title={isExpanded ? 'Réduire la hauteur' : 'Agrandir l’aperçu'}
                className="p-2 rounded-xl cnas-btn-secondary text-xs cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleOpenExternal}
                title="Ouvrir dans l'application externe"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl cnas-btn-secondary text-xs font-bold cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ouvrir</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onEditEmployeeFile}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cnas-btn-primary cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{employee.file_name ? 'Remplacer' : 'Joindre un document'}</span>
          </button>
        </div>
      </div>

      {/* Preview Body */}
      <div className="mt-4">
        {isLoading ? (
          <div className="h-72 flex flex-col items-center justify-center text-slate-700 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#005A9E]" />
            <span className="text-xs font-bold">Chargement de l’aperçu du document...</span>
          </div>
        ) : !preview || preview.kind === 'empty' ? (
          <div
            onClick={onEditEmployeeFile}
            className="cursor-pointer h-64 rounded-2xl border-2 border-dashed border-[#8EB4D9] hover:border-[#005A9E] bg-[#F2F8FE] flex flex-col items-center justify-center p-6 text-center transition-colors"
          >
            <FileText className="w-10 h-10 text-[#005A9E] mb-2.5" />
            <p className="text-sm font-black text-[#003A6B]">
              Aucun document joint à prévisualiser
            </p>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Cliquez ici pour associer un fichier PDF, Word (.docx) ou Excel (.xlsx / .csv)
            </p>
          </div>
        ) : !preview.success ? (
          <div className="h-56 rounded-xl bg-[#FFE4E6] border border-[#FDA4AF] flex flex-col items-center justify-center p-4 text-center text-[#881337]">
            <AlertCircle className="w-6 h-6 mb-1.5" />
            <p className="text-xs font-bold">{preview.error || 'Erreur lors de la lecture.'}</p>
          </div>
        ) : preview.kind === 'pdf' && pdfBlobUrl ? (
          <div
            className={`w-full rounded-xl overflow-hidden border-2 border-[#8EB4D9] ${
              isExpanded ? 'h-[700px]' : 'h-[500px]'
            }`}
          >
            <iframe
              src={pdfBlobUrl}
              title={employee.file_name || 'Aperçu PDF'}
              className="w-full h-full border-0 bg-white"
            />
          </div>
        ) : preview.kind === 'docx' && preview.html ? (
          <div
            className={`w-full rounded-xl overflow-y-auto p-5 border-2 bg-white border-[#8EB4D9] text-slate-900 docx-preview-content ${
              isExpanded ? 'max-h-[700px]' : 'max-h-[500px]'
            }`}
            dangerouslySetInnerHTML={{ __html: preview.html }}
          />
        ) : preview.kind === 'excel' && preview.sheets && preview.sheets.length > 0 ? (
          <div className="space-y-2.5">
            {/* Sheet Tabs */}
            {preview.sheets.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {preview.sheets.map((sheet, idx) => (
                  <button
                    key={sheet.name}
                    type="button"
                    onClick={() => setActiveSheetIdx(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      activeSheetIdx === idx
                        ? 'bg-[#005A9E] text-white'
                        : 'bg-[#DCEBFA] text-[#003A6B] hover:bg-[#C6DDF2]'
                    }`}
                  >
                    {sheet.name}
                  </button>
                ))}
              </div>
            )}

            {/* Spreadsheet Table */}
            <div
              className={`w-full overflow-auto rounded-xl border-2 border-[#8EB4D9] bg-white ${
                isExpanded ? 'max-h-[660px]' : 'max-h-[480px]'
              }`}
            >
              {preview.sheets[activeSheetIdx]?.rows?.length ? (
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    {preview.sheets[activeSheetIdx].rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={
                          rIdx === 0
                            ? 'bg-[#005A9E] text-white font-bold sticky top-0'
                            : rIdx % 2 === 0
                              ? 'bg-[#F2F8FE]'
                              : 'bg-white'
                        }
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`px-2.5 py-1.5 border whitespace-nowrap ${
                              rIdx === 0
                                ? 'border-[#004880]'
                                : 'border-slate-300 text-slate-900 font-medium'
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-xs font-semibold text-slate-600">
                  Feuille Excel vide
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-56 rounded-xl border-2 border-dashed border-[#8EB4D9] flex flex-col items-center justify-center p-4 text-center">
            <FileText className="w-8 h-8 text-[#005A9E] mb-2" />
            <p className="text-xs font-bold text-[#003A6B]">
              Aperçu direct non disponible pour ce format ({employee.file_name})
            </p>
            <button
              type="button"
              onClick={handleOpenExternal}
              className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold cnas-btn-primary cursor-pointer"
            >
              Ouvrir dans l&apos;application par défaut
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
