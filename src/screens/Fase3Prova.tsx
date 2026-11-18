/* © 2027 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { PUNTI_DISTONICI_META, SIGILLI_META } from '../utils/AnalysisEngine';
import type { UserData } from '../types';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

type PuntiAreaKey = keyof NonNullable<UserData['puntiDistonici']>;
type PuntiAreaRaw = UserData['puntiDistonici'][PuntiAreaKey];
type SigilloKey = keyof NonNullable<UserData['sigilli']>;
type MilestoneCode = 'G1' | 'G7' | 'G14' | 'G21' | 'SUCCESSIVA';

interface Fase3T0Snapshot {
  createdAtIso: string;
  puntiDistonici: Record<PuntiAreaKey, PuntiAreaRaw>;
  puntoDistonicoFinale: string;
  sigilli: Record<SigilloKey, string>;
  sigilloFinale: string;
  induttoreResult: string;
  tapTipologia: string;
  etaEventoCausa: string;
  giornoEvento: string;
  testimoneChiave: string;
}

interface Fase3CheckinEntry {
  id: string;
  createdAtIso: string;
  milestone: MilestoneCode;
  aree: Record<PuntiAreaKey, number | 'NON_APPLICABILE'>;
  testNomeSnapshot?: {
    nomeVero: string;
    nomeFalso: string;
  };
}

interface Fase3LocalStore {
  t0: Fase3T0Snapshot | null;
  checkins: Fase3CheckinEntry[];
}

const FASE3_STORAGE_KEY = 'analogista_fase3_local_v1';

const MILESTONE_OPTIONS: { code: MilestoneCode; label: string }[] = [
  { code: 'G1', label: 'Giorno 1' },
  { code: 'G7', label: 'Giorno 7' },
  { code: 'G14', label: 'Giorno 14' },
  { code: 'G21', label: 'Giorno 21' },
  { code: 'SUCCESSIVA', label: 'Verifica successiva' },
];

const SCORE_SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const PHASE_1_TESTS: {
  id: 'tap' | 'induttore' | 'nome' | 'puntiDistonici' | 'sigilli';
  label: string;
}[] = [
  { id: 'tap', label: '1. Test T.A.P.' },
  { id: 'induttore', label: '2. Test Induttore' },
  { id: 'nome', label: '3. Test del Nome' },
  { id: 'puntiDistonici', label: '4. Test Punti Distonici' },
  { id: 'sigilli', label: '5. Test Sigilli e Vincoli' },
];

type ScoreDraftMap = Record<PuntiAreaKey, number | 'NON_APPLICABILE' | null>;

function readLocalFase3(): Fase3LocalStore {
  try {
    const raw = localStorage.getItem(FASE3_STORAGE_KEY);
    if (!raw) return { t0: null, checkins: [] };
    const parsed = JSON.parse(raw) as Partial<Fase3LocalStore>;
    return {
      t0: parsed && parsed.t0 && typeof parsed.t0 === 'object' ? parsed.t0 : null,
      checkins: Array.isArray(parsed?.checkins) ? parsed.checkins : [],
    };
  } catch {
    return { t0: null, checkins: [] };
  }
}

function formatAreaStatus(val: PuntiAreaRaw | string | undefined): string {
  if (val === 'SI') return 'Sì';
  if (val === 'NO') return 'No';
  if (val === 'NON_APPLICABILE') return 'Non applicabile';
  return 'Non rilevato';
}

function formatDateTimeIt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function createInitialScores(t0: Fase3T0Snapshot | null): ScoreDraftMap {
  return {
    famiglia: t0?.puntiDistonici.famiglia === 'NON_APPLICABILE' ? 'NON_APPLICABILE' : null,
    famigliaAcquisita: t0?.puntiDistonici.famigliaAcquisita === 'NON_APPLICABILE' ? 'NON_APPLICABILE' : null,
    sentimentali: t0?.puntiDistonici.sentimentali === 'NON_APPLICABILE' ? 'NON_APPLICABILE' : null,
    sessuali: t0?.puntiDistonici.sessuali === 'NON_APPLICABILE' ? 'NON_APPLICABILE' : null,
    autorealizzazione: t0?.puntiDistonici.autorealizzazione === 'NON_APPLICABILE' ? 'NON_APPLICABILE' : null,
  };
}

const Fase3Prova: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData } = useUser();
  const [store, setStore] = useState<Fase3LocalStore>(() => readLocalFase3());
  const [confirmingT0, setConfirmingT0] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneCode>('G1');
  const [scores, setScores] = useState<ScoreDraftMap>(() =>
    createInitialScores(readLocalFase3().t0)
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(FASE3_STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error('Errore nel salvataggio locale Fase 3:', error);
    }
  }, [store]);

  const draftT0 = useMemo<Fase3T0Snapshot>(() => ({
    createdAtIso: new Date().toISOString(),
    puntiDistonici: {
      famiglia: userData.puntiDistonici?.famiglia || '',
      famigliaAcquisita: userData.puntiDistonici?.famigliaAcquisita || '',
      sentimentali: userData.puntiDistonici?.sentimentali || '',
      sessuali: userData.puntiDistonici?.sessuali || '',
      autorealizzazione: userData.puntiDistonici?.autorealizzazione || '',
    },
    puntoDistonicoFinale: userData.puntoDistonicoFinale || '',
    sigilli: {
      colpa: userData.sigilli?.colpa || '',
      abbandono: userData.sigilli?.abbandono || '',
      disistima: userData.sigilli?.disistima || '',
      giudizio: userData.sigilli?.giudizio || '',
    },
    sigilloFinale: userData.sigilloFinale || '',
    induttoreResult: userData.induttoreResult || '',
    tapTipologia: userData.testTAP?.diagnosis?.isValid ? userData.testTAP.diagnosis.tipologia : '',
    etaEventoCausa: userData.timeLine?.etaEventoCausa || '',
    giornoEvento: userData.giornoEvento || '',
    testimoneChiave: userData.testimoneChiave || '',
  }), [userData]);

  const missingPhase1Tests = useMemo(() => {
    const done = userData.completedTests ?? {};
    return PHASE_1_TESTS.filter((test) => !done[test.id]);
  }, [userData.completedTests]);

  const isPhase1Complete = missingPhase1Tests.length === 0;

  const activeT0 = store.t0;

  const missingScoreAreas = useMemo(() => {
    if (!activeT0) return [];
    return PUNTI_DISTONICI_META.filter(({ key }) => {
      if (activeT0.puntiDistonici[key] === 'NON_APPLICABILE') return false;
      const val = scores[key];
      return typeof val !== 'number' || val < 0 || val > 10;
    });
  }, [activeT0, scores]);

  const canSaveCheckin = Boolean(activeT0) && missingScoreAreas.length === 0;

  const handleLockT0 = () => {
    if (store.t0 || !isPhase1Complete) return;
    const frozenSnapshot: Fase3T0Snapshot = {
      ...draftT0,
      createdAtIso: new Date().toISOString(),
      puntiDistonici: { ...draftT0.puntiDistonici },
      sigilli: { ...draftT0.sigilli },
    };
    setStore(prev => {
      if (prev.t0) return prev;
      return {
        ...prev,
        t0: frozenSnapshot,
      };
    });
    setScores(createInitialScores(frozenSnapshot));
    setConfirmingT0(false);
    setSavedNotice('Fotografia iniziale T0 fissata localmente sul dispositivo.');
  };

  const handleSaveCheckin = () => {
    if (!store.t0 || missingScoreAreas.length > 0) return;

    const cleanAreas = {} as Record<PuntiAreaKey, number | 'NON_APPLICABILE'>;
    for (const { key } of PUNTI_DISTONICI_META) {
      if (store.t0.puntiDistonici[key] === 'NON_APPLICABILE') {
        cleanAreas[key] = 'NON_APPLICABILE';
      } else {
        const val = scores[key];
        if (typeof val !== 'number' || val < 0 || val > 10) return;
        cleanAreas[key] = val;
      }
    }

    const newEntry: Fase3CheckinEntry = {
      id: `chk_${Date.now()}`,
      createdAtIso: new Date().toISOString(),
      milestone: selectedMilestone,
      aree: cleanAreas,
      testNomeSnapshot:
        userData.testNome?.nomeVero || userData.testNome?.nomeFalso
          ? {
              nomeVero: userData.testNome?.nomeVero || 'NON_RILEVATO',
              nomeFalso: userData.testNome?.nomeFalso || 'NON_RILEVATO',
            }
          : undefined,
    };

    setStore(prev => ({
      ...prev,
      checkins: [...prev.checkins, newEntry],
    }));
    setScores(createInitialScores(store.t0));
    const milestoneLabel = MILESTONE_OPTIONS.find(m => m.code === selectedMilestone)?.label || selectedMilestone;
    setSavedNotice(`Verifica «${milestoneLabel}» salvata localmente sul dispositivo.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Barra superiore di navigazione e badge In prova */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPage(0)}
          className="text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-700 border border-slate-300 px-3.5 py-2 rounded-xl transition bg-white shadow-2xs"
        >
          &larr; Torna alla Consolle
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg">
          Fase 3 • In prova (solo locale)
        </span>
      </div>

      {/* Intestazione informativa */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🗓️</span>
          <div className="space-y-1">
            <h1 className="font-serif font-black text-xl sm:text-2xl text-slate-900">
              Verifica periodica nel tempo (Versione di prova)
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed">
              Questa funzione è attiva esclusivamente in locale sul tuo dispositivo (nessun dato viene inviato a Firestore). Permette di fissare una fotografia iniziale <strong>T0</strong> non modificabile da questa schermata e registrare verifiche successive su scala <strong>0–10</strong>.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
          Strumento di autoconoscenza e auto-osservazione secondo le Discipline Analogiche (Legge 4/2013): non fornisce diagnosi mediche o psicologiche né garanzie cliniche.
        </p>
      </section>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-4 text-sm font-semibold flex items-center justify-between gap-3">
          <span>✓ {savedNotice}</span>
          <button
            type="button"
            onClick={() => setSavedNotice(null)}
            className="text-xs font-bold text-emerald-800 hover:underline flex-shrink-0"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* SEZIONE 1: FOTOGRAFIA INIZIALE T0                         */}
      {/* ========================================================= */}
      {!activeT0 ? (
        <section className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-slate-900">
                1. Riepilogo per Fotografia Iniziale (T0)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Controlla i dati rilevati sul dispositivo prima di fissare T0.
              </p>
            </div>
            <span className="self-start sm:self-center text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
              Anteprima locale
            </span>
          </div>

          {/* Riepilogo delle 5 aree */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Punti Distonici attuali
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PUNTI_DISTONICI_META.map(({ key, label }) => {
                const status = formatAreaStatus(draftT0.puntiDistonici[key]);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  >
                    <span className="font-medium text-slate-800">{label}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 whitespace-nowrap">
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Riepilogo sintetico altri test */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold uppercase text-slate-500">T.A.P. &amp; Induttore</div>
              <div className="font-semibold text-slate-800 mt-1">
                {draftT0.tapTipologia || 'T.A.P. non rilevato'} • Induttore: {draftT0.induttoreResult || 'Non rilevato'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold uppercase text-slate-500">Indietro nel Tempo</div>
              <div className="font-semibold text-slate-800 mt-1">
                Età: {draftT0.etaEventoCausa || 'N/D'} • Giorno: {draftT0.giornoEvento || 'N/D'} • Testimone: {draftT0.testimoneChiave || 'N/D'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed">
            <strong>Attenzione:</strong> una volta fissata, la fotografia <strong>T0</strong> viene salvata sul dispositivo e <strong>non potrà più essere modificata</strong> da questa schermata. Le aree segnate «Non applicabile» resteranno escluse dalle verifiche periodiche.
          </div>

          {!isPhase1Complete && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2.5 text-xs sm:text-sm text-blue-950">
              <p className="font-bold">
                Per fissare T0 devi prima completare tutti i 5 test della Fase 1. Mancano ancora:
              </p>
              <div className="flex flex-wrap gap-2">
                {missingPhase1Tests.map((test) => (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => setPage(test.id)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-100 text-blue-900 font-bold text-xs border border-blue-300 transition"
                  >
                    {test.label} →
                  </button>
                ))}
              </div>
            </div>
          )}

          {!confirmingT0 || !isPhase1Complete ? (
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPage(0)}
                className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition"
              >
                Torna ai test di Fase 1
              </button>
              <button
                type="button"
                disabled={!isPhase1Complete}
                onClick={() => setConfirmingT0(true)}
                className={`px-5 py-3 rounded-xl font-bold text-sm transition shadow-sm ${
                  isPhase1Complete
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                Fissa come Fotografia Iniziale (T0)
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-300 space-y-3">
              <p className="text-sm font-bold text-indigo-950">
                Confermi di voler salvare ora la Fotografia Iniziale T0 sul dispositivo? Dopo la conferma non sarà modificabile da questa schermata.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingT0(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-sm"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleLockT0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm shadow"
                >
                  Conferma e blocca T0
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* T0 BLOCCATA IN SOLA LETTURA */}
          <section className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-serif font-bold text-lg sm:text-xl text-slate-900">
                  1. Fotografia Iniziale (T0)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Salvata sul dispositivo il {formatDateTimeIt(activeT0.createdAtIso)}
                </p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 px-3 py-1 rounded-lg">
                🔒 Bloccata (non modificabile)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PUNTI_DISTONICI_META.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                >
                  <span className="font-medium text-slate-800">{label}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 whitespace-nowrap">
                    {formatAreaStatus(activeT0.puntiDistonici[key])}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Sigilli emersi:</strong>{' '}
                {SIGILLI_META.filter(({ key }) => activeT0.sigilli[key] === 'SI').map(s => s.label).join(', ') ||
                  (SIGILLI_META.every(({ key }) => activeT0.sigilli[key] === 'NO')
                    ? 'Nessuno nelle risposte'
                    : 'Parziale o non rilevato')}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Induttore / Indietro nel Tempo:</strong>{' '}
                {activeT0.induttoreResult || 'N/D'} • Età {activeT0.etaEventoCausa || 'N/D'} • {activeT0.giornoEvento || 'N/D'} • {activeT0.testimoneChiave || 'N/D'}
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SEZIONE 2: NUOVA VERIFICA PERIODICA (SOLO SCALA 0-10)     */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-serif font-bold text-lg sm:text-xl text-slate-900">
                2. Registra una verifica periodica
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Seleziona la tappa e indica da <strong>0</strong> (nessuna tensione percepita) a <strong>10</strong> (massima intensità) come senti ciascuna area oggi. Nessun campo di testo libero.
              </p>
            </div>

            {/* Scelta tappa */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Momento della verifica
              </span>
              <div className="flex flex-wrap gap-2">
                {MILESTONE_OPTIONS.map((opt) => {
                  const active = selectedMilestone === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setSelectedMilestone(opt.code)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Promemoria veloce Test del Nome */}
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-blue-950">
                <strong>Verifica preliminare:</strong> prima della rilevazione ti consigliamo di ripetere il <strong>Test del Nome</strong> per confermare la risposta istintiva Sì/No.
              </div>
              <button
                type="button"
                onClick={() => setPage('nome')}
                className="self-start sm:self-center px-3.5 py-2 rounded-lg bg-white hover:bg-blue-100 text-blue-900 font-bold text-xs border border-blue-300 whitespace-nowrap transition"
              >
                Ripeti Test del Nome →
              </button>
            </div>

            {/* Selettori 0-10 per le 5 aree */}
            <div className="space-y-4">
              {PUNTI_DISTONICI_META.map(({ key, label }) => {
                const isNa = activeT0.puntiDistonici[key] === 'NON_APPLICABILE';
                const currentValue = scores[key];
                return (
                  <div key={key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <div className="font-bold text-sm sm:text-base text-slate-900">{label}</div>
                        <div className="text-xs text-slate-500">
                          In T0: <strong>{formatAreaStatus(activeT0.puntiDistonici[key])}</strong>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-black bg-white border px-3 py-1 rounded-lg ${
                          isNa
                            ? 'text-slate-700 border-slate-200'
                            : typeof currentValue === 'number'
                              ? 'text-emerald-800 border-emerald-200'
                              : 'text-amber-800 border-amber-300'
                        }`}
                      >
                        {isNa
                          ? 'Non applicabile'
                          : typeof currentValue === 'number'
                            ? `${currentValue} / 10`
                            : 'Da selezionare'}
                      </span>
                    </div>

                    {!isNa && (
                      <div className="grid grid-cols-11 gap-1">
                        {SCORE_SCALE.map((num) => {
                          const selected = currentValue === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setScores(prev => ({ ...prev, [key]: num }))}
                              className={`py-2 rounded-lg text-xs font-bold border transition ${
                                selected
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {missingScoreAreas.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950">
                Seleziona un valore esplicito da <strong>0</strong> a <strong>10</strong> per ogni area applicabile prima di salvare (mancano:{' '}
                <strong>{missingScoreAreas.map(a => a.label).join(', ')}</strong>).
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                disabled={!canSaveCheckin}
                onClick={handleSaveCheckin}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm shadow transition ${
                  canSaveCheckin
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                Salva verifica sul dispositivo
              </button>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SEZIONE 3: CONFRONTO T0 VS VERIFICHE SALVATE              */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-serif font-bold text-lg sm:text-xl text-slate-900">
                3. Confronto T0 vs Verifiche locali ({store.checkins.length})
              </h2>
            </div>

            {store.checkins.length === 0 ? (
              <p className="text-sm text-slate-600">
                Nessuna verifica periodica registrata ancora. Compila la scheda qui sopra per avviare il confronto con T0.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="py-2 pr-3 font-bold">Area</th>
                      <th className="py-2 px-3 font-bold bg-slate-50">T0 (Bloccata)</th>
                      {store.checkins.map((chk) => {
                        const label = MILESTONE_OPTIONS.find(m => m.code === chk.milestone)?.label || chk.milestone;
                        return (
                          <th key={chk.id} className="py-2 px-3 font-bold whitespace-nowrap">
                            <div>{label}</div>
                            <div className="text-[11px] font-normal text-slate-500">
                              {formatDateTimeIt(chk.createdAtIso)}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {PUNTI_DISTONICI_META.map(({ key, label }) => (
                      <tr key={key} className="border-b border-slate-100">
                        <td className="py-2.5 pr-3 font-semibold text-slate-800">{label}</td>
                        <td className="py-2.5 px-3 bg-slate-50 font-bold text-slate-700 whitespace-nowrap">
                          {formatAreaStatus(activeT0.puntiDistonici[key])}
                        </td>
                        {store.checkins.map((chk) => {
                          const val = chk.aree[key];
                          return (
                            <td key={chk.id} className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                              {val === 'NON_APPLICABILE' ? 'Non applicabile' : `${val} / 10`}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Fase3Prova;
