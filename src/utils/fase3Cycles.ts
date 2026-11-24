/* © 2027 Max Pisani - PACommunication. Tutti i diritti riservati. */
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { handleFirestoreError, OperationType } from './firestore';
import { PUNTI_DISTONICI_META, SIGILLI_META } from './AnalysisEngine';
import type { UserData } from '../types';

export type PuntiAreaKey = keyof NonNullable<UserData['puntiDistonici']>;
export type PuntiAreaValid = 'SI' | 'NO' | 'NON_APPLICABILE';
export type SigilloKey = keyof NonNullable<UserData['sigilli']>;
export type MilestoneCode = 'G1' | 'G7' | 'G14' | 'G21' | 'SUCCESSIVA';
export type Phase1TestId = 'tap' | 'induttore' | 'nome' | 'puntiDistonici' | 'sigilli';

export interface Phase1ValidationItem {
  id: Phase1TestId;
  label: string;
  status: 'valid' | 'incomplete' | 'missing';
  summaryText: string;
  reason?: string;
}

export interface Fase3T0Snapshot {
  cycleId: string;
  cycleNumber: number;
  createdAtIso: string;
  source: 'firestore' | 'local';
  puntiDistonici: Record<PuntiAreaKey, PuntiAreaValid>;
  puntoDistonicoFinale: string;
  sigilli: Record<SigilloKey, 'SI' | 'NO'>;
  sigilloFinale: string;
  induttoreResult: 'Destro' | 'Sinistro' | 'Non chiaro';
  tapTipologia: string;
  testNome: {
    nomeVero: 'SI' | 'NO';
    nomeFalso: 'SI' | 'NO';
  };
  etaEventoCausa: string;
  giornoEvento: string;
  testimoneChiave: string;
}

export interface Fase3CheckinEntry {
  id: string;
  cycleId: string;
  createdAtIso: string;
  milestone: MilestoneCode;
  aree: Record<PuntiAreaKey, number | 'NON_APPLICABILE'>;
  testNomeSnapshot?: {
    nomeVero: 'SI' | 'NO' | 'NON_RILEVATO';
    nomeFalso: 'SI' | 'NO' | 'NON_RILEVATO';
  };
}

export interface Fase3LocalStore {
  t0: Fase3T0Snapshot | null;
  checkins: Fase3CheckinEntry[];
  nextCycleNumber?: number;
}

export const FASE3_STORAGE_KEY = 'analogista_fase3_local_v1';

export function validateDraftT0(userData: UserData): {
  isValid: boolean;
  items: Phase1ValidationItem[];
} {
  const done = userData.completedTests ?? {};
  const items: Phase1ValidationItem[] = [];

  // 1. Test T.A.P.
  const tapRes = userData.testTAP?.results;
  const tapDiag = userData.testTAP?.diagnosis;
  const tapReactionsValid = Boolean(
    tapRes &&
      ['SI', 'NO', 'NEUTRO'].includes(tapRes.cerchio) &&
      ['SI', 'NO', 'NEUTRO'].includes(tapRes.asta) &&
      ['SI', 'NO', 'NEUTRO'].includes(tapRes.triangolo)
  );
  if (!done.tap) {
    items.push({
      id: 'tap',
      label: '1. Test T.A.P.',
      status: 'missing',
      summaryText: 'Non ancora eseguito',
      reason: 'Completa il Test T.A.P.',
    });
  } else if (!tapDiag?.isValid || !tapDiag.tipologia?.trim() || !tapReactionsValid) {
    items.push({
      id: 'tap',
      label: '1. Test T.A.P.',
      status: 'incomplete',
      summaryText: tapDiag?.tipologia || 'Esito non completo / non rilevato',
      reason: 'Il Test T.A.P. contiene risposte mancanti o «Non rilevato»: ripetilo prima di congelare T0.',
    });
  } else {
    items.push({
      id: 'tap',
      label: '1. Test T.A.P.',
      status: 'valid',
      summaryText: tapDiag.tipologia,
    });
  }

  // 2. Test Induttore
  const indRes = userData.induttoreResult;
  const indValid = indRes === 'Destro' || indRes === 'Sinistro' || indRes === 'Non chiaro';
  if (!done.induttore) {
    items.push({
      id: 'induttore',
      label: '2. Test Induttore',
      status: 'missing',
      summaryText: 'Non ancora eseguito',
      reason: 'Completa il Test Induttore.',
    });
  } else if (!indValid) {
    items.push({
      id: 'induttore',
      label: '2. Test Induttore',
      status: 'incomplete',
      summaryText: 'Esito non rilevato',
      reason: 'Esito Test Induttore mancante: ripetilo prima di congelare T0.',
    });
  } else {
    items.push({
      id: 'induttore',
      label: '2. Test Induttore',
      status: 'valid',
      summaryText: indRes,
    });
  }

  // 3. Test del Nome
  const nomeVero = userData.testNome?.nomeVero;
  const nomeFalso = userData.testNome?.nomeFalso;
  const nomeValid = (nomeVero === 'SI' || nomeVero === 'NO') && (nomeFalso === 'SI' || nomeFalso === 'NO');
  if (!done.nome) {
    items.push({
      id: 'nome',
      label: '3. Test del Nome',
      status: 'missing',
      summaryText: 'Non ancora eseguito',
      reason: 'Completa il Test del Nome.',
    });
  } else if (!nomeValid) {
    items.push({
      id: 'nome',
      label: '3. Test del Nome',
      status: 'incomplete',
      summaryText: 'Risposta Sì/No non rilevata',
      reason: 'Nel Test del Nome manca una risposta valida Sì/No: ripetilo prima di congelare T0.',
    });
  } else {
    items.push({
      id: 'nome',
      label: '3. Test del Nome',
      status: 'valid',
      summaryText: `Nome vero: ${nomeVero === 'SI' ? 'Sì' : 'No'} • Nome falso: ${nomeFalso === 'SI' ? 'Sì' : 'No'}`,
    });
  }

  // 4. Test Punti Distonici
  const pd = userData.puntiDistonici;
  const pdValues = PUNTI_DISTONICI_META.map(({ key }) => pd?.[key]);
  const allPdResolved = pdValues.every((v) => v === 'SI' || v === 'NO' || v === 'NON_APPLICABILE');
  const hasApplicablePd = pdValues.some((v) => v === 'SI' || v === 'NO');
  if (!done.puntiDistonici) {
    items.push({
      id: 'puntiDistonici',
      label: '4. Test Punti Distonici',
      status: 'missing',
      summaryText: 'Non ancora eseguito',
      reason: 'Completa il Test dei Punti Distonici.',
    });
  } else if (!allPdResolved || !hasApplicablePd) {
    items.push({
      id: 'puntiDistonici',
      label: '4. Test Punti Distonici',
      status: 'incomplete',
      summaryText: 'Aree incomplete o «Non rilevato»',
      reason: !hasApplicablePd
        ? 'Almeno un’area dei Punti Distonici deve avere risposta Sì o No.'
        : 'Una o più aree risultano «Non rilevato» o mancanti: ripeti il test prima di congelare T0.',
    });
  } else {
    const emerse = PUNTI_DISTONICI_META.filter(({ key }) => pd?.[key] === 'SI').map((a) => a.label);
    items.push({
      id: 'puntiDistonici',
      label: '4. Test Punti Distonici',
      status: 'valid',
      summaryText: emerse.length > 0 ? `Emerse: ${emerse.join(', ')}` : 'Tutte le aree applicabili completate (nessuna distonia)',
    });
  }

  // 5. Test Sigilli e Vincoli
  const sig = userData.sigilli;
  const allSigResolved = SIGILLI_META.every(({ key }) => sig?.[key] === 'SI' || sig?.[key] === 'NO');
  if (!done.sigilli) {
    items.push({
      id: 'sigilli',
      label: '5. Test Sigilli e Vincoli',
      status: 'missing',
      summaryText: 'Non ancora eseguito',
      reason: 'Completa il Test Sigilli e Vincoli.',
    });
  } else if (!allSigResolved) {
    items.push({
      id: 'sigilli',
      label: '5. Test Sigilli e Vincoli',
      status: 'incomplete',
      summaryText: 'Sigilli incompleti o «Non rilevato»',
      reason: 'Uno o più sigilli risultano «Non rilevato» o mancanti: ripeti il test prima di congelare T0.',
    });
  } else {
    const emersi = SIGILLI_META.filter(({ key }) => sig?.[key] === 'SI').map((s) => s.label);
    items.push({
      id: 'sigilli',
      label: '5. Test Sigilli e Vincoli',
      status: 'valid',
      summaryText: emersi.length > 0 ? `Emersi: ${emersi.join(', ')}` : 'Tutti i sigilli completati (nessuno emerso)',
    });
  }

  return {
    isValid: items.every((i) => i.status === 'valid'),
    items,
  };
}

export function buildT0SnapshotFromUserData(
  userData: UserData,
  cycleId: string,
  cycleNumber: number,
  source: 'firestore' | 'local'
): Fase3T0Snapshot {
  const mapPd = (v: string | undefined): PuntiAreaValid =>
    v === 'SI' || v === 'NO' || v === 'NON_APPLICABILE' ? v : 'NO';
  const mapBin = (v: string | undefined): 'SI' | 'NO' => (v === 'SI' ? 'SI' : 'NO');

  return {
    cycleId,
    cycleNumber,
    createdAtIso: new Date().toISOString(),
    source,
    puntiDistonici: {
      famiglia: mapPd(userData.puntiDistonici?.famiglia),
      famigliaAcquisita: mapPd(userData.puntiDistonici?.famigliaAcquisita),
      sentimentali: mapPd(userData.puntiDistonici?.sentimentali),
      sessuali: mapPd(userData.puntiDistonici?.sessuali),
      autorealizzazione: mapPd(userData.puntiDistonici?.autorealizzazione),
    },
    puntoDistonicoFinale: (userData.puntoDistonicoFinale || '').trim().slice(0, 120),
    sigilli: {
      colpa: mapBin(userData.sigilli?.colpa),
      abbandono: mapBin(userData.sigilli?.abbandono),
      disistima: mapBin(userData.sigilli?.disistima),
      giudizio: mapBin(userData.sigilli?.giudizio),
    },
    sigilloFinale: (userData.sigilloFinale || '').trim().slice(0, 120),
    induttoreResult:
      userData.induttoreResult === 'Destro' ||
      userData.induttoreResult === 'Sinistro' ||
      userData.induttoreResult === 'Non chiaro'
        ? userData.induttoreResult
        : 'Non chiaro',
    tapTipologia: (userData.testTAP?.diagnosis?.tipologia || '').trim().slice(0, 120),
    testNome: {
      nomeVero: mapBin(userData.testNome?.nomeVero),
      nomeFalso: mapBin(userData.testNome?.nomeFalso),
    },
    etaEventoCausa: (userData.timeLine?.etaEventoCausa || '').trim().slice(0, 40),
    giornoEvento: (userData.giornoEvento || '').trim().slice(0, 80),
    testimoneChiave: (userData.testimoneChiave || '').trim().slice(0, 120),
  };
}

export function generateFirestoreSafeId(prefix: 'cyc' | 'chk'): string {
  const rand = Math.random().toString(36).slice(2, 8).replace(/[^a-zA-Z0-9]/g, 'x');
  return `${prefix}_${Date.now()}_${rand}`;
}

export function readLocalFase3(): Fase3LocalStore {
  try {
    const raw = localStorage.getItem(FASE3_STORAGE_KEY);
    if (!raw) return { t0: null, checkins: [], nextCycleNumber: 1 };
    const parsed = JSON.parse(raw) as Partial<Fase3LocalStore>;
    const t0 = parsed && parsed.t0 && typeof parsed.t0 === 'object' ? (parsed.t0 as Fase3T0Snapshot) : null;
    if (t0 && !t0.cycleId) {
      t0.cycleId = 'cyc_local_1';
      t0.cycleNumber = t0.cycleNumber || 1;
      t0.source = 'local';
    }
    return {
      t0,
      checkins: Array.isArray(parsed?.checkins) ? parsed.checkins : [],
      nextCycleNumber: typeof parsed?.nextCycleNumber === 'number' ? parsed.nextCycleNumber : 1,
    };
  } catch {
    return { t0: null, checkins: [], nextCycleNumber: 1 };
  }
}

export function writeLocalFase3(store: Fase3LocalStore): void {
  try {
    localStorage.setItem(FASE3_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('Errore nel salvataggio locale Fase 3:', error);
  }
}

function toIsoFromTimestamp(ts: unknown): string {
  if (ts && typeof (ts as Timestamp).toDate === 'function') {
    return (ts as Timestamp).toDate().toISOString();
  }
  return new Date().toISOString();
}

export async function loadRemoteCyclesAndLatest(uid: string): Promise<{
  latestT0: Fase3T0Snapshot | null;
  checkins: Fase3CheckinEntry[];
  totalCycles: number;
}> {
  try {
    const cyclesQuery = query(collection(db, 'cycles'), where('userId', '==', uid));
    const snap = await getDocs(cyclesQuery);
    if (snap.empty) {
      return { latestT0: null, checkins: [], totalCycles: 0 };
    }

    const docs = snap.docs
      .map((d) => {
        const data = d.data() as Record<string, any>;
        const millis =
          data.createdAt && typeof data.createdAt.toMillis === 'function'
            ? data.createdAt.toMillis()
            : 0;
        return { id: d.id, data, millis };
      })
      .sort((a, b) => b.millis - a.millis);

    const latest = docs[0];
    const d = latest.data;
    const latestT0: Fase3T0Snapshot = {
      cycleId: latest.id,
      cycleNumber: typeof d.cycleNumber === 'number' ? d.cycleNumber : docs.length,
      createdAtIso: toIsoFromTimestamp(d.createdAt),
      source: 'firestore',
      puntiDistonici: d.puntiDistonici,
      puntoDistonicoFinale: d.puntoDistonicoFinale || '',
      sigilli: d.sigilli,
      sigilloFinale: d.sigilloFinale || '',
      induttoreResult: d.induttoreResult,
      tapTipologia: d.tapTipologia || '',
      testNome: d.testNome || { nomeVero: 'SI', nomeFalso: 'NO' },
      etaEventoCausa: d.etaEventoCausa || '',
      giornoEvento: d.giornoEvento || '',
      testimoneChiave: d.testimoneChiave || '',
    };

    const checkinsPath = `cycles/${latest.id}/checkins`;
    const checkinsQuery = query(collection(db, checkinsPath), where('userId', '==', uid));
    const chkSnap = await getDocs(checkinsQuery);
    const checkins: Fase3CheckinEntry[] = chkSnap.docs
      .map((c) => {
        const cData = c.data() as Record<string, any>;
        const millis =
          cData.createdAt && typeof cData.createdAt.toMillis === 'function'
            ? cData.createdAt.toMillis()
            : 0;
        return {
          millis,
          entry: {
            id: c.id,
            cycleId: latest.id,
            createdAtIso: toIsoFromTimestamp(cData.createdAt),
            milestone: cData.milestone as MilestoneCode,
            aree: cData.aree,
            testNomeSnapshot: cData.testNomeSnapshot,
          } satisfies Fase3CheckinEntry,
        };
      })
      .sort((a, b) => a.millis - b.millis)
      .map((item) => item.entry);

    return { latestT0, checkins, totalCycles: docs.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'cycles');
    return { latestT0: null, checkins: [], totalCycles: 0 };
  }
}

export async function freezeCycleT0ToFirestore(
  uid: string,
  snapshot: Fase3T0Snapshot
): Promise<void> {
  const path = `cycles/${snapshot.cycleId}`;
  const payload: Record<string, unknown> = {
    userId: uid,
    cycleNumber: snapshot.cycleNumber,
    locked: true,
    createdAt: serverTimestamp(),
    puntiDistonici: snapshot.puntiDistonici,
    sigilli: snapshot.sigilli,
    induttoreResult: snapshot.induttoreResult,
    tapTipologia: snapshot.tapTipologia,
    testNome: snapshot.testNome,
  };

  if (snapshot.puntoDistonicoFinale) payload.puntoDistonicoFinale = snapshot.puntoDistonicoFinale;
  if (snapshot.sigilloFinale) payload.sigilloFinale = snapshot.sigilloFinale;
  if (snapshot.etaEventoCausa) payload.etaEventoCausa = snapshot.etaEventoCausa;
  if (snapshot.giornoEvento) payload.giornoEvento = snapshot.giornoEvento;
  if (snapshot.testimoneChiave) payload.testimoneChiave = snapshot.testimoneChiave;

  try {
    await setDoc(doc(db, 'cycles', snapshot.cycleId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveCheckinToFirestore(
  uid: string,
  entry: Fase3CheckinEntry
): Promise<void> {
  const path = `cycles/${entry.cycleId}/checkins/${entry.id}`;
  const payload: Record<string, unknown> = {
    userId: uid,
    cycleId: entry.cycleId,
    milestone: entry.milestone,
    createdAt: serverTimestamp(),
    aree: entry.aree,
  };

  if (entry.testNomeSnapshot) {
    payload.testNomeSnapshot = entry.testNomeSnapshot;
  }

  try {
    await setDoc(doc(db, 'cycles', entry.cycleId, 'checkins', entry.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCycleFromFirestore(
  cycleId: string,
  checkinIds: string[]
): Promise<void> {
  const path = `cycles/${cycleId}`;
  try {
    const batch = writeBatch(db);
    for (const cid of checkinIds) {
      batch.delete(doc(db, 'cycles', cycleId, 'checkins', cid));
    }
    batch.delete(doc(db, 'cycles', cycleId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
