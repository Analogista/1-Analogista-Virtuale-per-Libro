/* © 2027 Max Pisani - PACommunication. Tutti i diritti riservati. */
import { UserData } from '../types';

export const NOT_AVAILABLE = 'Dato non disponibile';

export const PUNTI_DISTONICI_META: {
  key: keyof NonNullable<UserData['puntiDistonici']>;
  label: string;
}[] = [
  { key: 'famiglia', label: "Famiglia d'origine" },
  { key: 'famigliaAcquisita', label: 'Famiglia acquisita' },
  { key: 'sentimentali', label: 'Relazioni sentimentali e affettive' },
  { key: 'sessuali', label: 'Relazioni passionali e sessuali' },
  { key: 'autorealizzazione', label: 'Autorealizzazione, hobby e lavoro' },
];

export const SIGILLI_META: {
  key: keyof NonNullable<UserData['sigilli']>;
  label: string;
  labelWithAlias: string;
}[] = [
  { key: 'colpa', label: 'Sensi di colpa', labelWithAlias: 'Sensi di colpa' },
  { key: 'abbandono', label: "Paura dell'abbandono", labelWithAlias: "Paura dell'abbandono" },
  { key: 'giudizio', label: 'Timore del giudizio', labelWithAlias: 'Timore del giudizio' },
  {
    key: 'disistima',
    label: 'Mancanza di autostima',
    labelWithAlias: 'Mancanza di autostima (disistima)',
  },
];

export interface TortoComparison {
  status: 'concordi' | 'discordanti' | 'non_determinabile';
  label: string;
  explanation: string;
}

export interface NormalizedReportData {
  hasAnyTestData: boolean;
  nome: string;
  eta: string;
  genere: string;
  problema: string;
  tap: {
    hasData: boolean;
    isValid: boolean;
    tipologia: string;
    polarita: string;
    distonia: string;
    avanti: string;
    indietro: string;
    dinamica: string;
    rawResults: {
      cerchio: string;
      asta: string;
      triangolo: string;
    };
  };
  induttore: {
    hasData: boolean;
    risultato: 'Destro' | 'Sinistro' | 'Non chiaro' | '';
    risultatoLabel: string;
    faseArchetipo: string;
    tema: string;
    manoDestra: string;
    manoSinistra: string;
  };
  testNome: {
    hasData: boolean;
    nomeVero: string;
    nomeFalso: string;
    statoCalibrazione: string;
  };
  puntiDistonici: {
    hasData: boolean;
    isComplete: boolean;
    isPartial: boolean;
    validCount: number;
    applicableCount: number;
    totalCount: number;
    missingLabels: string[];
    areeNonApplicabili: string[];
    prioritario: string;
    areeDistoniche: string[];
    areeSoddisfatte: string[];
    dettaglio: { key: string; label: string; raw: string; display: string }[];
  };
  sigilli: {
    hasData: boolean;
    isComplete: boolean;
    isPartial: boolean;
    validCount: number;
    totalCount: number;
    missingLabels: string[];
    prioritario: string;
    emersi: string[];
    dettaglio: { key: string; label: string; raw: string; display: string }[];
  };
  timeLine: {
    hasData: boolean;
    etaEventoCausa: string;
    hasValidAge: boolean;
    diagnosi: string;
    pu: string;
    pt: string;
    cdt: string;
  };
  passo5: {
    hasData: boolean;
    giornoEventoDisplay: string;
    hasGiornoEvento: boolean;
    testimoneDisplay: string;
    testimoneInQuestion: string;
    hasTestimoneIdentificato: boolean;
    domandaGiustificato: string;
    rispostaGiustificatoRaw: 'SI' | 'NO' | '';
    rispostaGiustificatoDisplay: string;
    significatoReazione: string;
    domandaAvrestiDovuto: string;
    rispostaAvrestiDovutoRaw: 'SI' | 'NO' | '';
    rispostaAvrestiDovutoDisplay: string;
    confronto: TortoComparison;
  };
}

export interface AnalysisSummary {
  hasAnyTestData: boolean;
  data: NormalizedReportData;
  disclaimer: string;
  profiloTAP: string;
  faseInconscia: string;
  calibrazioneNome: string;
  areaConflitto: string;
  sigilloDifesa: string;
  imprintingTimeline: string;
  meccanismoReattivo: string;
  sintesiCompleta: string;
  consiglioAnalogico: string;
  speechSections: string[];
}

const SEASONS = ['Primavera', 'Estate', 'Autunno', 'Inverno'];

export function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidSiNo(value: unknown): value is 'SI' | 'NO' {
  return value === 'SI' || value === 'NO';
}

export function formatSiNoLabel(value: unknown): string {
  if (value === 'SI') return 'SÌ';
  if (value === 'NO') return 'NO';
  return NOT_AVAILABLE;
}

export function formatSigilloLabel(value: string): string {
  const clean = safeString(value);
  if (!clean) return NOT_AVAILABLE;
  if (/mancanza di autostima/i.test(clean) && !/disistima/i.test(clean)) {
    return clean.replace(/mancanza di autostima/i, (m) => `${m} (disistima)`);
  }
  return clean;
}

function isNegativePriorityOutcome(value: string): boolean {
  return /\bnessun[ao]?\b/i.test(value);
}

export function formatGiornoEvento(value: unknown): { display: string; hasValid: boolean } {
  const clean = safeString(value);
  if (!clean || clean === 'NON_RILEVATO' || clean.toLowerCase() === 'non emersa') {
    return {
      display: clean.toLowerCase() === 'non emersa' ? `${NOT_AVAILABLE} (data non emersa)` : NOT_AVAILABLE,
      hasValid: false,
    };
  }
  if (SEASONS.includes(clean)) {
    return {
      display: `${clean} (giorno esatto non emerso)`,
      hasValid: true,
    };
  }
  return {
    display: clean,
    hasValid: true,
  };
}

export function formatTestimone(value: unknown): {
  display: string;
  inQuestion: string;
  isIdentified: boolean;
} {
  const clean = safeString(value);
  if (!clean || clean === 'NON_RILEVATO' || clean.toLowerCase() === 'non identificato') {
    return {
      display:
        clean.toLowerCase() === 'non identificato'
          ? `${NOT_AVAILABLE} (testimone non identificato)`
          : NOT_AVAILABLE,
      inQuestion: 'testimone non identificato',
      isIdentified: false,
    };
  }
  return {
    display: clean,
    inQuestion: clean,
    isIdentified: true,
  };
}

export function getTortoComparison(
  giustificato: unknown,
  avreiDovuto: unknown
): TortoComparison {
  if (isValidSiNo(giustificato) && isValidSiNo(avreiDovuto)) {
    if (giustificato === avreiDovuto) {
      return {
        status: 'concordi',
        label: 'Risposte concordi',
        explanation:
          'Le due risposte («Hai giustificato» e «Avresti dovuto giustificare») risultano concordi tra loro.',
      };
    }
    return {
      status: 'discordanti',
      label: 'Risposte discordanti',
      explanation:
        'Le due risposte risultano discordanti tra loro: secondo il modello analogico il conflitto si colloca in questo punto. Il manuale suggerisce di ripetere il test in un altro giorno ripartendo dal Test del Nome; se la discordanza persiste, va considerata soltanto come un’ipotesi esplorativa da osservare.',
    };
  }

  return {
    status: 'non_determinabile',
    label: NOT_AVAILABLE,
    explanation:
      'Confronto tra le due risposte sul torto non determinabile perché almeno una delle due risposte (SÌ/NO) non è disponibile.',
  };
}

function formatArchetypeReaction(value: unknown): string {
  const clean = safeString(value);
  if (clean === 'SI') return 'SÌ (Avanti)';
  if (clean === 'NO') return 'NO (Indietro)';
  if (clean === 'NEUTRO') return 'Neutro';
  return NOT_AVAILABLE;
}

function formatDistonicAreaStatus(value: unknown): string {
  const clean = safeString(value);
  if (clean === 'NO') return 'Distonia emersa (NO)';
  if (clean === 'SI') return 'Soddisfazione / equilibrio (SÌ)';
  if (clean === 'NON_APPLICABILE') return 'Non applicabile';
  return NOT_AVAILABLE;
}

function formatSigilloItemStatus(value: unknown): string {
  const clean = safeString(value);
  if (clean === 'SI') return 'Emerso (SÌ)';
  if (clean === 'NO') return 'Non emerso (NO)';
  return NOT_AVAILABLE;
}

export function normalizeReportData(userData: UserData | Partial<UserData> | undefined): NormalizedReportData {
  const safeUser = (userData && typeof userData === 'object' ? userData : {}) as Partial<UserData>;

  const nome = safeString(safeUser.nome) || NOT_AVAILABLE;
  const etaRaw = safeString(safeUser.eta);
  const eta = etaRaw && !Number.isNaN(Number(etaRaw)) ? `${etaRaw} anni` : etaRaw || NOT_AVAILABLE;
  const genereRaw = safeString(safeUser.genere);
  const genere =
    genereRaw === 'MASCHIO'
      ? 'Maschio'
      : genereRaw === 'FEMMINA'
      ? 'Femmina'
      : NOT_AVAILABLE;
  const problema = safeString(safeUser.problema) || NOT_AVAILABLE;

  // T.A.P.
  const tapObj = safeUser.testTAP;
  const tapDiag = tapObj?.diagnosis;
  const tapValid = Boolean(tapDiag?.isValid && safeString(tapDiag?.tipologia));
  const cerchioRaw = safeString(tapObj?.results?.cerchio);
  const astaRaw = safeString(tapObj?.results?.asta);
  const triangoloRaw = safeString(tapObj?.results?.triangolo);
  const tapHasResults = Boolean(
    (cerchioRaw && cerchioRaw !== 'NON_RILEVATO') ||
      (astaRaw && astaRaw !== 'NON_RILEVATO') ||
      (triangoloRaw && triangoloRaw !== 'NON_RILEVATO')
  );
  const tapTipologia = tapValid ? safeString(tapDiag?.tipologia) : NOT_AVAILABLE;
  const tapDistonia = tapValid ? safeString(tapDiag?.distonia) || NOT_AVAILABLE : NOT_AVAILABLE;
  const tapPolaritaRaw = safeString(tapDiag?.profilo?.polarita);
  const tapPolarita = tapValid
    ? tapPolaritaRaw ||
      (/essere/i.test(tapDistonia) || /essere/i.test(tapTipologia)
        ? 'Polarità Essere'
        : /avere/i.test(tapDistonia) || /avere/i.test(tapTipologia)
        ? 'Polarità Avere'
        : /equilibrio/i.test(tapDistonia)
        ? 'Equilibrio triadico'
        : NOT_AVAILABLE)
    : NOT_AVAILABLE;

  const tap = {
    hasData: tapValid || tapHasResults,
    isValid: tapValid,
    tipologia: tapTipologia,
    polarita: tapPolarita,
    distonia: tapDistonia,
    avanti: tapValid ? safeString(tapDiag?.avanti) || NOT_AVAILABLE : NOT_AVAILABLE,
    indietro: tapValid ? safeString(tapDiag?.indietro) || NOT_AVAILABLE : NOT_AVAILABLE,
    dinamica: tapValid ? safeString(tapDiag?.dinamica) || NOT_AVAILABLE : NOT_AVAILABLE,
    rawResults: {
      cerchio: formatArchetypeReaction(cerchioRaw),
      asta: formatArchetypeReaction(astaRaw),
      triangolo: formatArchetypeReaction(triangoloRaw),
    },
  };

  // Induttore (strictly separated from T.A.P.)
  const induttoreRes =
    safeUser.induttoreResult === 'Destro' ||
    safeUser.induttoreResult === 'Sinistro' ||
    safeUser.induttoreResult === 'Non chiaro'
      ? safeUser.induttoreResult
      : '';
  const manoDestraRaw = safeString(safeUser.testInduttore?.manoDestra);
  const manoSinistraRaw = safeString(safeUser.testInduttore?.manoSinistra);
  const induttoreHasHands = Boolean(
    (manoDestraRaw && manoDestraRaw !== 'Non Rilevato') ||
      (manoSinistraRaw && manoSinistraRaw !== 'Non Rilevato')
  );
  const induttore = {
    hasData: Boolean(induttoreRes) || induttoreHasHands,
    risultato: induttoreRes as 'Destro' | 'Sinistro' | 'Non chiaro' | '',
    risultatoLabel:
      induttoreRes === 'Destro'
        ? 'Induttore Destro'
        : induttoreRes === 'Sinistro'
        ? 'Induttore Sinistro'
        : induttoreRes === 'Non chiaro'
        ? 'Non chiaro'
        : NOT_AVAILABLE,
    faseArchetipo:
      induttoreRes === 'Destro'
        ? 'Fase Istituzionale (Grillo Parlante)'
        : induttoreRes === 'Sinistro'
        ? 'Fase Trasgressiva (Lucignolo)'
        : induttoreRes === 'Non chiaro'
        ? 'Esito ambivalente / Non chiaro'
        : NOT_AVAILABLE,
    tema:
      induttoreRes === 'Destro'
        ? 'Tema della libertà'
        : induttoreRes === 'Sinistro'
        ? 'Tema del sogno'
        : induttoreRes === 'Non chiaro'
        ? 'Nessuna polarità forzata (consigliata una breve pausa prima di un eventuale secondo tentativo)'
        : NOT_AVAILABLE,
    manoDestra: manoDestraRaw && manoDestraRaw !== 'Non Rilevato' ? manoDestraRaw : NOT_AVAILABLE,
    manoSinistra: manoSinistraRaw && manoSinistraRaw !== 'Non Rilevato' ? manoSinistraRaw : NOT_AVAILABLE,
  };

  // Test del Nome (only Sì/No calibration verification, never personality profile)
  const nomeVeroRaw = safeString(safeUser.testNome?.nomeVero);
  const nomeFalsoRaw = safeString(safeUser.testNome?.nomeFalso);
  const testNomeHasData = Boolean(
    (nomeVeroRaw && nomeVeroRaw !== 'NON_RILEVATO') ||
      (nomeFalsoRaw && nomeFalsoRaw !== 'NON_RILEVATO')
  );
  let statoCalibrazione = NOT_AVAILABLE;
  if (isValidSiNo(nomeVeroRaw) && isValidSiNo(nomeFalsoRaw)) {
    statoCalibrazione =
      nomeVeroRaw === 'SI' && nomeFalsoRaw === 'NO'
        ? 'Verifica Sì/No coerente (SÌ al nome vero, NO al nome falso)'
        : 'Coppia Sì/No non coerente: è opportuno ripetere la verifica prima dei test successivi';
  } else if (testNomeHasData) {
    statoCalibrazione = 'Verifica Sì/No parziale';
  }
  const testNome = {
    hasData: testNomeHasData,
    nomeVero: formatSiNoLabel(nomeVeroRaw),
    nomeFalso: formatSiNoLabel(nomeFalsoRaw),
    statoCalibrazione,
  };

  // 5 Punti Distonici (completo quando tutte le aree applicabili hanno risposta SI o NO valida)
  const pdObj = (safeUser.puntiDistonici && typeof safeUser.puntiDistonici === 'object'
    ? safeUser.puntiDistonici
    : {}) as Partial<UserData['puntiDistonici']>;
  const pdDettaglio = PUNTI_DISTONICI_META.map((item) => {
    const raw = safeString(pdObj[item.key]);
    return {
      key: item.key,
      label: item.label,
      raw,
      display: formatDistonicAreaStatus(raw),
    };
  });
  const pdApplicableItems = pdDettaglio.filter((d) => d.raw !== 'NON_APPLICABILE');
  const pdNonApplicabili = pdDettaglio.filter((d) => d.raw === 'NON_APPLICABILE').map((d) => d.label);
  const pdValidCount = pdApplicableItems.filter((d) => isValidSiNo(d.raw)).length;
  const pdApplicableCount = pdApplicableItems.length;
  const pdTotalCount = PUNTI_DISTONICI_META.length;
  const pdMissingLabels = pdApplicableItems.filter((d) => !isValidSiNo(d.raw)).map((d) => d.label);
  const pdIsComplete = pdApplicableCount > 0 && pdValidCount === pdApplicableCount;
  const pdIsPartial = pdValidCount > 0 && pdValidCount < pdApplicableCount;
  const pdHasData = pdValidCount > 0;
  const areeDistoniche = pdDettaglio.filter((d) => d.raw === 'NO').map((d) => d.label);
  const areeSoddisfatte = pdDettaglio.filter((d) => d.raw === 'SI').map((d) => d.label);
  const pdPrioritarioRaw = safeString(safeUser.puntoDistonicoFinale);
  let pdPrioritario = NOT_AVAILABLE;
  if (pdIsComplete) {
    pdPrioritario = pdPrioritarioRaw || NOT_AVAILABLE;
  } else if (pdIsPartial) {
    pdPrioritario =
      pdPrioritarioRaw && !isNegativePriorityOutcome(pdPrioritarioRaw)
        ? `${pdPrioritarioRaw} (su risultato parziale: ${pdValidCount} su ${pdApplicableCount} risposte valide)`
        : `${NOT_AVAILABLE} (risultato parziale: ${pdValidCount} su ${pdApplicableCount} risposte valide)`;
  }
  const puntiDistonici = {
    hasData: pdHasData,
    isComplete: pdIsComplete,
    isPartial: pdIsPartial,
    validCount: pdValidCount,
    applicableCount: pdApplicableCount,
    totalCount: pdTotalCount,
    missingLabels: pdMissingLabels,
    areeNonApplicabili: pdNonApplicabili,
    prioritario: pdPrioritario,
    areeDistoniche,
    areeSoddisfatte,
    dettaglio: pdDettaglio,
  };

  // 4 Sigilli (completo solo con tutte e 4 le risposte SI o NO valide)
  const sigObj = (safeUser.sigilli && typeof safeUser.sigilli === 'object'
    ? safeUser.sigilli
    : {}) as Partial<UserData['sigilli']>;
  const sigDettaglio = SIGILLI_META.map((item) => {
    const raw = safeString(sigObj[item.key]);
    return {
      key: item.key,
      label: item.labelWithAlias,
      raw,
      display: formatSigilloItemStatus(raw),
    };
  });
  const sigValidCount = sigDettaglio.filter((s) => isValidSiNo(s.raw)).length;
  const sigTotalCount = SIGILLI_META.length;
  const sigMissingLabels = sigDettaglio.filter((s) => !isValidSiNo(s.raw)).map((s) => s.label);
  const sigIsComplete = sigValidCount === sigTotalCount;
  const sigIsPartial = sigValidCount > 0 && sigValidCount < sigTotalCount;
  const sigHasData = sigValidCount > 0;
  const sigilliEmersi = sigDettaglio.filter((s) => s.raw === 'SI').map((s) => s.label);
  const sigPrioritarioRaw = safeString(safeUser.sigilloFinale);
  let sigPrioritario = NOT_AVAILABLE;
  if (sigIsComplete) {
    sigPrioritario = sigPrioritarioRaw ? formatSigilloLabel(sigPrioritarioRaw) : NOT_AVAILABLE;
  } else if (sigIsPartial) {
    sigPrioritario =
      sigPrioritarioRaw && !isNegativePriorityOutcome(sigPrioritarioRaw)
        ? `${formatSigilloLabel(sigPrioritarioRaw)} (su risultato parziale: ${sigValidCount} su ${sigTotalCount} risposte valide)`
        : `${NOT_AVAILABLE} (risultato parziale: ${sigValidCount} su ${sigTotalCount} risposte valide)`;
  }
  const sigilli = {
    hasData: sigHasData,
    isComplete: sigIsComplete,
    isPartial: sigIsPartial,
    validCount: sigValidCount,
    totalCount: sigTotalCount,
    missingLabels: sigMissingLabels,
    prioritario: sigPrioritario,
    emersi: sigilliEmersi,
    dettaglio: sigDettaglio,
  };

  // Time Line
  const tlObj = (safeUser.timeLine && typeof safeUser.timeLine === 'object'
    ? safeUser.timeLine
    : {}) as Partial<UserData['timeLine']>;
  const etaEventoRaw = safeString(tlObj.etaEventoCausa);
  const hasValidAge = Boolean(etaEventoRaw !== '' && !Number.isNaN(Number(etaEventoRaw)));
  const diagnosiRaw = safeString(tlObj.diagnosi);
  const puNum = typeof tlObj.PU === 'number' && Number.isFinite(tlObj.PU) ? tlObj.PU : null;
  const ptNum = typeof tlObj.PT === 'number' && Number.isFinite(tlObj.PT) ? tlObj.PT : null;
  const cdtNum = typeof tlObj.CDT === 'number' && Number.isFinite(tlObj.CDT) ? tlObj.CDT : null;
  const timeLine = {
    hasData: hasValidAge || Boolean(diagnosiRaw) || puNum !== null || ptNum !== null,
    etaEventoCausa: hasValidAge ? `${etaEventoRaw} anni` : NOT_AVAILABLE,
    hasValidAge,
    diagnosi: diagnosiRaw || NOT_AVAILABLE,
    pu: puNum !== null ? puNum.toFixed(1) : NOT_AVAILABLE,
    pt: ptNum !== null ? ptNum.toFixed(1) : NOT_AVAILABLE,
    cdt: cdtNum !== null ? cdtNum.toFixed(1) : NOT_AVAILABLE,
  };

  // Passo 5: Giorno, Testimone e Reazione al Torto (independent from Time Line age)
  const giornoInfo = formatGiornoEvento(safeUser.giornoEvento);
  const testimoneInfo = formatTestimone(safeUser.testimoneChiave);
  const giustificatoRaw = isValidSiNo(safeUser.giustificatoTorto) ? safeUser.giustificatoTorto : '';
  const avreiDovutoRaw = isValidSiNo(safeUser.avreiDovutoGiustificare)
    ? safeUser.avreiDovutoGiustificare
    : '';
  const confronto = getTortoComparison(giustificatoRaw, avreiDovutoRaw);

  let significatoReazione = NOT_AVAILABLE;
  if (giustificatoRaw === 'SI') {
    significatoReazione =
      'Nel modello analogico indica di aver accettato il torto senza dire la propria (meccanismo chiamato «dissociazione» nel lessico DAB; non costituisce diagnosi clinica né terapia).';
  } else if (giustificatoRaw === 'NO') {
    significatoReazione =
      "Nel modello analogico indica di aver reagito mantenendo la rabbia rivolta all'esterno (meccanismo chiamato «scissione» nel lessico DAB; non costituisce diagnosi clinica né terapia).";
  }

  const passo5 = {
    hasData:
      giornoInfo.hasValid ||
      testimoneInfo.isIdentified ||
      giustificatoRaw !== '' ||
      avreiDovutoRaw !== '' ||
      safeString(safeUser.giornoEvento).toLowerCase() === 'non emersa' ||
      safeString(safeUser.testimoneChiave).toLowerCase() === 'non identificato',
    giornoEventoDisplay: giornoInfo.display,
    hasGiornoEvento: giornoInfo.hasValid,
    testimoneDisplay: testimoneInfo.display,
    testimoneInQuestion: testimoneInfo.inQuestion,
    hasTestimoneIdentificato: testimoneInfo.isIdentified,
    domandaGiustificato: `Hai giustificato il torto ricevuto da ${testimoneInfo.inQuestion}?`,
    rispostaGiustificatoRaw: giustificatoRaw as 'SI' | 'NO' | '',
    rispostaGiustificatoDisplay: formatSiNoLabel(giustificatoRaw),
    significatoReazione,
    domandaAvrestiDovuto: 'Avresti dovuto giustificare?',
    rispostaAvrestiDovutoRaw: avreiDovutoRaw as 'SI' | 'NO' | '',
    rispostaAvrestiDovutoDisplay: formatSiNoLabel(avreiDovutoRaw),
    confronto,
  };

  const hasAnyTestData =
    tap.hasData ||
    induttore.hasData ||
    testNome.hasData ||
    puntiDistonici.hasData ||
    sigilli.hasData ||
    timeLine.hasData ||
    giornoInfo.hasValid ||
    testimoneInfo.isIdentified ||
    giustificatoRaw !== '' ||
    avreiDovutoRaw !== '';

  return {
    hasAnyTestData,
    nome,
    eta,
    genere,
    problema,
    tap,
    induttore,
    testNome,
    puntiDistonici,
    sigilli,
    timeLine,
    passo5,
  };
}

/**
 * Utility per l'analisi incrociata deterministica basata esclusivamente
 * sui dati reali salvati dall'utente e sui contenuti del manoscritto v18.
 * Non effettua chiamate AI o servizi esterni e non formula diagnosi cliniche.
 */
export function generateAnalogicalAnalysis(userData: UserData): AnalysisSummary {
  const data = normalizeReportData(userData);
  const disclaimer =
    'Nota metodologica: questo report restituisce una lettura esplorativa basata esclusivamente sul modello delle Discipline Analogiche Benemegliane e sui dati effettivamente registrati nei test. Non costituisce diagnosi clinica, valutazione medica o terapia, e gli elementi del passato (età, periodo, testimone e reazioni) vanno considerati come ipotesi di lavoro e non come fatti storici o ricordi accertati.';

  // 1. T.A.P. (Tipologia e Polarità Essere/Avere — sempre distinto dall'Induttore)
  const profiloTAP = data.tap.isValid
    ? `Tipologia rilevata: ${data.tap.tipologia}. Polarità / distonia: ${data.tap.polarita} (${data.tap.distonia}). Dinamica registrata: ${data.tap.dinamica}`
    : `${NOT_AVAILABLE} (Test T.A.P. non completato o non valido). Il risultato del T.A.P. resta sempre distinto da quello del Test Induttore.`;

  // 2. Induttore (Destro = Istituzionale / Grillo Parlante / Libertà; Sinistro = Trasgressivo / Lucignolo / Sogno; Non chiaro = ambivalente)
  let faseInconscia: string;
  if (data.induttore.risultato === 'Destro') {
    faseInconscia =
      'Induttore Destro: Fase Istituzionale (archetipo del Grillo Parlante), orientata al tema della libertà. Secondo il modello segnala una dinamica legata a regole, coerenza e confronto con i vincoli.';
  } else if (data.induttore.risultato === 'Sinistro') {
    faseInconscia =
      'Induttore Sinistro: Fase Trasgressiva (archetipo di Lucignolo), orientata al tema del sogno. Secondo il modello segnala una dinamica legata a desiderio, slancio emotivo e ricerca di appagamento.';
  } else if (data.induttore.risultato === 'Non chiaro') {
    faseInconscia = `Esito Induttore: Non chiaro (rilevazioni delle mani: Destra ${data.induttore.manoDestra}, Sinistra ${data.induttore.manoSinistra}). Le due mani hanno mostrato la stessa direzione senza polarità netta; puoi fare una breve pausa e ripetere una volta oppure lasciare registrato «Non chiaro».`;
  } else if (data.induttore.hasData) {
    faseInconscia = `${NOT_AVAILABLE} (rilevazioni delle mani registrate: Destra ${data.induttore.manoDestra}, Sinistra ${data.induttore.manoSinistra}; risultato Induttore netto non emerso).`;
  } else {
    faseInconscia = `${NOT_AVAILABLE} (Test Induttore non ancora completato).`;
  }

  // 3. Test del Nome (solo verifica Sì/No, MAI profilo di personalità)
  const calibrazioneNome = data.testNome.hasData
    ? `Verifica Sì/No (calibrazione del canale, non profilo di personalità): Nome vero = ${data.testNome.nomeVero}; Nome falso = ${data.testNome.nomeFalso}. Esito: ${data.testNome.statoCalibrazione}.`
    : `${NOT_AVAILABLE} (Test del Nome non completato; serve esclusivamente come verifica Sì/No di calibrazione e non definisce la personalità).`;

  // 4. Punti Distonici (aree applicabili + prioritario)
  let areaConflitto: string;
  const naSuffix =
    data.puntiDistonici.areeNonApplicabili.length > 0
      ? ` Aree contrassegnate come non applicabili: ${data.puntiDistonici.areeNonApplicabili.join(', ')}.`
      : '';
  if (!data.puntiDistonici.hasData) {
    areaConflitto = `${NOT_AVAILABLE} (Test Punti Distonici non completato: 0 su ${data.puntiDistonici.applicableCount} risposte SÌ/NO valide).${naSuffix}`;
  } else if (data.puntiDistonici.isPartial) {
    const missingText = data.puntiDistonici.missingLabels.join(', ');
    if (data.puntiDistonici.areeDistoniche.length > 0) {
      areaConflitto = `Risultato parziale (${data.puntiDistonici.validCount} su ${data.puntiDistonici.applicableCount} risposte valide; dati mancanti: ${missingText}). Punto distonico prioritario: ${data.puntiDistonici.prioritario}. Aree con segnale di distonia emerse finora (NO): ${data.puntiDistonici.areeDistoniche.join(', ')}.${naSuffix}`;
    } else {
      areaConflitto = `Risultato parziale (${data.puntiDistonici.validCount} su ${data.puntiDistonici.applicableCount} risposte valide; dati mancanti: ${missingText}). Punto distonico prioritario: ${data.puntiDistonici.prioritario}. Aree con segnale di distonia (NO): risultato parziale non conclusivo fino al completamento delle aree applicabili.${naSuffix}`;
    }
  } else {
    const emerseText =
      data.puntiDistonici.areeDistoniche.length > 0
        ? data.puntiDistonici.areeDistoniche.join(', ')
        : data.puntiDistonici.applicableCount === 5
        ? 'nessuna area distonica emersa nelle 5 risposte'
        : `nessuna area distonica emersa nelle ${data.puntiDistonici.applicableCount} aree applicabili`;
    areaConflitto = `Punto distonico prioritario: ${data.puntiDistonici.prioritario}. Aree con segnale di distonia (NO): ${emerseText}.${naSuffix}`;
  }

  // 5. Sigilli e Vincoli (tutti i SÌ emersi + prioritario)
  let sigilloDifesa: string;
  if (!data.sigilli.hasData) {
    sigilloDifesa = `${NOT_AVAILABLE} (Test Sigilli e Vincoli non completato: 0 su ${data.sigilli.totalCount} risposte SÌ/NO valide).`;
  } else if (data.sigilli.isPartial) {
    const missingText = data.sigilli.missingLabels.join(', ');
    if (data.sigilli.emersi.length > 0) {
      sigilloDifesa = `Risultato parziale (${data.sigilli.validCount} su ${data.sigilli.totalCount} risposte valide; dati mancanti: ${missingText}). Sigillo prioritario: ${data.sigilli.prioritario}. Sigilli emersi finora (SÌ): ${data.sigilli.emersi.join(', ')}.`;
    } else {
      sigilloDifesa = `Risultato parziale (${data.sigilli.validCount} su ${data.sigilli.totalCount} risposte valide; dati mancanti: ${missingText}). Sigillo prioritario: ${data.sigilli.prioritario}. Sigilli emersi (SÌ): risultato parziale non conclusivo fino al completamento di tutti e 4 i sigilli.`;
    }
  } else {
    const emersiText =
      data.sigilli.emersi.length > 0
        ? data.sigilli.emersi.join(', ')
        : 'nessun sigillo emerso nelle 4 risposte';
    sigilloDifesa = `Sigillo prioritario: ${data.sigilli.prioritario}. Tutti i sigilli emersi (SÌ): ${emersiText}.`;
  }

  // 6. Età ipotizzata, Giorno & Testimone (ipotesi esplorative, indipendenti tra loro — Scelta 1: nessun PU/PT/CDT esposto)
  const timelineParts: string[] = [];
  if (data.timeLine.hasValidAge) {
    timelineParts.push(`Età ipotizzata per l'evento: ${data.timeLine.etaEventoCausa}`);
  } else {
    timelineParts.push(`Età ipotizzata evento: ${NOT_AVAILABLE}`);
  }
  timelineParts.push(`Periodo / Giorno rilevato: ${data.passo5.giornoEventoDisplay}`);
  timelineParts.push(`Testimone chiave ipotizzato: ${data.passo5.testimoneDisplay}`);
  const imprintingTimeline =
    data.timeLine.hasValidAge || data.passo5.hasGiornoEvento || data.passo5.hasTestimoneIdentificato
      ? `${timelineParts.join('. ')}. (Elementi da intendere esclusivamente come ipotesi esplorative del modello, non come fatti o ricordi accertati).`
      : `${NOT_AVAILABLE} (Età ipotizzata, Giorno e Testimone non ancora rilevati).`;

  // 7. Reazione al Torto & Tendenze (domande distinte, concordi/discordanti solo se entrambe SÌ/NO)
  const tortoLines: string[] = [
    `${data.passo5.domandaGiustificato} Risposta: ${data.passo5.rispostaGiustificatoDisplay}.`,
    `${data.passo5.domandaAvrestiDovuto} Risposta: ${data.passo5.rispostaAvrestiDovutoDisplay}.`,
  ];

  if (data.passo5.rispostaGiustificatoRaw === 'SI' || data.passo5.rispostaGiustificatoRaw === 'NO') {
    tortoLines.push(data.passo5.significatoReazione);
  }

  if (data.passo5.confronto.status !== 'non_determinabile') {
    tortoLines.push(data.passo5.confronto.explanation);
  } else {
    tortoLines.push(
      `Confronto concordi/discordanti: ${NOT_AVAILABLE} (richiede entrambe le risposte SÌ o NO).`
    );
  }

  if (data.passo5.rispostaGiustificatoRaw === 'SI') {
    tortoLines.push(
      "Nota orientativa sulle tendenze (non automatica né certa): nel modello analogico il «SÌ» (aver giustificato) tende ad accompagnarsi più frequentemente a vissuti di colpa o paura dell'abbandono; fanno fede esclusivamente i sigilli emersi nel tuo test."
    );
  } else if (data.passo5.rispostaGiustificatoRaw === 'NO') {
    tortoLines.push(
      'Nota orientativa sulle tendenze (non automatica né certa): nel modello analogico il «NO» (non aver giustificato) tende ad accompagnarsi più frequentemente a timore del giudizio o mancanza di autostima (disistima); fanno fede esclusivamente i sigilli emersi nel tuo test.'
    );
  }

  const meccanismoReattivo = tortoLines.join(' ');

  // 8. Sintesi Completa Incrociata
  let sintesiCompleta: string;
  if (!data.hasAnyTestData) {
    sintesiCompleta = [
      `Gentile ${data.nome === NOT_AVAILABLE ? 'Utente' : data.nome}, al momento non risultano test completati sufficienti per elaborare un riepilogo incrociato.`,
      'Completa i test disponibili nella Home (in particolare I Tuoi Dati, T.A.P., Induttore, Punti Distonici, Sigilli e Vincoli e la ricerca causa su Età ipotizzata, Giorno e Testimone) per ottenere la sintesi basata sui tuoi esiti reali.',
      disclaimer,
    ].join('\n\n');
  } else {
    const paragraphs: string[] = [];
    const displayUserName = data.nome === NOT_AVAILABLE ? 'Utente' : data.nome;
    const problemClause =
      data.problema !== NOT_AVAILABLE
        ? `in relazione al tema indicato («${data.problema}»)`
        : '(tema/disagio non indicato nei dati iniziali)';

    paragraphs.push(
      `Gentile ${displayUserName}, questo riepilogo raccoglie e collega esclusivamente gli esiti reali emersi finora nei tuoi test ${problemClause}, secondo il modello del manoscritto DAB.`
    );

    const structureBits: string[] = [];
    if (data.tap.isValid) {
      structureBits.push(`nel T.A.P. risulta la tipologia «${data.tap.tipologia}» (${data.tap.polarita})`);
    } else {
      structureBits.push('il T.A.P. risulta al momento non disponibile');
    }

    if (data.induttore.risultato === 'Destro') {
      structureBits.push(
        "nell'Induttore risulta il lato Destro (Fase Istituzionale / Grillo Parlante, tema della libertà)"
      );
    } else if (data.induttore.risultato === 'Sinistro') {
      structureBits.push(
        "nell'Induttore risulta il lato Sinistro (Fase Trasgressiva / Lucignolo, tema del sogno)"
      );
    } else if (data.induttore.risultato === 'Non chiaro') {
      structureBits.push(
        "nell'Induttore l'esito è risultato Non chiaro (combinazione ambivalente)"
      );
    } else {
      structureBits.push("l'esito dell'Induttore risulta al momento non disponibile");
    }
    paragraphs.push(`Struttura e fase (test mantenuti distinti): ${structureBits.join('; ')}.`);

    const conflictBits: string[] = [];
    const pdNaText =
      data.puntiDistonici.areeNonApplicabili.length > 0
        ? `; non applicabili: ${data.puntiDistonici.areeNonApplicabili.join(', ')}`
        : '';
    if (!data.puntiDistonici.hasData) {
      conflictBits.push(`Punti Distonici: ${NOT_AVAILABLE}${pdNaText}`);
    } else if (data.puntiDistonici.isPartial) {
      const missingText = data.puntiDistonici.missingLabels.join(', ');
      const partialList =
        data.puntiDistonici.areeDistoniche.length > 0
          ? `aree distoniche emerse finora (NO): ${data.puntiDistonici.areeDistoniche.join(', ')}`
          : 'esito parziale non conclusivo fino al completamento delle aree applicabili';
      conflictBits.push(
        `Punti Distonici (risultato parziale, ${data.puntiDistonici.validCount}/${data.puntiDistonici.applicableCount} risposte valide; mancano: ${missingText}${pdNaText}) — prioritario: ${data.puntiDistonici.prioritario} (${partialList})`
      );
    } else {
      const distList =
        data.puntiDistonici.areeDistoniche.length > 0
          ? `aree distoniche emerse: ${data.puntiDistonici.areeDistoniche.join(', ')}`
          : data.puntiDistonici.applicableCount === 5
          ? 'nessuna area distonica emersa nelle 5 risposte'
          : `nessuna area distonica emersa nelle ${data.puntiDistonici.applicableCount} aree applicabili`;
      conflictBits.push(
        `Punti Distonici — prioritario: ${data.puntiDistonici.prioritario} (${distList}${pdNaText})`
      );
    }

    if (!data.sigilli.hasData) {
      conflictBits.push(`Sigilli: ${NOT_AVAILABLE}`);
    } else if (data.sigilli.isPartial) {
      const missingText = data.sigilli.missingLabels.join(', ');
      const partialList =
        data.sigilli.emersi.length > 0
          ? `sigilli emersi finora (SÌ): ${data.sigilli.emersi.join(', ')}`
          : 'esito parziale non conclusivo fino al completamento dei 4 sigilli';
      conflictBits.push(
        `Sigilli (risultato parziale, ${data.sigilli.validCount}/${data.sigilli.totalCount} risposte valide; mancano: ${missingText}) — prioritario: ${data.sigilli.prioritario} (${partialList})`
      );
    } else {
      const sigList =
        data.sigilli.emersi.length > 0
          ? `sigilli emersi: ${data.sigilli.emersi.join(', ')}`
          : 'nessun sigillo emerso nelle 4 risposte';
      conflictBits.push(`Sigilli — prioritario: ${data.sigilli.prioritario} (${sigList})`);
    }
    paragraphs.push(conflictBits.join('. ') + '.');

    const step5Bits: string[] = [];
    if (data.timeLine.hasValidAge) {
      step5Bits.push(`età ipotizzata ${data.timeLine.etaEventoCausa}`);
    }
    if (data.passo5.hasGiornoEvento) {
      step5Bits.push(`periodo/giorno ${data.passo5.giornoEventoDisplay}`);
    }
    if (data.passo5.hasTestimoneIdentificato) {
      step5Bits.push(`testimone ipotizzato «${data.passo5.testimoneDisplay}»`);
    }
    if (data.passo5.rispostaGiustificatoRaw) {
      const modeName =
        data.passo5.rispostaGiustificatoRaw === 'SI'
          ? 'ha giustificato (dissociazione nel lessico del modello)'
          : 'non ha giustificato (scissione nel lessico del modello)';
      step5Bits.push(`reazione al torto: ${modeName}`);
    }
    if (data.passo5.rispostaAvrestiDovutoRaw) {
      step5Bits.push(`«Avresti dovuto giustificare?»: ${data.passo5.rispostaAvrestiDovutoDisplay}`);
    }
    if (data.passo5.confronto.status !== 'non_determinabile') {
      step5Bits.push(`confronto risposte: ${data.passo5.confronto.status}`);
    }

    if (step5Bits.length > 0) {
      paragraphs.push(
        `Ipotesi esplorative sull'evento e sulla reazione al torto (non fatti né ricordi accertati): ${step5Bits.join('; ')}.`
      );
    } else {
      paragraphs.push(
        `Ipotesi esplorative (Età ipotizzata, Giorno, Testimone e Torto): ${NOT_AVAILABLE}.`
      );
    }

    paragraphs.push(disclaimer);
    sintesiCompleta = paragraphs.join('\n\n');
  }

  // 9. Nota orientativa finale (nessun consiglio inventato o prescrittivo)
  let consiglioAnalogico: string;
  if (!data.hasAnyTestData) {
    consiglioAnalogico =
      'Esegui i test in condizioni tranquille seguendo le indicazioni del libro, partendo dalla compilazione de «I Tuoi Dati» e dalla verifica di calibrazione del Test del Nome.';
  } else if (data.passo5.confronto.status === 'discordanti') {
    consiglioAnalogico =
      'Poiché le due risposte sul torto risultano discordanti, secondo le indicazioni del libro è consigliabile ripetere l’indagine in un altro giorno ripartendo dal Test del Nome. Usa questo quadro esclusivamente come traccia di osservazione personale.';
  } else {
    consiglioAnalogico =
      'Osserva gli esiti emersi come una mappa esplorativa personale da rileggere insieme ai capitoli del libro, senza attribuire valore di certezza storica o di diagnosi clinica ai singoli indicatori.';
  }

  const speechSections = [
    'Analisi Logica Incrociata.',
    `Sintesi Esplorativa. ${sintesiCompleta}`,
    `Profilo T.A.P. ${profiloTAP}`,
    `Fase e Induttore. ${faseInconscia}`,
    `Test del Nome. ${calibrazioneNome}`,
    `Punti Distonici. ${areaConflitto}`,
    `Sigilli e Vincoli. ${sigilloDifesa}`,
    `Età, Giorno e Testimone. ${imprintingTimeline}`,
    `Reazione al Torto. ${meccanismoReattivo}`,
    `Indicazione Metodologica. ${consiglioAnalogico}`,
  ];

  return {
    hasAnyTestData: data.hasAnyTestData,
    data,
    disclaimer,
    profiloTAP,
    faseInconscia,
    calibrazioneNome,
    areaConflitto,
    sigilloDifesa,
    imprintingTimeline,
    meccanismoReattivo,
    sintesiCompleta,
    consiglioAnalogico,
    speechSections,
  };
}
