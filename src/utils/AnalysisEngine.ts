import { UserData } from '../types';

export interface AnalysisSummary {
  faseInconscia: string;
  areaConflitto: string;
  sigilloDifesa: string;
  imprintingTimeline: string;
  meccanismoReattivo: string;
  sintesiCompleta: string;
  consiglioAnalogico: string;
}

/**
 * Utility per l'analisi incrociata deterministica dei test analogici dell'inconscio.
 * Genera un report esaustivo senza necessità di chiamate AI a pagamento.
 */
export function generateAnalogicalAnalysis(userData: UserData): AnalysisSummary {
  const {
    nome,
    problema,
    induttoreResult,
    puntoDistonicoFinale,
    sigilloFinale,
    timeLine,
    testimoneChiave,
    giustificatoTorto
  } = userData;

  const userNome = nome ? nome.trim() : 'Utente';
  const prob = problema ? `"${problema.trim()}"` : 'il disagio indicato';

  // 1. Fase Inconscia (Induttore)
  let faseInconscia: string;
  if (induttoreResult === 'Destro') {
    faseInconscia = "Fase Istituzionale (Archetipo: Il Grillo Parlante). L'inconscio ricerca logica, ordine, dovere, regole e coerenza. Tende a privilegiare la stabilità ed il soddisfacimento delle aspettative altrui, vivendo tensione in presenza di trasgressione o anarchia.";
  } else if (induttoreResult === 'Sinistro') {
    faseInconscia = "Fase Trasgressiva (Archetipo: Lucignolo). L'inconscio ricerca istinto, piacere, libertà e autonomia. Tende a sfidare le imposizioni rigide ed a rifiutare l'autorità formale per affermare il proprio desiderio.";
  } else {
    faseInconscia = "Fase non ancora determinata (Test Induttore non completato).";
  }

  // 2. Area di Conflitto (Punto Distonico)
  let areaConflitto: string;
  const distonicoUpper = (puntoDistonicoFinale || '').toUpperCase();
  if (distonicoUpper.includes('ACQUISITA')) {
    areaConflitto = "Sfera Famiglia Acquisita: la tensione analogica si concentra sulle dinamiche del nucleo familiare acquisito (partner, figli o relazioni familiari attuali).";
  } else if (distonicoUpper.includes('FAMIGLIA')) {
    areaConflitto = "Sfera Famiglia d'Origine: la tensione analogica si concentra sulle figure genitoriali o su risentimenti ed imprinting legati al nucleo d'origine.";
  } else if (distonicoUpper.includes('SENTIMENTALI') || distonicoUpper.includes('AFFETTIV')) {
    areaConflitto = "Sfera Relazioni Sentimentali e Affettive: la distonia emerge nella relazione affettiva, con timore della vulnerabilità o dinamiche di insicurezza.";
  } else if (distonicoUpper.includes('SESSUALI') || distonicoUpper.includes('PASSIONALI')) {
    areaConflitto = "Sfera Relazioni Passionali e Sessuali: blocchi nella spontaneità o nella gestione dell'energia vitale e passionale.";
  } else if (distonicoUpper.includes('AUTOREALIZZAZIONE')) {
    areaConflitto = "Sfera dell'Autorealizzazione, Hobby e Lavoro: ostacoli o frustrazioni percepiti nella sfera professionale, nei progetti o nel tempo personale.";
  } else {
    areaConflitto = puntoDistonicoFinale ? `Area ${puntoDistonicoFinale}` : "Area non specificata";
  }

  // 3. Sigillo Analogico (Difesa dell'inconscio)
  let sigilloDifesa: string;
  const sigilloUpper = (sigilloFinale || '').toUpperCase();
  if (sigilloUpper.includes('COLPA')) {
    sigilloDifesa = "Sigillo della Colpa: l'inconscio auto-punisce la propria spinta ed il proprio merito, generando la sensazione sotterranea di sbagliare o di non meritare il pieno appagamento.";
  } else if (sigilloUpper.includes('ABBANDONO')) {
    sigilloDifesa = "Sigillo dell'Abbandono: meccanismo difensivo radicato nella paura di rimanere soli o scartati, spingendo all'iper-adattamento pur di mantenere il legame.";
  } else if (sigilloUpper.includes('AUTOSTIMA') || sigilloUpper.includes('DISISTIMA')) {
    sigilloDifesa = "Sigillo della Mancanza di autostima: svalutazione preventiva di sé, tendenza ad accentuare i propri difetti o incapacità ed a sminuire le proprie risorse.";
  } else if (sigilloUpper.includes('GIUDIZIO')) {
    sigilloDifesa = "Sigillo del Giudizio: forte condizionamento legato allo sguardo e alla critica altrui, che porta al perfezionismo o all'esitazione decisionale.";
  } else {
    sigilloDifesa = sigilloFinale ? `Sigillo ${sigilloFinale}` : "Sigillo non identificato";
  }

  // 4. Time Line & Imprinting
  let imprintingTimeline: string;
  if (timeLine?.etaEventoCausa) {
    imprintingTimeline = `Evento Causa individuato all'età di ${timeLine.etaEventoCausa} anni`;
    if (testimoneChiave) {
      imprintingTimeline += ` con coinvolgimento del Testimone Chiave (${testimoneChiave})`;
    }
    if (timeLine.diagnosi) {
      imprintingTimeline += `. Lettura Temporale: ${timeLine.diagnosi.toUpperCase()}`;
    }
  } else {
    imprintingTimeline = "Time Line non completata.";
  }

  // 5. Meccanismo Reattivo (Giustificato / Torto)
  let meccanismoReattivo: string;
  if (giustificatoTorto === 'SI') {
    meccanismoReattivo = "Ha accettato il giudizio senza dire la propria. Meccanismo: DISSOCIAZIONE.";
  } else if (giustificatoTorto === 'NO') {
    meccanismoReattivo = "Ha reagito, la colpa è rimasta all'esterno. Meccanismo: SCISSIONE.";
  } else {
    meccanismoReattivo = "Reazione al torto non ancora definita.";
  }

  // 6. Sintesi Completa Incrociata
  const sintesiCompleta = `
Gentile ${userNome}, l'analisi incrociata del tuo profilo analogico offre una chiave di lettura chiara del tuo inconscio.
Il disagio espresso riguardo a ${prob} trova la sua matrice nell'area ${distonicoUpper || 'di conflitto'}, dove si è cristallizzato il ${sigilloUpper || 'sigillo difensivo'}.

La tua modalità elettiva è caratterizzata dalla ${faseInconscia.split('.')[0]}.
${imprintingTimeline}.
Attraverso il meccanismo di ${giustificatoTorto === 'SI' ? 'DISSOCIAZIONE (ha accettato il giudizio senza dire la propria)' : giustificatoTorto === 'NO' ? "SCISSIONE (ha reagito, la colpa è rimasta all'esterno)" : 'protezione emotiva'}, l'inconscio ha preservato il tuo equilibrio originario, creando tuttavia l'automatismo che oggi riattiva la tensione nei momenti critici.
  `.trim();

  // 7. Consiglio Analogico Riconciliativo
  let consiglioAnalogico: string;
  if (induttoreResult === 'Destro') {
    consiglioAnalogico = "Consiglio Analogico (Induttore Destro): Permettiti di gratificare i tuoi bisogni senza percepire la gioia come un'infrazione o una mancanza di dovere. Dialoga con il tuo inconscio rassicurandolo sulla bontà delle tue scelte ed alleggerisci l'iper-controllo morale.";
  } else if (induttoreResult === 'Sinistro') {
    consiglioAnalogico = "Consiglio Analogico (Induttore Sinistro): Incanala la tua carica di passione e libertà verso obiettivi costruttivi senza dover necessariamente creare una frizione o una sfida con le figure di autorità o con le regole esterne.";
  } else {
    consiglioAnalogico = "Consiglio Analogico: Riconosci i segnali di risposta analogica del tuo corpo (oscillazione avanti/indietro) per dialogare direttamente con la tua mente profonda.";
  }

  return {
    faseInconscia,
    areaConflitto,
    sigilloDifesa,
    imprintingTimeline,
    meccanismoReattivo,
    sintesiCompleta,
    consiglioAnalogico
  };
}
