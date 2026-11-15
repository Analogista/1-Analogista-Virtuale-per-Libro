/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import { jsPDF } from 'jspdf';
import { UserData } from '../types';
import {
  AnalysisSummary,
  generateAnalogicalAnalysis,
  NOT_AVAILABLE,
} from './AnalysisEngine';

/**
 * Normalizza il testo per il font standard WinAnsi di jsPDF (Helvetica),
 * preservando accenti italiani, virgolette «» e punteggiatura standard
 * ed evitando caratteri/emoji non supportati che produrrebbero glifi corrotti.
 */
export function sanitizePdfText(input: string): string {
  return String(input ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u0394/g, 'Delta')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2713|\u2714/g, '[OK]')
    .replace(/\u2717|\u2718/g, '[NO]')
    .replace(/\u2022/g, '-')
    // Rimuove eventuali emoji o simboli fuori dal set Latin-1 / WinAnsi sicuro
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .replace(/\u200D/g, '')
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function getPdfFilename(userData: UserData | Partial<UserData> | undefined): string {
  const rawName = typeof userData?.nome === 'string' ? userData.nome.trim() : '';
  const safeSlug = rawName
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `Report_${safeSlug || 'Utente'}.pdf`;
}

export function buildResultsPdf(
  userData: UserData,
  precomputedAnalysis?: AnalysisSummary
): jsPDF {
  const analysis = precomputedAnalysis || generateAnalogicalAnalysis(userData);
  const { data } = analysis;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const maxWidth = pageWidth - marginX * 2;
  const footerSeparatorY = pageHeight - 14;
  const footerTextY = pageHeight - 9;
  const bottomLimitY = pageHeight - 20;
  const lineHeight = 4.8;

  let y = 28;

  // Intestazione prima pagina
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(sanitizePdfText('ANALOGISTA VIRTUALE - Report Analisi DAB'), marginX, 12.5);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const dateStr = new Date().toLocaleDateString('it-IT');
  doc.text(
    sanitizePdfText(`Utente: ${data.nome}   |   Data report: ${dateStr}`),
    marginX,
    y
  );
  y += 7;

  const startNewPage = () => {
    doc.addPage();
    y = 18;
  };

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > bottomLimitY) {
      startNewPage();
    }
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(14);
    y += 2;
    doc.setFillColor(238, 242, 255);
    doc.rect(marginX, y - 4.5, maxWidth, 7, 'F');
    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(sanitizePdfText(title), marginX + 2, y);
    y += 6;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
  };

  const addParagraph = (text: string, opts?: { boldPrefix?: string; indent?: number; spaceAfter?: number }) => {
    const indent = opts?.indent ?? 0;
    const spaceAfter = opts?.spaceAfter ?? 2.2;
    const fullText = opts?.boldPrefix ? `${opts.boldPrefix} ${text}` : text;
    const paragraphs = fullText.split(/\n+/);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    for (const para of paragraphs) {
      const cleaned = sanitizePdfText(para);
      if (!cleaned) continue;
      const wrapped: string[] = doc.splitTextToSize(cleaned, maxWidth - indent);
      for (const line of wrapped) {
        if (y + lineHeight > bottomLimitY) {
          startNewPage();
        }
        doc.text(line, marginX + indent, y);
        y += lineHeight;
      }
      y += 1.2;
    }
    y += spaceAfter;
  };

  const addSubHeading = (heading: string) => {
    ensureSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.8);
    doc.setTextColor(55, 48, 163);
    const wrapped: string[] = doc.splitTextToSize(sanitizePdfText(heading), maxWidth);
    for (const line of wrapped) {
      if (y + lineHeight > bottomLimitY) {
        startNewPage();
      }
      doc.text(line, marginX, y);
      y += lineHeight;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
  };

  // --- SEZIONE 1: DATI PERSONALI ---
  addSectionTitle('1. I TUOI DATI');
  addParagraph(`Nome: ${data.nome}`);
  addParagraph(`Età: ${data.eta}`);
  addParagraph(`Genere: ${data.genere}`);
  addParagraph(`Tema / Disagio indicato: ${data.problema}`);

  // --- SEZIONE 2: ESITI PUNTUALI DEI TEST ---
  addSectionTitle('2. ESITI PUNTUALI DEI TEST');

  addSubHeading('Test T.A.P. (Tipologia Analogica della Personalità)');
  if (data.tap.isValid) {
    addParagraph(`- Tipologia: ${data.tap.tipologia}`, { indent: 2 });
    addParagraph(`- Polarità / Distonia: ${data.tap.polarita} (${data.tap.distonia})`, { indent: 2 });
    addParagraph(`- Dinamica: ${data.tap.dinamica}`, { indent: 2 });
  } else {
    addParagraph(`- Esito T.A.P.: ${NOT_AVAILABLE}`, { indent: 2 });
  }
  addParagraph(
    `- Risposte archetipi: Cerchio = ${data.tap.rawResults.cerchio}; Asta = ${data.tap.rawResults.asta}; Triangolo = ${data.tap.rawResults.triangolo}`,
    { indent: 2 }
  );

  addSubHeading('Test Induttore (distinto dal T.A.P.)');
  addParagraph(`- Risultato Induttore: ${data.induttore.risultatoLabel}`, { indent: 2 });
  addParagraph(`- Fase / Archetipo: ${data.induttore.faseArchetipo}`, { indent: 2 });
  addParagraph(`- Tema di riferimento: ${data.induttore.tema}`, { indent: 2 });
  addParagraph(
    `- Rilevazioni mani: Destra = ${data.induttore.manoDestra}; Sinistra = ${data.induttore.manoSinistra}`,
    { indent: 2 }
  );

  addSubHeading('Test del Nome (solo verifica Sì/No di calibrazione)');
  addParagraph(`- Nome vero: ${data.testNome.nomeVero}`, { indent: 2 });
  addParagraph(`- Nome falso: ${data.testNome.nomeFalso}`, { indent: 2 });
  addParagraph(`- Esito calibrazione: ${data.testNome.statoCalibrazione}`, { indent: 2 });

  addSubHeading('Test Punti Distonici (5 aree)');
  if (data.puntiDistonici.isPartial) {
    addParagraph(
      `- Stato rilevazione: Risultato parziale (${data.puntiDistonici.validCount} su ${data.puntiDistonici.totalCount} risposte valide; dati mancanti: ${data.puntiDistonici.missingLabels.join(', ')})`,
      { indent: 2 }
    );
  }
  addParagraph(`- Punto distonico prioritario: ${data.puntiDistonici.prioritario}`, { indent: 2 });
  let puntiEmergedText: string;
  if (!data.puntiDistonici.hasData) {
    puntiEmergedText = NOT_AVAILABLE;
  } else if (data.puntiDistonici.isPartial) {
    puntiEmergedText =
      data.puntiDistonici.areeDistoniche.length > 0
        ? `${data.puntiDistonici.areeDistoniche.join(', ')} (risultato parziale; mancano: ${data.puntiDistonici.missingLabels.join(', ')})`
        : `Risultato parziale non conclusivo fino al completamento (${data.puntiDistonici.validCount} su ${data.puntiDistonici.totalCount} risposte valide; mancano: ${data.puntiDistonici.missingLabels.join(', ')})`;
  } else {
    puntiEmergedText =
      data.puntiDistonici.areeDistoniche.length > 0
        ? data.puntiDistonici.areeDistoniche.join(', ')
        : 'Nessuna area distonica emersa nelle 5 risposte';
  }
  addParagraph(`- Aree con distonia emersa (NO): ${puntiEmergedText}`, { indent: 2 });
  for (const area of data.puntiDistonici.dettaglio) {
    addParagraph(`  * ${area.label}: ${area.display}`, { indent: 4, spaceAfter: 0.8 });
  }
  y += 1.4;

  addSubHeading('Test Sigilli e Vincoli (4 sigilli)');
  if (data.sigilli.isPartial) {
    addParagraph(
      `- Stato rilevazione: Risultato parziale (${data.sigilli.validCount} su ${data.sigilli.totalCount} risposte valide; dati mancanti: ${data.sigilli.missingLabels.join(', ')})`,
      { indent: 2 }
    );
  }
  addParagraph(`- Sigillo prioritario: ${data.sigilli.prioritario}`, { indent: 2 });
  let sigilliEmergedText: string;
  if (!data.sigilli.hasData) {
    sigilliEmergedText = NOT_AVAILABLE;
  } else if (data.sigilli.isPartial) {
    sigilliEmergedText =
      data.sigilli.emersi.length > 0
        ? `${data.sigilli.emersi.join(', ')} (risultato parziale; mancano: ${data.sigilli.missingLabels.join(', ')})`
        : `Risultato parziale non conclusivo fino al completamento (${data.sigilli.validCount} su ${data.sigilli.totalCount} risposte valide; mancano: ${data.sigilli.missingLabels.join(', ')})`;
  } else {
    sigilliEmergedText =
      data.sigilli.emersi.length > 0
        ? data.sigilli.emersi.join(', ')
        : 'Nessun sigillo emerso nelle 4 risposte';
  }
  addParagraph(`- Tutti i sigilli emersi (SÌ): ${sigilliEmergedText}`, { indent: 2 });
  for (const sig of data.sigilli.dettaglio) {
    addParagraph(`  * ${sig.label}: ${sig.display}`, { indent: 4, spaceAfter: 0.8 });
  }
  y += 1.4;

  addSubHeading('Time Line (Ipotesi Esplorativa)');
  addParagraph(`- Età ipotizzata evento: ${data.timeLine.etaEventoCausa}`, { indent: 2 });
  addParagraph(`- Lettura analogica del modello: ${data.timeLine.diagnosi}`, { indent: 2 });
  addParagraph(
    `- Indicatori Time Line: PU = ${data.timeLine.pu} | PT = ${data.timeLine.pt} | CDT = ${data.timeLine.cdt}`,
    { indent: 2 }
  );

  addSubHeading('Giorno, Testimone e Reazione al Torto (Ipotesi Esplorative)');
  addParagraph(`- Giorno / Periodo rilevato: ${data.passo5.giornoEventoDisplay}`, { indent: 2 });
  addParagraph(`- Testimone chiave ipotizzato: ${data.passo5.testimoneDisplay}`, { indent: 2 });
  addParagraph(
    `- Domanda 1 — ${data.passo5.domandaGiustificato} Risposta: ${data.passo5.rispostaGiustificatoDisplay}`,
    { indent: 2 }
  );
  if (data.passo5.rispostaGiustificatoRaw === 'SI' || data.passo5.rispostaGiustificatoRaw === 'NO') {
    addParagraph(`  Significato nel modello: ${data.passo5.significatoReazione}`, { indent: 4 });
  }
  addParagraph(
    `- Domanda 2 — ${data.passo5.domandaAvrestiDovuto} Risposta: ${data.passo5.rispostaAvrestiDovutoDisplay}`,
    { indent: 2 }
  );
  addParagraph(
    `- Confronto risposte sul torto: ${data.passo5.confronto.label} — ${data.passo5.confronto.explanation}`,
    { indent: 2 }
  );

  // --- SEZIONE 3: ANALISI LOGICA INCROCIATA (REPORT COMPLETO LOCALE) ---
  addSectionTitle('3. ANALISI LOGICA INCROCIATA (REPORT COMPLETO)');

  addSubHeading('Sintesi Esplorativa Integrata');
  addParagraph(analysis.sintesiCompleta);

  addSubHeading('Profilo T.A.P. (Tipologia e Polarità)');
  addParagraph(analysis.profiloTAP);

  addSubHeading('Fase & Induttore');
  addParagraph(analysis.faseInconscia);

  addSubHeading('Verifica Test del Nome');
  addParagraph(analysis.calibrazioneNome);

  addSubHeading('Area di Conflitto (Punti Distonici)');
  addParagraph(analysis.areaConflitto);

  addSubHeading('Sigilli Difensivi');
  addParagraph(analysis.sigilloDifesa);

  addSubHeading('Time Line, Giorno & Testimone');
  addParagraph(analysis.imprintingTimeline);

  addSubHeading('Reazione al Torto & Tendenze');
  addParagraph(analysis.meccanismoReattivo);

  addSubHeading('Indicazione Metodologica');
  addParagraph(analysis.consiglioAnalogico);

  // Footer su tutte le pagine senza sovrapposizione con i contenuti
  const totalPages = doc.getNumberOfPages();
  for (let pageIndex = 1; pageIndex <= totalPages; pageIndex++) {
    doc.setPage(pageIndex);
    doc.setDrawColor(203, 213, 225);
    doc.line(marginX, footerSeparatorY, pageWidth - marginX, footerSeparatorY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      sanitizePdfText('© 2026 Max Pisani - PACommunication. Tutti i diritti riservati.'),
      marginX,
      footerTextY
    );
    doc.text(
      `Pagina ${pageIndex} di ${totalPages}`,
      pageWidth - marginX,
      footerTextY,
      { align: 'right' }
    );
  }

  return doc;
}
