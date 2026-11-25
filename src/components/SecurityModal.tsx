import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, Key, Clock, AlertCircle, CheckCircle2, ShieldOff, Eye, EyeOff } from 'lucide-react';
import { AuthStatus } from '../types';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (isConfigured: boolean, autoLockMinutes: number) => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  onStatusChange
}) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isConfigured: false,
    autoLockMinutes: 0
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStatus = async () => {
    if (!window.electronAPI) return;
    try {
      const status = await window.electronAPI.getLockStatus();
      setAuthStatus(status);
      setSelectedMinutes(status.autoLockMinutes || 0);
    } catch (err) {
      console.error('Erreur chargement statut sécurité:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setError(null);
      setSuccess(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSetOrUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword) {
      setError('Veuillez entrer un mot de passe.');
      return;
    }
    if (newPassword.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (window.electronAPI) {
        const res = await window.electronAPI.setPassword(newPassword, currentPassword || undefined);
        if (res.success) {
          setSuccess('Mot de passe enregistré avec succès.');
          setNewPassword('');
          setConfirmPassword('');
          setCurrentPassword('');
          await loadStatus();
          if (onStatusChange) onStatusChange(true, selectedMinutes);
        } else {
          setError(res.error || 'Erreur lors de la mise à jour du mot de passe.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur inconnue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisablePassword = async () => {
    if (!window.confirm('Voulez-vous vraiment désactiver la protection par mot de passe ?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      setIsSubmitting(true);
      if (window.electronAPI) {
        const res = await window.electronAPI.disablePassword(currentPassword);
        if (res.success) {
          setSuccess('La protection par mot de passe a été désactivée.');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          await loadStatus();
          if (onStatusChange) onStatusChange(false, selectedMinutes);
        } else {
          setError(res.error || 'Mot de passe actuel incorrect.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la désactivation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAutoLock = async (minutes: number) => {
    setSelectedMinutes(minutes);
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.setAutoLockMinutes(minutes);
      setSuccess(`Délai d'inactivité configuré sur : ${minutes === 0 ? 'Désactivé' : `${minutes} min`}`);
      if (onStatusChange) onStatusChange(authStatus.isConfigured, minutes);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du changement de délai.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border-2 border-[#9EC3E6] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#003A6B] to-[#005A9E] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-snug">Sécurité & Verrouillage</h3>
              <p className="text-[11px] text-blue-100 font-medium">Contrôle d'accès et verrouillage automatique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="p-4 rounded-2xl bg-[#EEF6FC] border border-[#C6DDF2] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                authStatus.isConfigured ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'
              }`}>
                {authStatus.isConfigured ? <Lock className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-black text-[#003A6B]">
                  {authStatus.isConfigured ? 'Protection par mot de passe activée' : 'Aucun mot de passe configuré'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {authStatus.isConfigured
                    ? 'L’application exigera votre mot de passe à l’ouverture et en cas de verrouillage.'
                    : 'L’application s’ouvre directement sans authentification.'}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSetOrUpdatePassword} className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-[#005A9E]" />
              <span>{authStatus.isConfigured ? 'Modifier le mot de passe' : 'Définir un mot de passe'}</span>
            </h4>

            {authStatus.isConfigured && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe actuel</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe actuel..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#005A9E] focus:outline-none text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    tabIndex={-1}
                    title={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 4 caractères..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#005A9E] focus:outline-none text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    tabIndex={-1}
                    title={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#005A9E] focus:outline-none text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    tabIndex={-1}
                    title={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[#005A9E] hover:bg-[#004780] active:scale-98 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{authStatus.isConfigured ? 'Enregistrer les modifications' : 'Activer le verrouillage'}</span>
              </button>

              {authStatus.isConfigured && (
                <button
                  type="button"
                  onClick={handleDisablePassword}
                  disabled={isSubmitting || !currentPassword}
                  className="px-4 py-2.5 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-40"
                  title="Saisissez le mot de passe actuel pour désactiver"
                >
                  Désactiver
                </button>
              )}
            </div>
          </form>

          {/* Auto-Lock Inactivity Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#005A9E]" />
              <span>Verrouillage automatique par inactivité</span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Verrouille l'écran automatiquement après une période sans mouvement ni frappe.
            </p>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Jamais', value: 0 },
                { label: '5 min', value: 5 },
                { label: '15 min', value: 15 },
                { label: '30 min', value: 30 }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSaveAutoLock(opt.value)}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    selectedMinutes === opt.value
                      ? 'bg-[#005A9E] text-white border-[#005A9E] shadow-xs'
                      : 'bg-white hover:bg-[#EEF6FC] text-slate-700 border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
