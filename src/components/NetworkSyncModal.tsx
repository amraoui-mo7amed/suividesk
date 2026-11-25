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
  Server
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
  const [manualIp, setManualIp] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const [selectedPeer, setSelectedPeer] = useState<{ ip: string; port: number; name?: string } | null>(null);
  const [preview, setPreview] = useState<SyncPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackResult, setRollbackResult] = useState<SyncRollbackResult | null>(null);

  const [error, setError] = useState<string | null>(null);

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
        setError('Aucun autre poste SuiviDesk détecté sur ce réseau local. Assurez-vous que l’application est ouverte sur l’autre PC.');
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
      handleScanPeers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        <div className="px-6 py-4 bg-gradient-to-r from-[#003A6B] to-[#005A9E] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-snug">
                Synchronisation Réseau Local (PC à PC)
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Partage et fusion manuelle des données en Wi-Fi / Réseau d'entreprise
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-header / Local Station Info */}
        <div className="px-6 py-3 bg-[#EEF6FC] border-b border-[#C6DDF2] flex items-center justify-between text-xs text-[#003A6B]">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-[#005A9E]" />
            <span>
              Poste actuel : <strong>{syncStatus?.workstationName || 'SuiviDesk-PC'}</strong> (Port: {syncStatus?.port || 4850})
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-[#005A9E] text-white font-black text-[10px]">
            Mode Manuel
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
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

          {/* Step 1: Scan and Discover Peers */}
          {!syncResult?.success && !preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                  <Wifi className="w-3.5 h-3.5 text-[#005A9E]" />
                  <span>Postes disponibles sur le réseau</span>
                </h4>
                <button
                  type="button"
                  onClick={handleScanPeers}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-xl border border-[#9EC3E6] bg-[#EEF6FC] hover:bg-[#DCEBFA] text-[#003A6B] font-bold text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Recherche...' : 'Actualiser'}</span>
                </button>
              </div>

              {peers.length > 0 ? (
                <div className="space-y-2">
                  {peers.map((peer) => (
                    <div
                      key={peer.ip}
                      className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-[#005A9E] bg-white transition-all flex items-center justify-between group shadow-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-[#EEF6FC] text-[#005A9E] flex items-center justify-center font-bold">
                          <Laptop className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#003A6B]">{peer.name || 'Poste distant'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {peer.ip}:{peer.port}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectPeerAndPreview(peer.ip, peer.port, peer.name)}
                        disabled={isLoadingPreview}
                        className="px-4 py-2 rounded-xl bg-[#005A9E] hover:bg-[#004780] text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all shadow-xs"
                      >
                        <span>Comparer & Prévisualiser</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                !isScanning && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    Aucun poste SuiviDesk détecté automatiquement sur le sous-réseau.
                  </div>
                )
              )}

              {/* Manual IP input */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ou saisissez l'adresse IP de l'autre PC manuellement :
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    placeholder="ex: 192.168.1.45"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#005A9E] focus:outline-none text-xs text-slate-800 font-mono"
                  />
                  <button
                    type="button"
                    disabled={!manualIp.trim() || isLoadingPreview}
                    onClick={() => handleSelectPeerAndPreview(manualIp.trim(), 4850, manualIp.trim())}
                    className="px-4 py-2 rounded-xl bg-[#005A9E] hover:bg-[#004780] text-white font-bold text-xs cursor-pointer disabled:opacity-40"
                  >
                    {isLoadingPreview ? 'Connexion...' : 'Se connecter'}
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
