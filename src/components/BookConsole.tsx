/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState } from 'react';

interface BookConsoleProps {
  onSelectTest: (testId: string) => void;
  completedTests?: Record<string, boolean>;
}

export const BookConsole: React.FC<BookConsoleProps> = ({ onSelectTest, completedTests = {} }) => {
  // Verifica se i 5 test della fotografia iniziale sono tutti completati
  const isPhase1Complete = Boolean(
    completedTests.tap &&
    completedTests.induttore &&
    completedTests.nome &&
    completedTests.puntiDistonici &&
    completedTests.sigilli
  );

  // Regola richiesta: se la fotografia iniziale non esiste ancora, mostra aperta la Fase 1 e chiuse le Fasi 2 e 3;
  // dopo il completamento della Fase 1, richiudila.
  const [userToggled, setUserToggled] = useState<Record<number, boolean>>({});

  const isPhase1Open = userToggled[1] !== undefined ? userToggled[1] : !isPhase1Complete;
  const isPhase2Open = userToggled[2] !== undefined ? userToggled[2] : false;
  const isPhase3Open = userToggled[3] !== undefined ? userToggled[3] : false;

  const togglePhase = (phaseNum: number) => {
    setUserToggled(prev => {
      const current = phaseNum === 1 ? isPhase1Open : phaseNum === 2 ? isPhase2Open : isPhase3Open;
      return {
        ...prev,
        [phaseNum]: !current,
      };
    });
  };

  return (
    <section className="bg-white rounded-2xl border-2 border-indigo-400 shadow-lg ring-1 ring-indigo-100 p-4 sm:p-6 overflow-hidden">
      {/* Testata della Consolle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3.5 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl flex-shrink-0">🧭</span>
            <h2 className="font-serif font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
              Il tuo percorso con il libro
            </h2>
          </div>
          <p className="text-sm text-slate-700 font-medium mt-1">
            Percorso guidato in 3 fasi collegato alla lettura di <em className="text-indigo-900 font-semibold not-italic">Smettila di Soffrire</em>
          </p>
        </div>
        <span className="self-start sm:self-center text-xs font-bold uppercase tracking-wider text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg whitespace-nowrap">
          Percorso Principale
        </span>
      </div>

      {/* Fisarmoniche compatte delle 3 Fasi */}
      <div className="space-y-3.5">
        
        {/* ========================================================= */}
        {/* FASE 1: Fotografia iniziale */}
        {/* ========================================================= */}
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/20 overflow-hidden transition-all shadow-2xs">
          <button
            type="button"
            onClick={() => togglePhase(1)}
            aria-expanded={isPhase1Open}
            className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-blue-50/60 transition group cursor-pointer"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-amber-500 text-white font-serif font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
                1
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Fase 1</span>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    Fotografia iniziale
                  </h3>
                  {isPhase1Complete ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      ✓ Completata
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Da iniziare qui
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-blue-800 mt-0.5">
                  I 5 test di base collegati alla lettura
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-600 font-semibold hidden sm:inline">
                {isPhase1Open ? 'Chiudi' : 'Apri'}
              </span>
              <svg
                className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${isPhase1Open ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isPhase1Open && (
            <div className="px-4 pb-4 pt-2 border-t border-blue-100 animate-fadeIn">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                Esegui in ordine i <strong>5 test iniziali</strong>: T.A.P., Induttore, Nome, Punti Distonici e Sigilli/Vincoli.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'tap', title: '1. Test T.A.P.', label: 'Asta, Cerchio, Triangolo' },
                  { id: 'induttore', title: '2. Test Induttore', label: 'Libertà vs Sogno' },
                  { id: 'nome', title: '3. Test del Nome', label: 'Riconoscimento identità' },
                  { id: 'puntiDistonici', title: '4. Test Punti Distonici', label: 'Aree di vita' },
                  { id: 'sigilli', title: '5. Test Sigilli e Vincoli', label: 'Blocchi emotivi specifici' },
                ].map((t) => {
                  const isDone = !!completedTests[t.id];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTest(t.id)}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-400 text-left transition group text-sm shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700">
                          {t.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {t.label}
                        </div>
                      </div>
                      {isDone ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 flex-shrink-0">
                          ✓ Fatto
                        </span>
                      ) : (
                        <span className="text-xs text-blue-700 font-bold group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                          Avvia →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* FASE 2: Approfondimenti */}
        {/* ========================================================= */}
        <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/50 via-white to-indigo-50/20 overflow-hidden transition-all shadow-2xs">
          <button
            type="button"
            onClick={() => togglePhase(2)}
            aria-expanded={isPhase2Open}
            className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-indigo-50/60 transition group cursor-pointer"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-serif font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
                2
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">Fase 2</span>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    Approfondimenti
                  </h3>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Scelta libera
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-indigo-800 mt-0.5">
                  Esplora nel tempo ciò che è emerso nella Fase 1
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-600 font-semibold hidden sm:inline">
                {isPhase2Open ? 'Chiudi' : 'Apri'}
              </span>
              <svg
                className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${isPhase2Open ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isPhase2Open && (
            <div className="px-4 pb-4 pt-2 border-t border-indigo-100 animate-fadeIn">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3.5">
                Quando hai completato i test di base, usa questa sezione per individuare età, periodo e testimone chiave.
              </p>

              <button
                type="button"
                onClick={() => onSelectTest('ricercaCause')}
                className="w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">🧭</span>
                  <div className="text-left min-w-0">
                    <h4 className="font-bold text-sm sm:text-base">Vai alla Ricerca Cause</h4>
                    <p className="text-xs text-indigo-100">Grande Indagine, Quale Giorno, Testimone &amp; Torto</p>
                  </div>
                </div>
                <span className="text-xl flex-shrink-0 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* FASE 3: Check-in e nuovo ciclo (Anteprima — Non ancora disponibile) */}
        {/* ========================================================= */}
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/90 overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => togglePhase(3)}
            aria-expanded={isPhase3Open}
            className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-100/70 transition group cursor-pointer"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-slate-400 text-white font-serif font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
                3
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Fase 3</span>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-slate-800 leading-tight">
                    Check-in e nuovo ciclo
                  </h3>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                    Anteprima • Non ancora disponibile
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">
                  Funzione prevista per i controlli dal giorno 15 e dopo il giorno 21
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-600 font-semibold hidden sm:inline">
                {isPhase3Open ? 'Chiudi' : 'Dettagli'}
              </span>
              <svg
                className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isPhase3Open ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isPhase3Open && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-200 animate-fadeIn">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                <strong>Solo anteprima:</strong> questa fase è <strong>non ancora disponibile</strong>. Sarà dedicata a futuri momenti di auto-osservazione personale secondo il modello DAB (non costituisce diagnosi, prova certa di una causa né promessa di risoluzione).
              </p>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <span className="text-base flex-shrink-0">🔒</span>
                  <span className="leading-snug">
                    Questa fase non è attiva al momento.
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  className="py-2 px-4 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider cursor-not-allowed whitespace-nowrap self-start sm:self-auto"
                >
                  Non ancora disponibile
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
