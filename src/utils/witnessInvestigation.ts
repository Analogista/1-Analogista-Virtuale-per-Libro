/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import { AdvancedVoiceService, SessionGuard } from '../services/AdvancedVoiceService';

export interface WitnessCandidate {
  role: string;
  voicePhrase: string;
  hasSideQuestion: boolean;
  isFeminine: boolean;
}

export const MALE_WITNESS_CANDIDATES: WitnessCandidate[] = [
  { role: 'padre', voicePhrase: 'tuo padre', hasSideQuestion: false, isFeminine: false },
  { role: 'nonno', voicePhrase: 'tuo nonno', hasSideQuestion: true, isFeminine: false },
  { role: 'zio', voicePhrase: 'tuo zio', hasSideQuestion: true, isFeminine: false },
  { role: 'fratello', voicePhrase: 'tuo fratello', hasSideQuestion: false, isFeminine: false },
  { role: 'cugino', voicePhrase: 'tuo cugino', hasSideQuestion: true, isFeminine: false },
  { role: 'insegnante', voicePhrase: 'un insegnante', hasSideQuestion: false, isFeminine: false },
  { role: 'amico', voicePhrase: 'un amico', hasSideQuestion: false, isFeminine: false },
  { role: 'datore di lavoro', voicePhrase: 'il tuo datore di lavoro', hasSideQuestion: false, isFeminine: false },
  { role: 'partner', voicePhrase: 'il tuo partner', hasSideQuestion: false, isFeminine: false },
  { role: 'collega', voicePhrase: 'un collega', hasSideQuestion: false, isFeminine: false },
  { role: 'suocero', voicePhrase: 'tuo suocero', hasSideQuestion: false, isFeminine: false },
];

export const FEMALE_WITNESS_CANDIDATES: WitnessCandidate[] = [
  { role: 'madre', voicePhrase: 'tua madre', hasSideQuestion: false, isFeminine: true },
  { role: 'nonna', voicePhrase: 'tua nonna', hasSideQuestion: true, isFeminine: true },
  { role: 'zia', voicePhrase: 'tua zia', hasSideQuestion: true, isFeminine: true },
  { role: 'sorella', voicePhrase: 'tua sorella', hasSideQuestion: false, isFeminine: true },
  { role: 'cugina', voicePhrase: 'tua cugina', hasSideQuestion: true, isFeminine: true },
  { role: 'insegnante', voicePhrase: "un'insegnante", hasSideQuestion: false, isFeminine: true },
  { role: 'amica', voicePhrase: "un'amica", hasSideQuestion: false, isFeminine: true },
  { role: 'datrice di lavoro', voicePhrase: 'la tua datrice di lavoro', hasSideQuestion: false, isFeminine: true },
  { role: 'partner', voicePhrase: 'la tua partner', hasSideQuestion: false, isFeminine: true },
  { role: 'collega', voicePhrase: 'una collega', hasSideQuestion: false, isFeminine: true },
  { role: 'suocera', voicePhrase: 'tua suocera', hasSideQuestion: false, isFeminine: true },
];

export type WitnessInvestigationOutcome =
  | { status: 'CANCELLED' }
  | { status: 'INTERRUPTED'; reason: string }
  | { status: 'NOT_IDENTIFIED'; witness: 'non identificato' }
  | {
      status: 'COMPLETED';
      witness: string;
      witnessVoicePhrase: string;
      giustificato: 'SI' | 'NO';
      avreiDovuto: 'SI' | 'NO';
    };

export function getTortoReactionText(giustificato?: string): string {
  if (giustificato === 'SI') {
    return 'Ha accettato il giudizio senza dire la propria. Meccanismo: DISSOCIAZIONE.';
  }
  if (giustificato === 'NO') {
    return "Ha reagito, la colpa è dell'altro e la rabbia resta all'esterno. Meccanismo: SCISSIONE.";
  }
  return 'Dato non rilevato.';
}

export function getTortoCoherenceText(giustificato?: string, avreiDovuto?: string): string {
  if ((giustificato === 'SI' || giustificato === 'NO') && (avreiDovuto === 'SI' || avreiDovuto === 'NO')) {
    if (giustificato === avreiDovuto) {
      return 'Risposta coerente.';
    }
    return 'Conflitto: le due risposte discordano tra loro. Si suggerisce di ripetere il test in un altro giorno, partendo dal Test del Nome.';
  }
  return '';
}

export async function runWitnessAndTortoInvestigation(params: {
  voiceService: AdvancedVoiceService;
  guard: SessionGuard;
  age?: string;
  onStatusMessage: (msg: string) => void;
}): Promise<WitnessInvestigationOutcome> {
  const { voiceService, guard, age, onStatusMessage } = params;

  onStatusMessage('Era un uomo? (Sì/No)');
  const resMale = await voiceService.askQuestionWithSingleRetry('Era un uomo? Sì o no, attendo risposta.');
  if (guard.isCancelled() || resMale.status === 'CANCELLED') return { status: 'CANCELLED' };
  if (resMale.status === 'VOICE_ERROR') return { status: 'INTERRUPTED', reason: 'Errore guida vocale.' };
  if (resMale.response === 'NON_RILEVATO') {
    return { status: 'INTERRUPTED', reason: 'Risposta non rilevata. Ripeti il test.' };
  }

  let candidates: WitnessCandidate[];
  if (resMale.response === 'SI') {
    candidates = MALE_WITNESS_CANDIDATES;
  } else {
    onStatusMessage('Era una donna? (Sì/No)');
    const resFemale = await voiceService.askQuestionWithSingleRetry('Era una donna? Sì o no, attendo risposta.');
    if (guard.isCancelled() || resFemale.status === 'CANCELLED') return { status: 'CANCELLED' };
    if (resFemale.status === 'VOICE_ERROR') return { status: 'INTERRUPTED', reason: 'Errore guida vocale.' };
    if (resFemale.response === 'NON_RILEVATO') {
      return { status: 'INTERRUPTED', reason: 'Risposta non rilevata. Ripeti il test.' };
    }
    if (resFemale.response !== 'SI') {
      return { status: 'NOT_IDENTIFIED', witness: 'non identificato' };
    }
    candidates = FEMALE_WITNESS_CANDIDATES;
  }

  let selectedRole = '';
  let selectedVoicePhrase = '';

  for (const candidate of candidates) {
    const prompt = `Era ${candidate.voicePhrase}? Sì o no, attendo risposta.`;
    onStatusMessage(`Era ${candidate.voicePhrase}? (Sì/No)`);
    const res = await voiceService.askQuestionWithSingleRetry(prompt);
    if (guard.isCancelled() || res.status === 'CANCELLED') return { status: 'CANCELLED' };
    if (res.status === 'VOICE_ERROR') return { status: 'INTERRUPTED', reason: 'Errore guida vocale.' };
    if (res.response === 'NON_RILEVATO') {
      return { status: 'INTERRUPTED', reason: 'Risposta non rilevata. Ripeti il test.' };
    }

    if (res.response === 'SI') {
      selectedRole = candidate.role;
      selectedVoicePhrase = candidate.voicePhrase;

      if (candidate.hasSideQuestion) {
        onStatusMessage('Da parte di papà? (Sì/No)');
        const sideRes = await voiceService.askQuestionWithSingleRetry('Da parte di papà? Sì o no, attendo risposta.');
        if (guard.isCancelled() || sideRes.status === 'CANCELLED') return { status: 'CANCELLED' };
        if (sideRes.status === 'VOICE_ERROR') return { status: 'INTERRUPTED', reason: 'Errore guida vocale.' };
        if (sideRes.response === 'SI') {
          const suffix = candidate.isFeminine ? 'paterna' : 'paterno';
          selectedRole = `${candidate.role} ${suffix}`;
          selectedVoicePhrase = `${candidate.voicePhrase} ${suffix}`;
        } else if (sideRes.response === 'NO') {
          const suffix = candidate.isFeminine ? 'materna' : 'materno';
          selectedRole = `${candidate.role} ${suffix}`;
          selectedVoicePhrase = `${candidate.voicePhrase} ${suffix}`;
        }
      }
      break;
    }
  }

  if (!selectedRole) {
    return { status: 'NOT_IDENTIFIED', witness: 'non identificato' };
  }

  const trimmedAge = age?.trim();
  const q1 = trimmedAge
    ? `Caro inconscio, nell'evento accaduto a ${trimmedAge} anni, ho giustificato il torto ricevuto da ${selectedVoicePhrase}? Sì o no?`
    : `Caro inconscio, ho giustificato il torto ricevuto da ${selectedVoicePhrase}? Sì o no?`;

  onStatusMessage(q1);
  const resJust = await voiceService.askQuestionWithSingleRetry(q1);
  if (guard.isCancelled() || resJust.status === 'CANCELLED') return { status: 'CANCELLED' };
  if (resJust.status === 'VOICE_ERROR') return { status: 'INTERRUPTED', reason: 'Errore guida vocale.' };
  if (resJust.response !== 'SI' && resJust.response !== 'NO') {
    return { status: 'INTERRUPTED', reason: 'Risposta non rilevata sulla reazione al torto.' };
  }

  if (!(await guard.delay(800))) return { status: 'CANCELLED' };

  const q2 = 'Avrei dovuto giustificare? Sì o no?';
  onStatusMessage(q2);
  const resShouldJust = await voiceService.askQuestionWithSingleRetry(q2);
  if (guard.isCancelled() || resShouldJust.status === 'CANCELLED') return { status: 'CANCELLED' };
  if (resShouldJust.status === 'VOICE_ERROR') return { status: 'INTERRUPTED', reason: 'Errore guida vocale.' };
  if (resShouldJust.response !== 'SI' && resShouldJust.response !== 'NO') {
    return { status: 'INTERRUPTED', reason: 'Risposta non rilevata sulla seconda domanda.' };
  }

  return {
    status: 'COMPLETED',
    witness: selectedRole,
    witnessVoicePhrase: selectedVoicePhrase,
    giustificato: resJust.response,
    avreiDovuto: resShouldJust.response,
  };
}
