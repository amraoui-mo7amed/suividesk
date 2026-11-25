import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface LockScreenOverlayProps {
  onUnlock: () => void;
}

export const LockScreenOverlay: React.FC<LockScreenOverlayProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      triggerShake();
      return;
    }

    if (!window.electronAPI) {
      onUnlock();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await window.electronAPI.verifyPassword(password);
      if (res.success) {
        onUnlock();
      } else {
        setError('Mot de passe incorrect. Veuillez réessayer.');
        triggerShake();
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la vérification.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001f3f]/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-fade-in">
      <div
        className={`bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border-2 border-[#9EC3E6] flex flex-col items-center text-center transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* CNAS Logo & Padlock badge */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-2xl bg-[#EEF6FC] p-3 shadow-md border-2 border-[#9EC3E6] flex items-center justify-center">
            <img src="./CNAS_logo.png" alt="CNAS" className="w-full h-full object-contain" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#005A9E] text-white flex items-center justify-center shadow-lg border-2 border-white">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#EEF6FC] text-[#005A9E] border border-[#C6DDF2] mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#005A9E]" />
          <span>Accès Sécurisé — CNAS</span>
        </div>

        <h2 className="text-2xl font-black text-[#003A6B] tracking-tight">SuiviDesk Verrouillé</h2>
        <p className="text-xs text-slate-500 font-medium mt-1 mb-6">
          Veuillez saisir votre mot de passe pour accéder à la base de données.
        </p>

        {error && (
          <div className="w-full mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe ou code PIN..."
              autoFocus
              className="w-full px-4 py-3 rounded-xl border-2 border-[#C6DDF2] focus:border-[#005A9E] focus:outline-none text-center font-bold text-base tracking-widest text-slate-800 bg-[#F7FAFD]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#005A9E] hover:bg-[#004780] active:scale-98 text-white font-black text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
          >
            <Lock className="w-4 h-4" />
            <span>{isLoading ? 'Vérification...' : 'Déverrouiller la session'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 w-full text-[11px] text-slate-400">
          Système de Suivi Opérationnel & Échéances • CNAS
        </div>
      </div>
    </div>
  );
};
