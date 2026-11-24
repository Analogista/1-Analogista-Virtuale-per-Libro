/* © 2027 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string | null;
  clearError: () => void;
  onGoogleLogin: () => Promise<void>;
  onEmailLogin: (email: string, password: string) => Promise<boolean>;
  onEmailRegister: (email: string, password: string) => Promise<boolean>;
  onResetPassword: (email: string) => Promise<boolean>;
}

type AuthMode = 'login' | 'register' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  error,
  clearError,
  onGoogleLogin,
  onEmailLogin,
  onEmailRegister,
  onResetPassword,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const switchMode = (nextMode: AuthMode) => {
    clearError();
    setInfoMessage(null);
    setMode(nextMode);
  };

  const handleClose = () => {
    clearError();
    setInfoMessage(null);
    setSubmitting(false);
    onClose();
  };

  const handleGoogle = async () => {
    clearError();
    setInfoMessage(null);
    setSubmitting(true);
    try {
      await onGoogleLogin();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setInfoMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const ok = await onEmailLogin(trimmedEmail, password);
        if (ok) handleClose();
      } else if (mode === 'register') {
        const ok = await onEmailRegister(trimmedEmail, password);
        if (ok) {
          setInfoMessage('Registrazione completata. Controlla la tua email per il link di verifica.');
        }
      } else {
        const ok = await onResetPassword(trimmedEmail);
        if (ok) {
          setInfoMessage('Email di recupero password inviata. Controlla la posta (anche nello spam).');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 relative animate-fadeIn">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Chiudi finestra accesso"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
        >
          <X size={20} />
        </button>

        <h2 id="auth-modal-title" className="font-serif font-bold text-xl text-slate-900 pr-8">
          {mode === 'login'
            ? 'Accedi al tuo account'
            : mode === 'register'
              ? 'Crea account con qualsiasi email'
              : 'Recupera password'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          Puoi accedere con Google oppure con qualsiasi indirizzo email.
        </p>

        {/* Pulsante Google */}
        <div className="mt-4">
          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-300 shadow-2xs transition text-sm disabled:opacity-60"
          >
            <LogIn size={16} className="text-blue-600" />
            <span>Continua con Google</span>
          </button>
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            oppure email
          </span>
          <div className="border-t border-slate-200 w-full"></div>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 font-medium">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 font-medium">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="auth-email">
              Indirizzo Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.it"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="auth-password">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow transition text-sm disabled:opacity-60"
          >
            {mode === 'login' ? (
              <>
                <LogIn size={16} />
                <span>Accedi con Email</span>
              </>
            ) : mode === 'register' ? (
              <>
                <UserPlus size={16} />
                <span>Registrati con Email</span>
              </>
            ) : (
              <>
                <KeyRound size={16} />
                <span>Invia email di recupero</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          {mode === 'login' ? (
            <>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-blue-700 hover:underline font-semibold"
              >
                Non hai un account? Registrati
              </button>
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-slate-600 hover:underline"
              >
                Password dimenticata?
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-blue-700 hover:underline font-semibold"
            >
              Torna ad Accedi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
