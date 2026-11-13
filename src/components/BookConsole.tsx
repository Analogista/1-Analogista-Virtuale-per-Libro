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
    <section className="bg-white rounded-2xl border-2 border-indigo-200/80 shadow-md p-3.5 sm:p-5 overflow-hidden">
      {/* Testata della Consolle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🧭</span>
            <h2 className="font-serif font-black text-lg sm:text-xl text-slate-900 tracking-tight">
              Il tuo percorso con il libro
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Tre tappe guidate collegate alla lettura di <em className="text-indigo-900 font-semibold not-italic">Smettila di Soffrire</em>
          </p>
        </div>
        <span className="self-start sm:self-center text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
          Consolle del Percorso
        </span>
      </div>

      {/* Fisarmoniche compatte delle 3 Fasi */}
      <div className="space-y-3">
        
        {/* ========================================================= */}
        {/* FASE 1: Fotografia iniziale */}
        {/* ========================================================= */}
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/20 overflow-hidden transition-all shadow-2xs">
          <button
            type="button"
            onClick={() => togglePhase(1)}
            className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-blue-50/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-serif font-black text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                1
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    Fotografia iniziale
                  </h3>
                  {isPhase1Complete ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      ✓ Completata
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Inizio percorso
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-blue-700 truncate mt-0.5">
                  I 5 test collegati alla lettura
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                {isPhase1Open ? 'Comprimi' : 'Apri'}
              </span>
              <svg
                className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isPhase1Open ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isPhase1Open && (
            <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 border-t border-blue-100/80 animate-fadeIn">
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                <strong>Fase 1 — Fotografia iniziale T0 con cinque test:</strong> T.A.P., Induttore, Nome, Punti Distonici, Sigilli/Vincoli. 
                <span className="text-slate-500 font-medium"> (La calibrazione preparatoria è una guida di inquadratura corporea, non un test).</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      onClick={() => onSelectTest(t.id)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-blue-50 border border-blue-100 hover:border-blue-300 text-left transition group text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-slate-800 group-hover:text-blue-700 truncate">
                          {t.title}
                        </span>
                        <span className="text-[11px] text-slate-500 hidden md:inline truncate">
                          · {t.label}
                        </span>
                      </div>
                      {isDone ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                          ✓ Fatto
                        </span>
                      ) : (
                        <span className="text-[11px] text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                          Avvia &rarr;
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
        <div className="rounded-xl border border-indigo-200/90 bg-gradient-to-b from-indigo-50/50 via-white to-indigo-50/20 overflow-hidden transition-all shadow-2xs">
          <button
            type="button"
            onClick={() => togglePhase(2)}
            className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-indigo-50/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-serif font-black text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                2
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    Approfondimenti
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Scelta libera
                  </span>
                </div>
                <p className="text-xs font-semibold text-indigo-700 truncate mt-0.5">
                  Scegli cosa esplorare in base a ciò che è emerso
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                {isPhase2Open ? 'Comprimi' : 'Apri'}
              </span>
              <svg
                className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isPhase2Open ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isPhase2Open && (
            <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 border-t border-indigo-100/80 animate-fadeIn">
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                <strong>Fase 2 — Approfondimenti scelti liberamente:</strong> Una volta emersi i blocchi, usa questi strumenti per trovare l'evento causa nel passato.
              </p>

              <button
                onClick={() => onSelectTest('ricercaCause')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">🧭</span>
                  <div className="text-left">
                    <h4 className="font-bold text-sm">Vai alla Ricerca Cause</h4>
                    <p className="text-[10px] text-indigo-100 opacity-80">Grande Indagine, Quale Giorno, Testimone</p>
                  </div>
                </div>
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* FASE 3: Check-in e nuovo ciclo (Anteprima non attiva) */}
        {/* ========================================================= */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-gradient-to-b from-slate-50 via-white to-slate-50/70 overflow-hidden transition-all shadow-2xs">
          <button
            type="button"
            onClick={() => togglePhase(3)}
            className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-100/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-slate-400 text-white font-serif font-black text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                3
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    Check-in e nuovo ciclo
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Anteprima
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                  Torna su un punto o sigillo quando ne senti il bisogno
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                {isPhase3Open ? 'Comprimi' : 'Apri'}
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
            <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 border-t border-slate-200 animate-fadeIn">
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                <strong>Fase 3 — Check-in dal giorno 15 e anche dopo il giorno 21:</strong> Anteprima non attiva dedicata a futuri momenti di auto-osservazione personale secondo il modello DAB (non costituisce diagnosi, prova certa di una causa né promessa di risoluzione).
              </p>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-base flex-shrink-0">🔒</span>
                  <span className="leading-snug">
                    Fase in preparazione: si attiverà al termine delle prime settimane di lettura.
                  </span>
                </div>
                <button
                  disabled
                  className="py-1.5 px-3 rounded-lg bg-slate-200/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider cursor-not-allowed whitespace-nowrap self-start sm:self-auto"
                >
                  Anteprima non attiva
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
