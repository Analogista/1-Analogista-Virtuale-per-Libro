/* © 2027 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle, LogIn, BookOpen } from 'lucide-react';

type RequestFilter = 'pending' | 'approved' | 'revoked';

const Admin: React.FC = () => {
  const { user, loading, isAdmin, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<RequestFilter>('pending');

  const isVerifiedAdmin = Boolean(user && isAdmin && user.emailVerified);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-8">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 border border-gray-300 px-3.5 py-2 rounded-xl transition bg-white shadow-2xs"
          >
            &larr; Torna alla Home
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="bg-slate-100 p-4 rounded-full mb-4">
            <ShieldAlert className="text-slate-700 w-10 h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Area Admin</h2>
          <p className="text-sm text-gray-600 mb-6 max-w-md leading-relaxed">
            Accesso riservato esclusivamente all&apos;account amministratore (<strong>analogistabrindisi@gmail.com</strong>).
          </p>
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow transition text-sm sm:text-base"
          >
            <LogIn size={18} />
            <span>Accedi come Admin</span>
          </button>
        </div>
      </div>
    );
  }

  if (!isVerifiedAdmin) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 sm:p-8 text-center space-y-4">
          <div className="bg-red-50 w-14 h-14 mx-auto rounded-full flex items-center justify-center">
            <ShieldAlert className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Accesso non autorizzato</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Questa sezione è riservata esclusivamente a <strong>analogistabrindisi@gmail.com</strong>.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 border border-gray-300 px-3.5 py-2 rounded-xl transition bg-white shadow-2xs"
        >
          &larr; Torna alla Home
        </button>

        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
          <ShieldCheck size={14} />
          Admin verificato: {user.email}
        </span>
      </div>

      {/* Intestazione Pannello */}
      <section className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={24} />
              Area Admin — Richieste di Accesso
            </h2>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Spazio predisposto per ricevere e gestire le richieste di autorizzazione all&apos;accesso dell&apos;intera app.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="self-start sm:self-center inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap"
          >
            <BookOpen size={15} />
            <span>Vai a Storico Sessioni</span>
          </button>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
          <strong>Stato attuale:</strong> area predisposta in attesa di attivazione del banner iniziale di richiesta accesso (dove i nuovi utenti inseriranno <em>Nome</em>, <em>Cognome</em> ed <em>Email</em>).
        </div>
      </section>

      {/* Filtri stato richieste */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Clock size={14} />
              <span>In attesa (0)</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('approved')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                filter === 'approved'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Autorizzati (0)</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('revoked')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                filter === 'revoked'
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <XCircle size={14} />
              <span>Non autorizzati / Revocati (0)</span>
            </button>
          </div>
        </div>

        {/* Struttura elenco predisposta */}
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 sm:p-8 text-center space-y-2">
          <p className="font-bold text-slate-800 text-sm sm:text-base">
            {filter === 'pending'
              ? 'Nessuna richiesta in attesa'
              : filter === 'approved'
                ? 'Nessun utente autorizzato registrato'
                : 'Nessun utente revocato'}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Quando attiverai il modulo iniziale di login e richiesta accesso, qui compariranno <strong>Nome</strong>, <strong>Cognome</strong>, <strong>Email</strong>, data della richiesta e i comandi di approvazione o blocco.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Admin;
