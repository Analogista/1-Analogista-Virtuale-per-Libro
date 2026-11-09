export type SymbolType = 'cerchio' | 'asta' | 'triangolo';
export type SymbolReaction = 'SI' | 'NO' | 'NEUTRO' | 'NON_RILEVATO' | '';

export interface SymbolConfig {
  id: SymbolType;
  stepNumber: number;
  glyph: string;
  label: string;
  archetype: string;
  description: string;
  voicePrompt: string;
}

export const SYMBOLS_CONFIG: Record<SymbolType, SymbolConfig> = {
  cerchio: {
    id: 'cerchio',
    stepNumber: 1,
    glyph: 'O',
    label: 'CERCHIO (O)',
    archetype: 'Archetipo dell\'Io / Sé (O)',
    description: 'Egocentrismo, Identità, Autonomia, Centratura personale.',
    voicePrompt: 'Osserva ora il simbolo del Cerchio mentre avanza lentamente verso di te sullo schermo per 2 cicli. Lascia che il tuo corpo risponda oscillando liberamente in avanti o all\'indietro.'
  },
  asta: {
    id: 'asta',
    stepNumber: 2,
    glyph: '|',
    label: 'ASTA (|)',
    archetype: 'Archetipo Paterno (|)',
    description: 'Autorità, Regola, Dovere, Razionalità, Norma, Maschile.',
    voicePrompt: 'Osserva ora il simbolo dell\'Asta al centro dello schermo mentre avanza lentamente verso di te per 2 cicli. Lasciati andare e lascia che il tuo corpo oscilli liberamente in avanti o all\'indietro.'
  },
  triangolo: {
    id: 'triangolo',
    stepNumber: 3,
    glyph: 'Δ',
    label: 'TRIANGOLO (Δ)',
    archetype: 'Archetipo Materno (Δ)',
    description: 'Accoglienza, Affettività, Piacere, Emozione, Protezione, Femminile.',
    voicePrompt: 'Osserva ora il simbolo del Triangolo mentre avanza lentamente verso di te sullo schermo per 2 cicli. Lascia che il tuo inconscio risponda oscillando in avanti o all\'indietro.'
  }
};

export interface TapDiagnosisResult {
  isValid: boolean;
  tipologia: string;
  distonia: string;
  avanti: string;
  indietro: string;
  dinamica: string;
  profilo?: TapProfile;
}

export interface TapProfile {
  famiglia: string;
  referente: string;
  origine: string;
  stile: string;
  relazioni: string;
  polarita: string;
  meccanismo: string;
  orientamento: string;
}

export const enrichTapDiagnosis = (diagnosis: TapDiagnosisResult): TapDiagnosisResult => {
  if (!diagnosis.isValid) return diagnosis;

  const label = diagnosis.tipologia.toLowerCase();
  const distonia = diagnosis.distonia.toLowerCase();
  const isEgo = label.includes('ego');
  const isFather = label.includes('padre');
  const isMother = label.includes('madre');
  const isMaleEgo = label.includes('ego-maschio');
  const isFemaleEgo = label.includes('ego-femmina');
  const isBalanced = distonia.includes('equilibrio');
  const isBeing = distonia.includes('essere');

  let referente = 'Cerchio (Sé / identità)';
  let origine = 'Struttura integrata del rapporto con sé e con le figure genitoriali.';
  let stile = 'Approccio centrato sulla propria sensibilità simbolica e sulla ricerca di affidabilità.';
  let relazioni = 'Ricerca di considerazione, affidabilità e complementarità nella comunicazione.';

  if (isMaleEgo) {
    referente = 'Cerchio (Ego-Maschio)';
    origine = 'Ex-conflittualità materna: l’Ego assume il sesso del genitore ex-buono, il padre.';
    stile = 'Iper-logico, prescrittivo e didascalico; dispensatore di consigli e soluzioni esterne.';
    relazioni = 'Agonismo e competizione con le figure maschili; ricerca di affidabilità e dimostrazione del proprio valore.';
  } else if (isFemaleEgo) {
    referente = 'Cerchio (Ego-Femmina)';
    origine = 'Ex-conflittualità paterna: l’Ego assume la qualità del genitore ex-buono, la madre.';
    stile = 'Attento all’immagine, all’estetica, alla leadership e al giudizio altrui.';
    relazioni = 'Agonismo con le figure femminili e attenzione ai limiti o all’inaffidabilità di partner e collaboratori.';
  } else if (isFather) {
    referente = 'Asta (Padre / autorità)';
    origine = 'Conflitto primario legato alla figura paterna, all’autorità o alle regole.';
    stile = 'Accusatorio, colpevolizzante, impositivo e critico; tende a indicare limiti e difetti.';
    relazioni = 'Confronto diretto, schiettezza e possibile marcata gelosia; indica la strada senza sempre offrire la soluzione.';
  } else if (isMother) {
    referente = 'Triangolo (Madre / accoglienza)';
    origine = 'Conflitto primario legato alla figura materna o alle figure femminili.';
    stile = 'Protettivo, avvolgente e premuroso; tende a proporsi direttamente come soluzione ai problemi dell’altro.';
    relazioni = 'Apparente dolcezza e condizionamento affettivo; sensibilità al timore dell’abbandono e della disistima.';
  } else if (isEgo) {
    referente = 'Cerchio (Sé / triade)';
    origine = 'Struttura triadica con integrazione del rapporto con sé e con le figure genitoriali.';
    stile = 'Indicativo e prescrittivo, orientato a divieti, obblighi o soluzioni esterne.';
    relazioni = 'Ricerca di affidabilità e superamento dell’antagonismo attraverso una maggiore integrazione.';
  }

  return {
    ...diagnosis,
    profilo: {
      famiglia: isEgo ? 'Tipologia egocentrica' : 'Tipologia genitoriale',
      referente,
      origine,
      stile,
      relazioni,
      polarita: isBalanced ? 'Equilibrio triadico' : isBeing ? 'Distonia dell’Essere (Yin / passivo / role down)' : 'Distonia dell’Avere (Yang / attivo / role up)',
      meccanismo: isBalanced ? 'Integrazione e complementarità tra i referenti.' : isBeing ? 'Tendenza auto-attributiva: responsabilità e colpa vengono rivolte verso di sé.' : 'Tendenza etero-attributiva: responsabilità e colpa vengono rivolte verso l’esterno o l’antagonista.',
      orientamento: isBalanced ? 'Ricerca di equilibrio e integrazione.' : isBeing ? 'Orientamento al desiderio e alla conquista del sogno, con tempi graduali.' : 'Orientamento al possesso e al soddisfacimento del bisogno, con passaggio rapido all’azione.'
    }
  };
};

/**
 * Motore Diagnostico T.A.P. (Tipologia Analogica della Personalità) completo
 * basato sulle Discipline Analogiche di Stefano Benemeglio.
 */
export const computeTapDiagnosis = (
  results: Record<SymbolType, SymbolReaction>,
  genere: 'MASCHIO' | 'FEMMINA' = 'MASCHIO'
): TapDiagnosisResult => {
  const gender = genere === 'FEMMINA' ? 'F' : 'M';
  const forwardList: SymbolType[] = [];
  const backwardList: SymbolType[] = [];

  const symbols: SymbolType[] = ['cerchio', 'asta', 'triangolo'];

  // Verifica che nessun simbolo sia NON_RILEVATO, NEUTRO o vuoto
  for (const sym of symbols) {
    const r = results[sym];
    if (!r || r === 'NON_RILEVATO' || r === 'NEUTRO') {
      return {
        isValid: false,
        tipologia: 'Test Incompleto o Risultato Non Affidabile',
        distonia: `Il simbolo ${SYMBOLS_CONFIG[sym].label} non ha prodotto una risposta chiara (Rilevato: ${r || 'VUOTO'}). Si prega di ripetere il test.`,
        avanti: '',
        indietro: '',
        dinamica: 'Le Discipline Analogiche richiedono risposte nette (SÌ/NO) per ciascun archetipo senza ambiguità o parità.'
      };
    }
  }

  symbols.forEach(sym => {
    if (results[sym] === 'SI') forwardList.push(sym);
    if (results[sym] === 'NO') backwardList.push(sym);
  });

  if (forwardList.length !== 1 || backwardList.length === 0) {
    return { 
      isValid: false, 
      tipologia: 'Combinazione non valida',
      distonia: 'È richiesto esattamente 1 simbolo in Avanti (SI) e almeno 1 in Indietro (NO)',
      avanti: '',
      indietro: '',
      dinamica: ''
    };
  }

  const fwd = forwardList[0];
  const bwdKey = [...backwardList].sort().join('+');

  const avantiLabel = SYMBOLS_CONFIG[fwd].label;
  const indietroLabels = backwardList.map(s => SYMBOLS_CONFIG[s].label).join(' + ');

  // -------------------------------------------------------------
  // TABELLA COMBINAZIONI SOGGETTO MASCHILE (M)
  // -------------------------------------------------------------
  if (gender === 'M') {
    if (fwd === 'cerchio' && bwdKey === 'asta') {
      return {
        isValid: true,
        tipologia: "Conflittuale Padre dell'Essere (Classico)",
        distonia: "Distonia dell'Essere (\"Io Sono\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Conflitto con l'archetipo paterno (Asta) vissuto sul piano dell'identità e dell'essere. Difficoltà ad affermare il proprio Io."
      };
    }
    if (fwd === 'asta' && bwdKey === 'triangolo') {
      return {
        isValid: true,
        tipologia: "Conflittuale Madre dell'Avere (Classico)",
        distonia: "Distonia dell'Avere (\"Io Ho\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Conflitto con l'archetipo materno (Triangolo) vissuto sul piano del possesso, dell'affettività e dell'avere."
      };
    }
    if (fwd === 'asta' && bwdKey === 'cerchio+triangolo') {
      return {
        isValid: true,
        tipologia: "Ego-Maschio dell'Essere Base (ex Conflittuale Madre)",
        distonia: "Distonia dell'Essere (\"Io Sono\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Struttura maschile basata sull'affermazione dell'Essere con rifiuto del Sé (Cerchio) e del materno (Triangolo)."
      };
    }
    if (fwd === 'asta' && bwdKey === 'cerchio') {
      return {
        isValid: true,
        tipologia: "Ego-Femmina dell'Avere Base (ex Conflittuale Padre)",
        distonia: "Distonia dell'Avere (\"Io Ho\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Polarizzazione sull'Avere con rifiuto dell'identità personale (Cerchio)."
      };
    }
    if (fwd === 'cerchio' && bwdKey === 'triangolo') {
      return {
        isValid: true,
        tipologia: "Conflittuale Madre dell'Essere",
        distonia: "Distonia dell'Essere (\"Io Sono\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Conflitto materno vissuto sul piano dell'identità, dell'autonomia e del valore personale."
      };
    }
    if (fwd === 'triangolo' && bwdKey === 'asta') {
      return {
        isValid: true,
        tipologia: "Conflittuale Padre dell'Avere",
        distonia: "Distonia dell'Avere (\"Io Ho\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Conflitto con l'autorità paterna sul piano del possesso e delle regole materiali."
      };
    }
    if (fwd === 'triangolo' && bwdKey === 'asta+cerchio') {
      return {
        isValid: true,
        tipologia: "Ego-Femmina dell'Essere Base (ex Conflittuale Padre)",
        distonia: "Distonia dell'Essere (\"Io Sono\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Gradimento del materno (Triangolo) e rifiuto di Asta e Cerchio."
      };
    }
    if (fwd === 'triangolo' && bwdKey === 'cerchio') {
      return {
        isValid: true,
        tipologia: "Ego-Maschio dell'Avere Base (ex Conflittuale Madre)",
        distonia: "Distonia dell'Avere (\"Io Ho\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Gradimento del materno (Δ) e rifiuto del Sé (O). Polarizzazione sull'Avere."
      };
    }
    if (fwd === 'cerchio' && bwdKey === 'asta+triangolo') {
      return {
        isValid: true,
        tipologia: "Ego Triadico dell'Essere",
        distonia: "Equilibrio Triadico",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Equilibrio integrato dell'Essere con centratura sul Cerchio e superamento dei conflitti con i genitori."
      };
    }
  }

  // -------------------------------------------------------------
  // TABELLA COMBINAZIONI SOGGETTO FEMMINILE (F)
  // -------------------------------------------------------------
  if (gender === 'F') {
    if (fwd === 'cerchio' && bwdKey === 'triangolo') {
      return {
        isValid: true,
        tipologia: "Conflittuale Madre dell'Essere (Classico)",
        distonia: "Distonia dell'Essere (\"Io Sono\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Guardiano di Porta (Realista). Conflitto con il modello materno; difesa dell'autonomia, repressione della reattività."
      };
    }
    if (fwd === 'triangolo' && bwdKey === 'asta') {
      return {
        isValid: true,
        tipologia: "Conflittuale Padre dell'Avere (Classico)",
        distonia: "Distonia dell'Avere (\"Io Ho\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Conflitto con l'archetipo paterno (Asta) sul piano dell'Avere e delle regole."
      };
    }
    if (fwd === 'triangolo' && bwdKey === 'asta+cerchio') {
      return {
        isValid: true,
        tipologia: "Ego-Femmina dell'Essere Base (ex Conflittuale Padre)",
        distonia: "Distonia dell'Essere (\"Io Sono\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Struttura femminile basata sull'accoglienza (Triangolo) con distonia sull'Essere."
      };
    }
    if (fwd === 'triangolo' && bwdKey === 'cerchio') {
      return {
        isValid: true,
        tipologia: "Ego-Maschio dell'Avere Base (ex Conflittuale Madre)",
        distonia: "Distonia dell'Avere (\"Io Ho\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Struttura Egocentrica sull'Avere. Spinta al possesso affettivo e mediazione empatica."
      };
    }
    if (fwd === 'cerchio' && bwdKey === 'asta') {
      return {
        isValid: true,
        tipologia: "Conflittuale Padre dell'Essere",
        distonia: "Distonia dell'Essere (\"Io Sono\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Conflitto con l'autorità paterna e le norme (Asta) sul piano dell'identità personale."
      };
    }
    if (fwd === 'asta' && bwdKey === 'triangolo') {
      return {
        isValid: true,
        tipologia: "Conflittuale Madre dell'Avere",
        distonia: "Distonia dell'Avere (\"Io Ho\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Conflitto con il materno (Triangolo) sul piano del possesso e dell'affettività."
      };
    }
    if (fwd === 'asta' && bwdKey === 'cerchio+triangolo') {
      return {
        isValid: true,
        tipologia: "Ego-Maschio dell'Essere Base (ex Conflittuale Madre)",
        distonia: "Distonia dell'Essere (\"Io Sono\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Affermazione rigida dell'Asta con rifiuto di Cerchio e Triangolo."
      };
    }
    if (fwd === 'asta' && bwdKey === 'cerchio') {
      return {
        isValid: true,
        tipologia: "Ego-Femmina dell'Avere Base (ex Conflittuale Padre)",
        distonia: "Distonia dell'Avere (\"Io Ho\")",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Polarizzazione sulle regole (Asta) con rifiuto dell'Io (Cerchio)."
      };
    }
    if (fwd === 'cerchio' && bwdKey === 'asta+triangolo') {
      return {
        isValid: true,
        tipologia: "Ego Triadico dell'Essere",
        distonia: "Equilibrio Triadico",
        avanti: avantiLabel,
        indietro: indietroLabels,
        dinamica: "Equilibrio integrato dell'Essere con piena centratura sul Cerchio."
      };
    }
  }

  return { 
    isValid: true, 
    tipologia: `Tipologia T.A.P. (${gender})`, 
    distonia: 'Distonia Analogica Rilevata',
    avanti: avantiLabel, 
    indietro: indietroLabels,
    dinamica: 'Analisi della combinazione analogica tra gli archetipi Asta, Cerchio e Triangolo.'
  };
};
