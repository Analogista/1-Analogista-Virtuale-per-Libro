/* © 2027 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useEffect, useMemo, useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { PUNTI_DISTONICI_META, SIGILLI_META } from '../utils/AnalysisEngine';
import {
  buildT0SnapshotFromUserData,
  deleteCycleFromFirestore,
  Fase3CheckinEntry,
  Fase3LocalStore,
  Fase3T0Snapshot,
  freezeCycleT0ToFirestore,
  generateFirestoreSafeId,
  loadRemoteCyclesAndLatest,
  MilestoneCode,
  PuntiAreaKey,
  readLocalFase3,
  saveCheckinToFirestore,
  validateDraftT0,
  writeLocalFase3,
} from '../utils/fase3Cycles';
import type { UserData } from '../types';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

type PuntiAreaRaw = UserData['puntiDistonici'][PuntiAreaKey];
type ScoreDraftMap = Record<PuntiAreaKey, number | 'NON_APPLICABILE' | null>;

const MILESTONE_OPTIONS: { code: MilestoneCode; label: string }[] = [
  { code: 'G1', label: 'Giorno 1' },
  { code: 'G7', label: 'Giorno 7' },
  { code: 'G14', label: 'Giorno 14' },
  { code: 'G21', label: 'Giorno 21' },
  { code: 'SUCCESSIVA', label: 'Verifica successiva' },
];

const SCORE_SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

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
  const { user, openAuthModal } = useAuth();

  const canUseVerifiedCloud = Boolean(user && user.emailVerified);

  const [localStore, setLocalStore] = useState<Fase3LocalStore>(() => readLocalFase3());
  const [cloudState, setCloudState] = useState<{
    uid: string | null;
    store: Fase3LocalStore;
    totalCycles: number;
    error: string | null;
  }>({
    uid: null,
    store: { t0: null, checkins: [], nextCycleNumber: 1 },
    totalCycles: 0,
    error: null,
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const [verifiedAck, setVerifiedAck] = useState(false);
  const [confirmingT0, setConfirmingT0] = useState(false);
  const [confirmingNewCycle, setConfirmingNewCycle] = useState(false);
  const [confirmingDeleteCycle, setConfirmingDeleteCycle] = useState(false);
  const [savingRemote, setSavingRemote] = useState(false);

  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneCode>('G1');
  const [scores, setScores] = useState<ScoreDraftMap>(() =>
    createInitialScores(readLocalFase3().t0)
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const store = canUseVerifiedCloud ? cloudState.store : localStore;
  const cloudTotalCycles = canUseVerifiedCloud ? cloudState.totalCycles : 0;
  const cloudLoading = canUseVerifiedCloud && cloudState.uid !== user?.uid;
  const cloudSyncError = actionError ?? (canUseVerifiedCloud ? cloudState.error : null);

  // Persistenza locale automatica solo quando in modalita locale
  useEffect(() => {
    if (!canUseVerifiedCloud) {
      writeLocalFase3(localStore);
    }
  }, [localStore, canUseVerifiedCloud]);

  // Caricamento ciclo immutabile T0 da Firestore per utenti autenticati e verificati
  useEffect(() => {
    if (!canUseVerifiedCloud || !user) {
      return;
    }

    let cancelled = false;
    void loadRemoteCyclesAndLatest(user.uid)
      .then(({ latestT0, checkins, totalCycles }) => {
        if (cancelled) return;
        setCloudState({
          uid: user.uid,
          store: {
            t0: latestT0,
            checkins,
            nextCycleNumber: totalCycles + 1,
          },
          totalCycles,
          error: null,
        });
        setActionError(null);
        setScores(createInitialScores(latestT0));
      })
      .catch((error) => {
        console.error('Errore caricamento cicli T0 da Firestore:', error);
        if (cancelled) return;
        setCloudState((prev) => ({
          ...prev,
          uid: user.uid,
          error: 'Impossibile leggere i cicli salvati su Firestore. Verifica la connessione e riprova.',
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [canUseVerifiedCloud, user]);

  const validation = useMemo(() => validateDraftT0(userData), [userData]);
  const isPhase1Valid = validation.isValid;
  const activeT0 = store.t0;

  const missingScoreAreas = useMemo(() => {
    if (!activeT0) return [];
    return PUNTI_DISTONICI_META.filter(({ key }) => {
      if (activeT0.puntiDistonici[key] === 'NON_APPLICABILE') return false;
      const val = scores[key];
      return typeof val !== 'number' || val < 0 || val > 10;
    });
  }, [activeT0, scores]);

  const canSaveCheckin = Boolean(activeT0) && missingScoreAreas.length === 0 && !savingRemote;

  const handleResendVerification = async () => {
    if (!user) return;
    setActionError(null);
    try {
      await sendEmailVerification(user);
      setSavedNotice('Email di verifica inviata. Conferma il link nella tua casella e poi ricarica la schermata.');
    } catch {
      setActionError('Impossibile inviare ora l’email di verifica. Riprova tra qualche minuto.');
    }
  };

  const handleLockT0 = async () => {
    if (store.t0 || !isPhase1Valid || !verifiedAck || savingRemote) return;
    setActionError(null);

    const cycleNumber = canUseVerifiedCloud
      ? Math.max(1, cloudTotalCycles + 1)
      : Math.max(1, store.nextCycleNumber || 1);
    const cycleId = generateFirestoreSafeId('cyc');
    const source = canUseVerifiedCloud ? 'firestore' : 'local';
    const frozenSnapshot = buildT0SnapshotFromUserData(userData, cycleId, cycleNumber, source);

    if (canUseVerifiedCloud && user) {
      setSavingRemote(true);
      try {
        await freezeCycleT0ToFirestore(user.uid, frozenSnapshot);
      } catch {
        setActionError('Salvataggio T0 su Firestore non riuscito. T0 non è stata bloccata: riprova.');
        setSavingRemote(false);
        return;
      }
      setSavingRemote(false);
      setCloudState((prev) => ({
        uid: user.uid,
        store: {
          t0: frozenSnapshot,
          checkins: [],
          nextCycleNumber: cycleNumber + 1,
        },
        totalCycles: prev.totalCycles + 1,
        error: null,
      }));
    } else {
      setLocalStore({
        t0: frozenSnapshot,
        checkins: [],
        nextCycleNumber: cycleNumber + 1,
      });
    }

    setScores(createInitialScores(frozenSnapshot));
    setConfirmingT0(false);
    setVerifiedAck(false);
    setSavedNotice(
      canUseVerifiedCloud
        ? 'Fotografia iniziale T0 congelata su Firestore (regole immutabili attive).'
        : 'Fotografia iniziale T0 fissata localmente sul dispositivo.'
    );
  };

  const handleSaveCheckin = async () => {
    if (!store.t0 || missingScoreAreas.length > 0 || savingRemote) return;
    setActionError(null);

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
      id: generateFirestoreSafeId('chk'),
      cycleId: store.t0.cycleId,
      createdAtIso: new Date().toISOString(),
      milestone: selectedMilestone,
      aree: cleanAreas,
      testNomeSnapshot:
        userData.testNome?.nomeVero || userData.testNome?.nomeFalso
          ? {
              nomeVero:
                userData.testNome?.nomeVero === 'SI' || userData.testNome?.nomeVero === 'NO'
                  ? userData.testNome.nomeVero
                  : 'NON_RILEVATO',
              nomeFalso:
                userData.testNome?.nomeFalso === 'SI' || userData.testNome?.nomeFalso === 'NO'
                  ? userData.testNome.nomeFalso
                  : 'NON_RILEVATO',
            }
          : undefined,
    };

    if (canUseVerifiedCloud && user) {
      setSavingRemote(true);
      try {
        await saveCheckinToFirestore(user.uid, newEntry);
      } catch {
        setActionError('Salvataggio della verifica su Firestore non riuscito. Riprova.');
        setSavingRemote(false);
        return;
      }
      setSavingRemote(false);
      setCloudState((prev) => ({
        ...prev,
        store: {
          ...prev.store,
          checkins: [...prev.store.checkins, newEntry],
        },
      }));
    } else {
      setLocalStore((prev) => ({
        ...prev,
        checkins: [...prev.checkins, newEntry],
      }));
    }

    setScores(createInitialScores(store.t0));
    const milestoneLabel = MILESTONE_OPTIONS.find((m) => m.code === selectedMilestone)?.label || selectedMilestone;
    setSavedNotice(
      canUseVerifiedCloud
        ? `Verifica «${milestoneLabel}» salvata su Firestore.`
        : `Verifica «${milestoneLabel}» salvata localmente sul dispositivo.`
    );
  };

  // Avvia un nuovo ciclo senza modificare la T0 esistente su Firestore
  const handleStartNewCycle = () => {
    setConfirmingNewCycle(false);
    setConfirmingDeleteCycle(false);
    setVerifiedAck(false);
    setConfirmingT0(false);
    setActionError(null);

    if (canUseVerifiedCloud) {
      setCloudState((prev) => ({
        ...prev,
        store: {
          t0: null,
          checkins: [],
          nextCycleNumber: prev.totalCycles + 1,
        },
      }));
    } else {
      setLocalStore((prev) => ({
        t0: null,
        checkins: [],
        nextCycleNumber: (prev.t0?.cycleNumber || 0) + 1,
      }));
    }

    setScores(createInitialScores(null));
    setSavedNotice('Pronto per un nuovo ciclo: la T0 precedente non è stata modificata. Verifica o ripeti i test e fissa la nuova T0.');
  };

  // Eliminazione esplicita dell'intero ciclo (senza mai fare update su T0)
  const handleDeleteCurrentCycle = async () => {
    if (!store.t0 || savingRemote) return;
    setActionError(null);

    if (canUseVerifiedCloud && store.t0.source === 'firestore') {
      setSavingRemote(true);
      try {
        await deleteCycleFromFirestore(
          store.t0.cycleId,
          store.checkins.map((c) => c.id)
        );
      } catch {
        setActionError('Impossibile eliminare il ciclo da Firestore. Riprova.');
        setSavingRemote(false);
        return;
      }
      setSavingRemote(false);
      setCloudState((prev) => ({
        ...prev,
        store: {
          t0: null,
          checkins: [],
          nextCycleNumber: Math.max(1, prev.totalCycles),
        },
        totalCycles: Math.max(0, prev.totalCycles - 1),
      }));
    } else {
      setLocalStore({
        t0: null,
        checkins: [],
        nextCycleNumber: 1,
      });
    }

    setConfirmingDeleteCycle(false);
    setConfirmingNewCycle(false);
    setVerifiedAck(false);
    setScores(createInitialScores(null));
    setSavedNotice('Ciclo eliminato completamente. Puoi ripartire dai test e fissare una nuova T0.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Barra superiore di navigazione e stato Cloud/Locale */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPage(0)}
          className="text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-700 border border-slate-300 px-3.5 py-2 rounded-xl transition bg-white shadow-2xs"
        >
          &larr; Torna alla Consolle
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
              canUseVerifiedCloud
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            {canUseVerifiedCloud ? '🔒 Firestore Immutabile (Cloud)' : '📱 Solo locale sul dispositivo'}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg">
            Fase 3 • In prova
          </span>
        </div>
      </div>

      {/* Intestazione informativa */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🗓️</span>
          <div className="space-y-1">
            <h1 className="font-serif font-black text-xl sm:text-2xl text-slate-900">
              Tornare sui tuoi punti nel tempo (Versione di prova)
            </h1>
            <p className="text-sm font-semibold text-slate-800">
              T0 è la fotografia del tuo punto di partenza
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {canUseVerifiedCloud
                ? 'Sei autenticato: una volta validati i 5 test della Fase 1 e confermata T0, il database Firestore blocca tecnicamente ogni modifica o sovrascrittura della linea di base T0.'
                : 'Stai usando la modalità locale sul dispositivo. Accedi con account verificato se desideri salvare e proteggere T0 su Firestore.'}
            </p>
          </div>
        </div>

        {!user && (
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs sm:text-sm text-indigo-950">
              Accedi per proteggere in modo immutabile la tua fotografia <strong>T0</strong> anche su Firestore.
            </span>
            <button
              type="button"
              onClick={openAuthModal}
              className="self-start sm:self-center px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs whitespace-nowrap transition"
            >
              Accedi
            </button>
          </div>
        )}

        {user && !user.emailVerified && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs sm:text-sm text-amber-950">
              La tua email non risulta ancora verificata: verifica l&apos;email per salvare T0 su Firestore (nel frattempo i dati restano in locale).
            </span>
            <button
              type="button"
              onClick={handleResendVerification}
              className="self-start sm:self-center px-3.5 py-2 rounded-lg bg-white hover:bg-amber-100 text-amber-950 font-bold text-xs border border-amber-300 whitespace-nowrap transition"
            >
              Invia di nuovo email
            </button>
          </div>
        )}

        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
          Strumento di autoconoscenza e auto-osservazione secondo le Discipline Analogiche (Legge 4/2013): non fornisce diagnosi mediche o psicologiche né garanzie cliniche.
        </p>
      </section>

      {cloudSyncError && (
        <div className="bg-red-50 border border-red-300 text-red-900 rounded-xl p-4 text-sm font-semibold">
          ⚠️ {cloudSyncError}
        </div>
      )}

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

      {cloudLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : !activeT0 ? (
        /* ========================================================= */
        /* SEZIONE 1: VALIDAZIONE & RIEPILOGO PRE-BLOCCO T0          */
        /* ========================================================= */
        <section className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-slate-900">
                1. Verifica e convalida prima di congelare T0
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Finché non congeli T0, puoi ripetere qualsiasi test se qualcosa non ti convince.
              </p>
            </div>
            <span
              className={`self-start sm:self-center text-xs font-bold px-2.5 py-1 rounded-lg border ${
                isPhase1Valid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {isPhase1Valid ? '✓ Tutti i 5 test validi' : 'Bozza da completare / verificare'}
            </span>
          </div>

          {/* Controllo qualità su tutti e 5 i test della Fase 1 con pulsante "Ripeti test" */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Stato dei 5 test della Fase 1
            </h3>
            <div className="space-y-2.5">
              {validation.items.map((item) => {
                const isOk = item.status === 'valid';
                const isIncomplete = item.status === 'incomplete';
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isOk
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : isIncomplete
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{item.label}</span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            isOk
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : isIncomplete
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          {isOk ? 'Valido' : isIncomplete ? 'Da ripetere' : 'Mancante'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">{item.summaryText}</p>
                      {item.reason && (
                        <p className="text-xs font-semibold text-amber-900 mt-1">{item.reason}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPage(item.id)}
                      className={`self-start sm:self-center px-3.5 py-2 rounded-lg text-xs font-bold border whitespace-nowrap transition ${
                        isOk
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
                      }`}
                    >
                      {item.status === 'missing' ? 'Esegui test →' : 'Ripeti test →'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dettaglio delle 5 aree Punti Distonici */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dettaglio aree Punti Distonici in bozza
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PUNTI_DISTONICI_META.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                >
                  <span className="font-medium text-slate-800">{label}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 whitespace-nowrap">
                    {formatAreaStatus(userData.puntiDistonici?.[key])}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Riepilogo opzionale Fase 2 con pulsante Ripeti */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div>
              <div className="text-xs font-bold uppercase text-slate-500">Indietro nel Tempo (facoltativo in T0)</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                Età: {userData.timeLine?.etaEventoCausa || 'N/D'} • Giorno: {userData.giornoEvento || 'N/D'} • Testimone: {userData.testimoneChiave || 'N/D'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPage('indagineSingola')}
              className="self-start sm:self-center px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 whitespace-nowrap transition"
            >
              Ripeti / Esegui Indagine →
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed">
            <strong>Immutabilità di T0:</strong> una volta congelata, la fotografia <strong>T0</strong> non potrà più essere modificata né sovrascritta (blocco tecnico su database). Le aree segnate «Non applicabile» resteranno escluse dalle verifiche successive.
          </div>

          {isPhase1Valid && (
            <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 cursor-pointer text-xs sm:text-sm text-indigo-950">
              <input
                type="checkbox"
                checked={verifiedAck}
                onChange={(e) => {
                  setVerifiedAck(e.target.checked);
                  if (!e.target.checked) setConfirmingT0(false);
                }}
                className="mt-0.5 h-4 w-4 rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                <strong>Ho controllato tutti i risultati dei 5 test</strong> e confermo di voler congelare definitivamente la Fotografia Iniziale T0.
              </span>
            </label>
          )}

          {!confirmingT0 || !isPhase1Valid || !verifiedAck ? (
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPage(0)}
                className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition"
              >
                Torna alla Consolle
              </button>
              <button
                type="button"
                disabled={!isPhase1Valid || !verifiedAck || savingRemote}
                onClick={() => setConfirmingT0(true)}
                className={`px-5 py-3 rounded-xl font-bold text-sm transition shadow-sm ${
                  isPhase1Valid && verifiedAck && !savingRemote
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                Congela Fotografia Iniziale (T0)
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-300 space-y-3">
              <p className="text-sm font-bold text-indigo-950">
                Conferma finale: vuoi bloccare ora la Fotografia Iniziale T0{canUseVerifiedCloud ? ' su Firestore' : ' sul dispositivo'}? Dopo il salvataggio non sarà più modificabile.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={savingRemote}
                  onClick={() => setConfirmingT0(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-sm"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={savingRemote}
                  onClick={handleLockT0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm shadow disabled:opacity-60"
                >
                  {savingRemote ? 'Salvataggio in corso...' : 'Conferma e congela T0'}
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* T0 CONGELATA IN SOLA LETTURA */}
          <section className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-serif font-bold text-lg sm:text-xl text-slate-900">
                  1. Fotografia Iniziale (T0 — Ciclo #{activeT0.cycleNumber})
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Congelata il {formatDateTimeIt(activeT0.createdAtIso)} ({activeT0.source === 'firestore' ? 'Firestore immutabile' : 'Locale sul dispositivo'})
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
                <strong>T.A.P. / Sigilli emersi:</strong> {activeT0.tapTipologia || 'N/D'} •{' '}
                {SIGILLI_META.filter(({ key }) => activeT0.sigilli[key] === 'SI').map((s) => s.label).join(', ') ||
                  'Nessun sigillo nelle risposte'}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Induttore / Indietro nel Tempo:</strong> {activeT0.induttoreResult || 'N/D'} • Età{' '}
                {activeT0.etaEventoCausa || 'N/D'} • {activeT0.giornoEvento || 'N/D'} •{' '}
                {activeT0.testimoneChiave || 'N/D'}
              </div>
            </div>

            {/* Azioni non distruttive di T0: nuovo ciclo (separato) oppure eliminazione completa */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setConfirmingNewCycle((v) => !v);
                  setConfirmingDeleteCycle(false);
                }}
                className="px-3.5 py-2 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs transition"
              >
                Avvia nuovo ciclo (nuova T0)
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDeleteCycle((v) => !v);
                  setConfirmingNewCycle(false);
                }}
                className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 font-bold text-xs transition"
              >
                Elimina questo ciclo
              </button>
            </div>

            {confirmingNewCycle && (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2.5 text-xs sm:text-sm text-indigo-950">
                <p className="font-semibold">
                  La T0 attuale resterà salvata e intatta; potrai ripetere o aggiornare i test e fissare una nuova T0 per il ciclo successivo. Vuoi procedere?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingNewCycle(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleStartNewCycle}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs"
                  >
                    Conferma nuovo ciclo
                  </button>
                </div>
              </div>
            )}

            {confirmingDeleteCycle && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2.5 text-xs sm:text-sm text-red-950">
                <p className="font-semibold">
                  Attenzione: questa operazione elimina definitivamente questa T0 e tutte le sue verifiche collegate (operazione irreversibile). Confermi?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={savingRemote}
                    onClick={() => setConfirmingDeleteCycle(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    disabled={savingRemote}
                    onClick={handleDeleteCurrentCycle}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs disabled:opacity-60"
                  >
                    {savingRemote ? 'Eliminazione...' : 'Elimina definitivamente'}
                  </button>
                </div>
              </div>
            )}
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
                              onClick={() => setScores((prev) => ({ ...prev, [key]: num }))}
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
                <strong>{missingScoreAreas.map((a) => a.label).join(', ')}</strong>).
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
                {savingRemote
                  ? 'Salvataggio in corso...'
                  : canUseVerifiedCloud
                    ? 'Salva verifica su Firestore'
                    : 'Salva verifica sul dispositivo'}
              </button>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SEZIONE 3: CONFRONTO T0 VS VERIFICHE SALVATE              */}
          {/* ========================================================= */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-serif font-bold text-lg sm:text-xl text-slate-900">
                3. Confronto T0 vs Verifiche ({store.checkins.length})
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
                        const label = MILESTONE_OPTIONS.find((m) => m.code === chk.milestone)?.label || chk.milestone;
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
