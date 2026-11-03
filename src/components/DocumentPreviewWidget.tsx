import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ExternalLink,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  Paperclip,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Search,
  Clock,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown
} from 'lucide-react';
import { Employee, TaskItem, TaskDocument, FilePreviewResult, formatDateFr } from '../types';

interface DocumentPreviewWidgetProps {
  employee: Employee;
  tasks: TaskItem[];
  onAddTask?: () => void;
  onEditTask?: (task: TaskItem) => void;
}

interface EnrichedTaskDoc extends TaskDocument {
  taskTitle: string;
  taskRef?: string;
  taskId: number;
}

interface DateGroupedDocs {
  dateLabel: string;
  rawDate: string;
  docs: EnrichedTaskDoc[];
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatTimeFr(isoStr?: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${mins}`;
    }
    const parts = isoStr.split(' ');
    if (parts.length >= 2 && parts[1]) {
      return parts[1].substring(0, 5);
    }
    return '';
  } catch {
    return '';
  }
}

function formatDateTimeFr(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} à ${hours}:${mins}`;
    }
    const parts = isoStr.split(' ');
    if (parts.length >= 1) {
      const dParts = parts[0].split('-');
      if (dParts.length === 3) {
        const dateFormatted = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;
        const timeFormatted = parts[1] ? ` à ${parts[1].substring(0, 5)}` : '';
        return `${dateFormatted}${timeFormatted}`;
      }
    }
    return isoStr;
  } catch {
    return isoStr;
  }
}

function getDocIcon(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-sky-600" />;
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
  }
  if (ext === 'pdf') {
    return <FileText className="w-4 h-4 text-rose-600" />;
  }
  return <FileText className="w-4 h-4 text-[#005A9E]" />;
}

export const DocumentPreviewWidget: React.FC<DocumentPreviewWidgetProps> = ({
  employee,
  tasks,
  onAddTask
}) => {
  const [search, setSearch] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [preview, setPreview] = useState<FilePreviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  // State to track collapsed date sections
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  // Collect all documents across all tasks of this employee
  const allDocs = useMemo<EnrichedTaskDoc[]>(() => {
    const list: EnrichedTaskDoc[] = [];
    for (const t of tasks) {
      if (t.documents && t.documents.length > 0) {
        for (const d of t.documents) {
          list.push({
            ...d,
            taskTitle: t.titre || `Tâche #${t.id}`,
            taskRef: t.reference_dossier || '',
            taskId: t.id
          });
        }
      }
    }
    // Sort descending by created_at / ID
    return list.sort((a, b) => {
      const dateA = a.created_at || '';
      const dateB = b.created_at || '';
      return dateB.localeCompare(dateA) || b.id - a.id;
    });
  }, [tasks]);

  // Filtered documents by search
  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allDocs;
    return allDocs.filter(
      (d) =>
        d.file_name.toLowerCase().includes(q) ||
        d.taskTitle.toLowerCase().includes(q) ||
        (d.taskRef && d.taskRef.toLowerCase().includes(q))
    );
  }, [allDocs, search]);

  // Group files of each task organized by creation date
  const groupedByDate = useMemo<DateGroupedDocs[]>(() => {
    const map = new Map<string, EnrichedTaskDoc[]>();
    for (const doc of filteredDocs) {
      const raw = doc.created_at || '';
      const dateKey = raw.split('T')[0].split(' ')[0] || 'Sans date';
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(doc);
    }

    const groups: DateGroupedDocs[] = [];
    map.forEach((docs, dateKey) => {
      groups.push({
        dateLabel: formatDateFr(dateKey),
        rawDate: dateKey,
        docs
      });
    });

    return groups.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
  }, [filteredDocs]);

  // Sync selected doc when list changes
  useEffect(() => {
    if (filteredDocs.length > 0) {
      if (!selectedDocId || !filteredDocs.some((d) => d.id === selectedDocId)) {
        const first = filteredDocs[0];
        setSelectedDocId(first.id);
        // Automatically make sure the date of the selected doc is expanded
        const raw = first.created_at || '';
        const dateKey = raw.split('T')[0].split(' ')[0] || 'Sans date';
        setCollapsedDates((prev) => ({ ...prev, [dateKey]: false }));
      }
    } else {
      setSelectedDocId(null);
      setPreview(null);
    }
  }, [filteredDocs, selectedDocId]);

  const activeDoc = useMemo(() => {
    return allDocs.find((d) => d.id === selectedDocId) || null;
  }, [allDocs, selectedDocId]);

  // Collapse / Expand helpers
  const toggleDateCollapse = (rawDate: string) => {
    setCollapsedDates((prev) => ({
      ...prev,
      [rawDate]: !prev[rawDate]
    }));
  };

  const allAreCollapsed = useMemo(() => {
    if (groupedByDate.length === 0) return false;
    return groupedByDate.every((g) => Boolean(collapsedDates[g.rawDate]));
  }, [groupedByDate, collapsedDates]);

  const toggleCollapseAll = () => {
    if (allAreCollapsed) {
      setCollapsedDates({});
    } else {
      const next: Record<string, boolean> = {};
      for (const g of groupedByDate) {
        next[g.rawDate] = true;
      }
      setCollapsedDates(next);
    }
  };

  // Load preview when selectedDocId changes
  useEffect(() => {
    let revokedUrl: string | null = null;

    const loadPreview = async () => {
      if (!selectedDocId || !window.electronAPI) {
        setPreview(null);
        setPdfBlobUrl(null);
        return;
      }

      setIsLoading(true);
      setActiveSheetIdx(0);
      setImageZoom(1);

      try {
        const res = await window.electronAPI.getTaskDocumentPreview(selectedDocId);
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
        setPreview({
          success: false,
          error: err.message || 'Erreur lors du chargement du document.'
        });
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
  }, [selectedDocId]);

  const handleOpenExternal = async () => {
    if (selectedDocId && window.electronAPI) {
      await window.electronAPI.openTaskDocumentExternal(selectedDocId);
    }
  };

  if (allDocs.length === 0) {
    return (
      <div className="rounded-3xl p-12 text-center cnas-panel text-slate-900">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center mb-4 shadow-sm">
          <Paperclip className="w-8 h-8 text-[#005A9E]" />
        </div>
        <h3 className="text-base font-black text-[#003A6B]">
          Aucun document associé aux tâches de cet employé
        </h3>
        <p className="text-xs font-medium text-slate-600 mt-1 max-w-lg mx-auto leading-relaxed">
          Chaque tâche dispose de ses propres documents (PDF, CSV, Excel, Images). Vous pouvez en
          joindre lors de l&apos;ajout ou de la modification d&apos;une tâche pour ce collaborateur.
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={onAddTask}
            className="px-5 py-2.5 rounded-xl text-xs font-bold cnas-btn-primary active:scale-95 cursor-pointer inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ajouter une Tâche avec Documents</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-slate-900">
      {/* ======================================================== */}
      {/* LEFT COLUMN: Files of each task organized by date        */}
      {/* ======================================================== */}
      <div className="lg:col-span-4 xl:col-span-4 space-y-3">
        <div className="rounded-2xl p-4 cnas-panel space-y-3 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#C6DDF2]">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-4 h-4 text-[#005A9E]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[#003A6B]">
                Documents des Tâches
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleCollapseAll}
                className="text-[11px] font-bold text-[#005A9E] hover:underline flex items-center space-x-1 cursor-pointer"
                title={allAreCollapsed ? 'Déplier toutes les dates' : 'Réduire toutes les dates'}
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
                <span>{allAreCollapsed ? 'Tout déplier' : 'Tout replier'}</span>
              </button>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DCEBFA] text-[#003A6B]">
                {allDocs.length}
              </span>
            </div>
          </div>

          {/* Search files */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#005A9E]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher fichier, tâche..."
              className="w-full pl-8.5 pr-7 py-2 rounded-xl text-xs font-semibold cnas-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Collapsible Dates Grouped List */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {groupedByDate.length === 0 ? (
              <div className="py-8 text-center text-xs font-medium text-slate-600">
                Aucun document ne correspond à votre recherche.
              </div>
            ) : (
              groupedByDate.map((group) => {
                const isCollapsed = Boolean(collapsedDates[group.rawDate]);

                return (
                  <div
                    key={group.rawDate}
                    className="rounded-xl border border-[#B4D1EC] overflow-hidden bg-white shadow-xs"
                  >
                    {/* Collapsible Date Header */}
                    <div
                      onClick={() => toggleDateCollapse(group.rawDate)}
                      className="py-2 px-3 bg-[#E2EEF9] hover:bg-[#D4E6F7] flex items-center justify-between text-[11px] font-bold text-[#003A6B] cursor-pointer transition-colors select-none"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-[#005A9E] flex-shrink-0 transition-transform" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[#005A9E] flex-shrink-0 transition-transform" />
                        )}
                        <Calendar className="w-3.5 h-3.5 text-[#005A9E] flex-shrink-0" />
                        <span className="truncate">{group.dateLabel}</span>
                      </div>

                      <span className="text-[10px] font-bold text-[#003A6B] px-2 py-0.5 rounded-full bg-white/80 border border-[#B4D1EC] flex-shrink-0">
                        {group.docs.length} fichier{group.docs.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Collapsible Body of Documents */}
                    {!isCollapsed && (
                      <div className="p-2 space-y-1.5 bg-[#FAFDFE]">
                        {group.docs.map((doc) => {
                          const isSelected = doc.id === selectedDocId;
                          const timeStr = formatTimeFr(doc.created_at);

                          return (
                            <div
                              key={doc.id}
                              onClick={() => setSelectedDocId(doc.id)}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-[#005A9E] text-white border-[#004880] shadow-md shadow-[#005A9E]/20 ring-2 ring-[#005A9E]/30'
                                  : 'bg-white text-slate-800 border-[#C6DDF2] hover:bg-[#F2F8FE] hover:border-[#005A9E]'
                              }`}
                            >
                              <div className="flex items-start space-x-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-[#EBF4FC]'
                                  }`}
                                >
                                  {getDocIcon(doc.file_name)}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`text-xs font-bold truncate ${
                                      isSelected ? 'text-white' : 'text-[#003A6B]'
                                    }`}
                                    title={doc.file_name}
                                  >
                                    {doc.file_name}
                                  </p>

                                  <p
                                    className={`text-[10px] font-semibold truncate mt-0.5 ${
                                      isSelected ? 'text-blue-100' : 'text-slate-600'
                                    }`}
                                  >
                                    Tâche : {doc.taskTitle}
                                    {doc.taskRef ? ` (${doc.taskRef})` : ''}
                                  </p>

                                  <div
                                    className={`flex items-center justify-between text-[10px] mt-1 pt-1 border-t ${
                                      isSelected
                                        ? 'border-white/20 text-blue-100'
                                        : 'border-slate-100 text-slate-500'
                                    }`}
                                  >
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{timeStr ? `À ${timeStr}` : group.dateLabel}</span>
                                    </span>
                                    {doc.file_size ? (
                                      <span>{formatFileSize(doc.file_size)}</span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: Document Preview Viewport                  */}
      {/* ======================================================== */}
      <div className="lg:col-span-8 xl:col-span-8">
        {activeDoc ? (
          <div className="rounded-2xl p-5 cnas-panel space-y-3.5 shadow-sm sticky top-20">
            {/* Header of Active Document */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#B4D1EC]">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#DCEBFA] border border-[#93C0E8] text-[#003A6B] flex items-center justify-center flex-shrink-0">
                  {getDocIcon(activeDoc.file_name)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-[#003A6B] truncate">
                    {activeDoc.file_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] font-semibold text-slate-700">
                    <span className="px-2 py-0.2 rounded-md bg-[#DCEBFA] text-[#003A6B] font-bold">
                      Tâche : {activeDoc.taskTitle}
                    </span>
                    {activeDoc.taskRef && (
                      <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 font-mono font-bold">
                        Réf : {activeDoc.taskRef}
                      </span>
                    )}
                    <span className="flex items-center space-x-1 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-[#005A9E]" />
                      <span>Téléversé le {formatDateTimeFr(activeDoc.created_at)}</span>
                    </span>
                    {activeDoc.file_size ? (
                      <span className="text-slate-600 font-medium">
                        • {formatFileSize(activeDoc.file_size)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Document */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Image Zoom Controls */}
                {preview?.kind === 'image' && (
                  <div className="flex items-center space-x-1 bg-white border border-[#93C0E8] rounded-xl p-1">
                    <button
                      type="button"
                      title="Zoom arrière"
                      onClick={() => setImageZoom((z) => Math.max(0.4, z - 0.2))}
                      className="p-1 rounded-lg text-slate-700 hover:bg-[#DCEBFA] cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-bold px-1 text-[#003A6B]">
                      {Math.round(imageZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      title="Zoom avant"
                      onClick={() => setImageZoom((z) => Math.min(3, z + 0.2))}
                      className="p-1 rounded-lg text-slate-700 hover:bg-[#DCEBFA] cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Réinitialiser le zoom"
                      onClick={() => setImageZoom(1)}
                      className="p-1 rounded-lg text-slate-700 hover:bg-[#DCEBFA] cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsExpanded((v) => !v)}
                  title={isExpanded ? 'Réduire la hauteur' : 'Agrandir la vue'}
                  className="p-2 rounded-xl cnas-btn-secondary text-xs cursor-pointer"
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenExternal}
                  title="Ouvrir dans l'application par défaut du système"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl cnas-btn-primary text-xs font-bold cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir externe</span>
                </button>
              </div>
            </div>

            {/* Preview Viewport */}
            <div className="mt-3">
              {isLoading ? (
                <div className="h-96 flex flex-col items-center justify-center text-slate-700 space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-[#005A9E]" />
                  <span className="text-xs font-bold">Chargement du document...</span>
                </div>
              ) : !preview || !preview.success ? (
                <div className="h-64 rounded-xl bg-[#FFE4E6] border border-[#FDA4AF] flex flex-col items-center justify-center p-4 text-center text-[#881337]">
                  <AlertCircle className="w-7 h-7 mb-1.5" />
                  <p className="text-xs font-bold">
                    {preview?.error || 'Erreur lors de la lecture.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenExternal}
                    className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold cnas-btn-secondary cursor-pointer"
                  >
                    Tenter l&apos;ouverture externe
                  </button>
                </div>
              ) : preview.kind === 'pdf' && pdfBlobUrl ? (
                /* PDF Viewer */
                <div
                  className={`w-full rounded-xl overflow-hidden border-2 border-[#8EB4D9] ${
                    isExpanded ? 'h-[750px]' : 'h-[580px]'
                  }`}
                >
                  <iframe
                    src={pdfBlobUrl}
                    title={activeDoc.file_name}
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              ) : preview.kind === 'image' && preview.base64 ? (
                /* Image Viewer */
                <div
                  className={`w-full rounded-xl overflow-auto border-2 border-[#8EB4D9] bg-slate-900/5 p-4 flex items-center justify-center ${
                    isExpanded ? 'h-[750px]' : 'h-[580px]'
                  }`}
                >
                  <img
                    src={preview.base64}
                    alt={activeDoc.file_name}
                    style={{
                      transform: `scale(${imageZoom})`,
                      transition: 'transform 0.15s ease-out'
                    }}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                  />
                </div>
              ) : preview.kind === 'excel' &&
                preview.sheets &&
                preview.sheets.length > 0 ? (
                /* Excel / CSV Spreadsheet Viewer */
                <div className="space-y-2.5">
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

                  <div
                    className={`w-full overflow-auto rounded-xl border-2 border-[#8EB4D9] bg-white ${
                      isExpanded ? 'max-h-[720px]' : 'max-h-[550px]'
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
                        Feuille tableur vide
                      </div>
                    )}
                  </div>
                </div>
              ) : preview.kind === 'docx' && preview.html ? (
                /* Word DOCX HTML Viewer */
                <div
                  className={`w-full rounded-xl overflow-y-auto p-5 border-2 bg-white border-[#8EB4D9] text-slate-900 docx-preview-content ${
                    isExpanded ? 'max-h-[750px]' : 'max-h-[580px]'
                  }`}
                  dangerouslySetInnerHTML={{ __html: preview.html }}
                />
              ) : (
                /* Unsupported Format Fallback */
                <div className="h-64 rounded-xl border-2 border-dashed border-[#8EB4D9] flex flex-col items-center justify-center p-4 text-center">
                  <FileText className="w-9 h-9 text-[#005A9E] mb-2" />
                  <p className="text-xs font-bold text-[#003A6B]">
                    Aperçu direct non disponible pour ce type de fichier ({activeDoc.file_name})
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 mt-1">
                    Vous pouvez l&apos;ouvrir avec l&apos;application installée par défaut sur votre
                    ordinateur.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenExternal}
                    className="mt-3 px-4 py-2 rounded-xl text-xs font-bold cnas-btn-primary cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvrir dans l&apos;application par défaut</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-12 text-center cnas-panel text-slate-900">
            <p className="text-xs font-bold text-[#003A6B]">
              Sélectionnez un document dans la colonne de gauche pour afficher son aperçu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
