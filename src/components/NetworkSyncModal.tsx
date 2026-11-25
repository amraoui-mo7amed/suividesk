import React, { useState, useEffect } from 'react';
import {
  X,
  Wifi,
  RefreshCw,
  Laptop,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Download,
  Upload,
  FileText,
  Undo2,
  Server,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';
import { SyncPeer, SyncPreviewData, SyncStatus, SyncResult, SyncRollbackResult } from '../types';

interface NetworkSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const NetworkSyncModal: React.FC<NetworkSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [peers, setPeers] = useState<SyncPeer[]>([]);
  const [manualIp, setManualIp] = useState(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('suividesk_last_pc_ip')) || '';
  });
  const [copiedIp, setCopiedIp] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'phone' | 'desktop' | 'suividesk'>('all');

  const phoneCount = peers.filter((p) => p.deviceType === 'phone').length;
  const desktopCount = peers.filter((p) => p.deviceType === 'desktop').length;
  const suiviDeskCount = peers.filter((p) => p.isSuiviDesk).length;

  const filteredPeers = peers.filter((p) => {
    if (deviceFilter === 'phone') return p.deviceType === 'phone';
    if (deviceFilter === 'desktop') return p.deviceType === 'desktop';
    if (deviceFilter === 'suividesk') return p.isSuiviDesk;
    return true;
  });

  const [selectedPeer, setSelectedPeer] = useState<{ ip: string; port: number; name?: string } | null>(null);
  const [preview, setPreview] = useState<SyncPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackResult, setRollbackResult] = useState<SyncRollbackResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  const isMobile = Boolean(typeof window !== 'undefined' && window.electronAPI?.isMobile);

  const loadStatus = async () => {
    if (!window.electronAPI) return;
    try {
      const status = await window.electronAPI.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Erreur statut synchronisation:', err);
    }
  };

  const handleScanPeers = async () => {
    if (!window.electronAPI) return;
    try {
      setIsScanning(true);
      setError(null);
      const found = await window.electronAPI.discoverLanPeers();
      setPeers(found || []);
      if (!found || found.length === 0) {
        if (!isMobile) {
          setError('Aucun autre poste SuiviDesk détecté automatiquement sur le sous-réseau.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du scan réseau.');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setError(null);
      setPreview(null);
      setSyncResult(null);
      setRollbackResult(null);
      setSelectedPeer(null);
      const savedIp = typeof localStorage !== 'undefined' ? localStorage.getItem('suividesk_last_pc_ip') : null;
      if (savedIp) setManualIp(savedIp);
      handleScanPeers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyIpToClipboard = (ip: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    }
  };

  const handleSelectPeerAndPreview = async (ip: string, port = 4850, name?: string) => {
    if (!window.electronAPI) return;
    try {
      setIsLoadingPreview(true);
      setError(null);
      setSyncResult(null);
      setSelectedPeer({ ip, port, name });

      const res = await window.electronAPI.getSyncPreview(ip, port);
      if (res.success && res.preview) {
        setPreview(res.preview);
      } else {
        setError(res.error || 'Impossible de récupérer l’aperçu de synchronisation du poste distant.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur de connexion au poste distant.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExecuteSync = async () => {
    if (!selectedPeer || !window.electronAPI) return;
    try {
      setIsSyncing(true);
      setError(null);

      const res = await window.electronAPI.executeSync(selectedPeer.ip, selectedPeer.port);
      setSyncResult(res);
      if (res.success) {
        if (onSyncComplete) onSyncComplete();
      } else {
        setError(res.error || 'Erreur lors de la synchronisation.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la synchronisation.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRollback = async () => {
    if (!window.confirm('Voulez-vous restaurer la base de données à l’état précédent cette synchronisation ?')) {
      return;
    }
    if (!window.electronAPI) return;

    try {
      setIsRollingBack(true);
      setError(null);
      const res = await window.electronAPI.rollbackSync();
      setRollbackResult(res);
      if (res.success) {
        if (onSyncComplete) onSyncComplete();
      } else {
        setError(res.error || 'Impossible de restaurer la sauvegarde précédente.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la restauration.');
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-[#9EC3E6] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#003A6B] to-[#005A9E] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight leading-snug">
                {isMobile ? 'Synchronisation Mobile ↔ PC (Wi-Fi)' : 'Synchronisation Réseau Local (PC & Mobile)'}
              </h3>
              <p className="text-[11px] text-blue-100 font-medium line-clamp-1">
                {isMobile
                  ? 'Échangez vos fiches et tâches terrain avec le poste PC bureau'
                  : 'Partage et fusion sécurisée des données en Wi-Fi / Réseau local'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-header / Local Station & IP Info */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#EEF6FC] border-b border-[#C6DDF2] flex flex-wrap items-center justify-between gap-2 text-xs text-[#003A6B]">
          <div className="flex items-center space-x-2 min-w-0">
            {isMobile ? (
              <Smartphone className="w-4 h-4 text-[#005A9E] flex-shrink-0" />
            ) : (
              <Server className="w-4 h-4 text-[#005A9E] flex-shrink-0" />
            )}
            <span className="truncate">
              Poste : <strong>{syncStatus?.workstationName || (isMobile ? 'SuiviDesk Mobile' : 'SuiviDesk-PC')}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-[#005A9E] text-white font-black text-[10px]">
              Port: {syncStatus?.port || 4850}
            </span>
          </div>
        </div>

        {/* PC Host IP helper banner (Only when on desktop PC so mobile user knows what to type) */}
        {!isMobile && syncStatus?.localIps && syncStatus.localIps.length > 0 && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-[#005A9E] tracking-wider block">
                📱 Adresse IP de ce PC pour l'application Mobile Android :
              </span>
              <span className="text-sm font-mono font-black text-[#003A6B]">
                {syncStatus.localIps[0]}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyIpToClipboard(syncStatus.localIps![0])}
              className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-[#005A9E] font-bold text-xs flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
            >
              {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIp ? 'Copié !' : 'Copier l’IP'}</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Sync Result Success Screen */}
          {syncResult?.success && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 animate-fade-in">
              <div className="flex items-center space-x-2 text-emerald-800 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Synchronisation effectuée avec succès !</span>
              </div>
              <p className="text-xs font-medium text-emerald-800">
                Toutes les modifications du poste distant ont été fusionnées dans votre base locale, et vos modifications y ont été envoyées.
              </p>
              <div className="text-xs bg-white/80 p-3 rounded-xl border border-emerald-200 space-y-1">
                <div>• Éléments synchronisés : <strong>{syncResult.appliedCount ?? 0}</strong></div>
                <div>• Conflits résolus automatiquement : <strong>{syncResult.conflictCount ?? 0}</strong></div>
                <div className="text-[11px] text-slate-500 italic">Une copie de sauvegarde automatique de sécurité a été créée avant la fusion.</div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleRollback}
                  disabled={isRollingBack}
                  className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>{isRollingBack ? 'Annulation...' : 'Annuler cette synchronisation (Rollback)'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-[#005A9E] text-white font-bold text-xs hover:bg-[#004780] cursor-pointer"
                >
                  Terminé
                </button>
              </div>
            </div>
          )}

          {/* Rollback Result Screen */}
          {rollbackResult?.success && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
              <div className="flex items-center space-x-2 font-black text-xs text-blue-800">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Restauration réussie !</span>
              </div>
              <p className="text-xs">
                La base a été restaurée à son état avant la synchronisation ({rollbackResult.backupName}).
              </p>
            </div>
          )}

          {/* Step 1: Scan and Discover Peers or Mobile Direct Connect */}
          {!syncResult?.success && !preview && (
            <div className="space-y-4">
              {/* Mobile Guidance Banner */}
              {isMobile ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EEF6FC] to-[#E3F0FB] border-2 border-[#9EC3E6] space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-black text-[#003A6B]">
                    <Smartphone className="w-4 h-4 text-[#005A9E]" />
                    <span>Liaison Mobile ↔ PC Bureau (Même Wi-Fi)</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    1. Ouvrez SuiviDesk sur votre PC de bureau et cliquez sur <strong>Synchronisation</strong>.<br />
                    2. Notez l'<strong>Adresse IP</strong> affichée dans l'encadré bleu sur l'écran du PC.<br />
                    3. Saisissez cette adresse IP ci-dessous puis appuyez sur <strong>Se connecter & Comparer</strong>.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <Wifi className="w-3.5 h-3.5 text-[#005A9E]" />
                      <span>Appareils détectés sur le réseau local ({peers.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleScanPeers}
                      disabled={isScanning}
                      className="px-3 py-1.5 rounded-xl border border-[#9EC3E6] bg-[#EEF6FC] hover:bg-[#DCEBFA] text-[#003A6B] font-bold text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                      <span>{isScanning ? 'Scan du réseau...' : 'Actualiser le scan'}</span>
                    </button>
                  </div>

                  {/* Device Category Filter Tabs */}
                  {peers.length > 0 && (
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setDeviceFilter('all')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          deviceFilter === 'all'
                            ? 'bg-[#003A6B] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Tous ({peers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeviceFilter('phone')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                          deviceFilter === 'phone'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Smartphones ({phoneCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeviceFilter('desktop')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                          deviceFilter === 'desktop'
                            ? 'bg-[#005A9E] text-white shadow-xs'
                            : 'bg-blue-50 text-[#005A9E] hover:bg-blue-100'
                        }`}
                      >
                        <Laptop className="w-3 h-3" />
                        <span>Ordinateurs ({desktopCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeviceFilter('suividesk')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                          deviceFilter === 'suividesk'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>SuiviDesk ({suiviDeskCount})</span>
                      </button>
                    </div>
                  )}

                  {filteredPeers.length > 0 ? (
                    <div className="space-y-2">
                      {filteredPeers.map((peer) => {
                        const isPhone = peer.deviceType === 'phone';
                        const isDesktop = peer.deviceType === 'desktop';
                        const isRouter = peer.deviceType === 'router';

                        return (
                          <div
                            key={peer.ip}
                            className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs ${
                              peer.isSuiviDesk
                                ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500'
                                : 'border-slate-200 hover:border-[#005A9E] bg-white'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                                  peer.isSuiviDesk
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isPhone
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : isDesktop
                                    ? 'bg-blue-100 text-[#005A9E]'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isPhone ? (
                                  <Smartphone className="w-5 h-5" />
                                ) : isRouter ? (
                                  <Wifi className="w-5 h-5" />
                                ) : (
                                  <Laptop className="w-5 h-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <span className="text-xs font-black text-[#003A6B] truncate">
                                    {peer.name || 'Appareil distant'}
                                  </span>

                                  {peer.isSuiviDesk ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                      <span>SuiviDesk Prêt</span>
                                    </span>
                                  ) : isPhone ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      📱 Smartphone
                                    </span>
                                  ) : isDesktop ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      💻 Poste PC
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      🌐 Réseau
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono mt-0.5">
                                  <span>{peer.ip}{peer.isSuiviDesk ? `:${peer.port}` : ''}</span>
                                  {peer.vendor && (
                                    <>
                                      <span>•</span>
                                      <span className="font-sans text-[10px] text-slate-400 truncate">{peer.vendor}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 self-end sm:self-auto">
                              {peer.isSuiviDesk ? (
                                <button
                                  type="button"
                                  onClick={() => handleSelectPeerAndPreview(peer.ip, peer.port, peer.name)}
                                  disabled={isLoadingPreview}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all shadow-xs"
                                >
                                  <span>Synchroniser</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setManualIp(peer.ip);
                                    handleSelectPeerAndPreview(peer.ip, 4850, peer.name);
                                  }}
                                  disabled={isLoadingPreview}
                                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:border-[#005A9E] hover:bg-blue-50 text-slate-700 hover:text-[#005A9E] font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                                  title="Utiliser l'IP de cet appareil"
                                >
                                  <span>{isPhone ? 'Associer ce mobile' : 'Associer ce poste'}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    !isScanning && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        {peers.length === 0
                          ? 'Aucun appareil détecté automatiquement sur le sous-réseau.'
                          : 'Aucun appareil ne correspond au filtre sélectionné.'}
                      </div>
                    )
                  )}
                </>
              )}

              {/* Manual IP input */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isMobile ? "Adresse IP du PC SuiviDesk (Bureau) :" : "Ou saisissez l'adresse IP manuellement :"}
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    placeholder="ex: 192.168.1.45"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#005A9E] focus:outline-none text-xs text-slate-800 font-mono"
                  />
                  <button
                    type="button"
                    disabled={!manualIp.trim() || isLoadingPreview}
                    onClick={() => handleSelectPeerAndPreview(manualIp.trim(), 4850, isMobile ? 'PC Bureau' : manualIp.trim())}
                    className="px-5 py-2.5 rounded-xl bg-[#005A9E] hover:bg-[#004780] text-white font-bold text-xs cursor-pointer disabled:opacity-40 flex items-center justify-center space-x-2"
                  >
                    {isLoadingPreview && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isLoadingPreview ? 'Connexion en cours...' : 'Se connecter & Comparer'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pre-Sync Diff & Preview Dialog */}
          {!syncResult?.success && preview && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-[#EEF6FC] border border-[#C6DDF2]">
                <div className="text-xs font-black text-[#003A6B]">
                  Aperçu avant synchronisation avec : <strong>{preview.remoteWorkstation}</strong> ({preview.remoteIp})
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Examinez les modifications détectées ci-dessous avant de confirmer l'application des changements.
                </div>
              </div>

              {/* Diff summary grids */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Incoming changes */}
                <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-800">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Modifications entrantes (de {preview.remoteWorkstation})</span>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-700">
                    <li className="flex justify-between">
                      <span>Nouveaux collaborateurs :</span>
                      <strong className="text-emerald-700">+{preview.incoming.newEmployees}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Collaborateurs mis à jour :</span>
                      <strong className="text-blue-700">~{preview.incoming.updatedEmployees}</strong>
                    </li>
                    {preview.incoming.deletedEmployees > 0 && (
                      <li className="flex justify-between">
                        <span>Collaborateurs supprimés :</span>
                        <strong className="text-red-600">-{preview.incoming.deletedEmployees}</strong>
                      </li>
                    )}
                    <li className="flex justify-between border-t pt-1 border-slate-100">
                      <span>Nouvelles tâches :</span>
                      <strong className="text-emerald-700">+{preview.incoming.newTasks}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Tâches mises à jour :</span>
                      <strong className="text-blue-700">~{preview.incoming.updatedTasks}</strong>
                    </li>
                    {preview.incoming.deletedTasks > 0 && (
                      <li className="flex justify-between">
                        <span>Tâches supprimées :</span>
                        <strong className="text-red-600">-{preview.incoming.deletedTasks}</strong>
                      </li>
                    )}
                    <li className="flex justify-between border-t pt-1 border-slate-100">
                      <span>Documents à récupérer :</span>
                      <strong className="text-indigo-700">{preview.incoming.missingDocuments.length}</strong>
                    </li>
                  </ul>
                </div>

                {/* Outgoing changes */}
                <div className="p-4 rounded-2xl bg-white border-2 border-blue-200 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-blue-800">
                    <Upload className="w-4 h-4 text-[#005A9E]" />
                    <span>Modifications sortantes (vers {preview.remoteWorkstation})</span>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-700">
                    <li className="flex justify-between">
                      <span>Nouveaux collaborateurs à envoyer :</span>
                      <strong className="text-emerald-700">+{preview.outgoing.newEmployees}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Collaborateurs modifiés à envoyer :</span>
                      <strong className="text-blue-700">~{preview.outgoing.updatedEmployees}</strong>
                    </li>
                    <li className="flex justify-between border-t pt-1 border-slate-100">
                      <span>Nouvelles tâches à envoyer :</span>
                      <strong className="text-emerald-700">+{preview.outgoing.newTasks}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Tâches modifiées à envoyer :</span>
                      <strong className="text-blue-700">~{preview.outgoing.updatedTasks}</strong>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Safety notification */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Sécurité garantie : un instantané de votre base locale sera automatiquement sauvegardé avant toute fusion.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  disabled={isSyncing}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleExecuteSync}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 rounded-xl bg-[#005A9E] hover:bg-[#004780] active:scale-98 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synchronisation en cours...' : 'Confirmer & Synchroniser'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
          <span>SuiviDesk • Synchronisation Décentralisée PC à PC</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
