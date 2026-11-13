/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService, SessionGuard } from '../services/AdvancedVoiceService';
import InfoBox from '../components/InfoBox';
import TestControls from '../components/TestControls';
import {
  runWitnessAndTortoInvestigation,
  getTortoReactionText,
  getTortoCoherenceText,
} from '../utils/witnessInvestigation';

const seasons = {
  Primavera: ['Marzo', 'Aprile', 'Maggio'],
  Estate: ['Giugno', 'Luglio', 'Agosto'],
  Autunno: ['Settembre', 'Ottobre', 'Novembre'],
  Inverno: ['Dicembre', 'Gennaio', 'Febbraio']
} as const;
type SeasonKey = keyof typeof seasons;
const daysInMonth: Record<string, number> = {
  Gennaio: 31, Febbraio: 28, Marzo: 31, Aprile: 30, Maggio: 31, Giugno: 30,
  Luglio: 31, Agosto: 31, Settembre: 30, Ottobre: 31, Novembre: 30, Dicembre: 31
};

interface ScreenProps {
  setPage: (page: number | string) => void;
}
type Status = 'IDLE' | 'CALIBRATING' | 'TESTING' | 'SUCCESS' | 'ERROR';

const IndagineSingola: React.FC<ScreenProps> = ({ setPage }) => {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<Status>('IDLE');
  const [message, setMessage] = useState('Premi "Inizia Calibrazione" per avviare l\'indagine nel tempo.');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [summary, setSummary] = useState<{ age?: number; date?: string; witness?: string; justification?: string; shouldJustify?: string; giustificatoRaw?: string; dovrebbeRaw?: string }>({
    age: userData.timeLine?.etaEventoCausa ? parseInt(userData.timeLine.etaEventoCausa, 10) : undefined,
    date: userData.giornoEvento || undefined,
    witness: userData.testimoneChiave || undefined,
    justification: userData.giustificatoTorto === 'SI' ? 'Giustificato (SÌ)' : userData.giustificatoTorto === 'NO' ? 'Non Giustificato (NO)' : undefined,
    shouldJustify: userData.avreiDovutoGiustificare === 'SI' ? 'SÌ' : userData.avreiDovutoGiustificare === 'NO' ? 'NO' : undefined,
    giustificatoRaw: userData.giustificatoTorto || undefined,
    dovrebbeRaw: userData.avreiDovutoGiustificare || undefined,
  });

  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);
  const guardRef = useRef<SessionGuard | null>(null);

  useEffect(() => () => {
    guardRef.current?.cancel();
    voiceService.cancel();
  }, [voiceService]);

  const handleCameraReady = () => {
    if (videoRef.current) {
      voiceService.initializeDetector(videoRef.current);
      setIsCameraReady(true);
    }
  };

  const handleExit = () => {
    if (window.confirm("Sei sicuro di voler uscire? La voce e il test verranno interrotti.")) {
        guardRef.current?.cancel();
        voiceService.cancel();
        setPage(0);
    }
  };

  const resetTest = () => {
    guardRef.current?.cancel();
    voiceService.cancel();
    setStatus('IDLE');
    setSummary({});
    setMessage('Premi "Inizia Calibrazione" per avviare l\'indagine nel tempo.');
  };

  const startCalibration = async () => {
    setStatus('CALIBRATING');
    setMessage('Rimani immobile per la calibrazione della posizione...');
    try {
      await voiceService.speak("Stessa posizione: in piedi, braccia lungo il corpo. Dopo il conto alla rovescia inizieremo l'indagine nel tempo.");
    } catch { /* ignore */ }
    if (cameraRef.current) {
      cameraRef.current.startCalibration();
    }
  };

  const calculateTimeline = (age: number) => {
    const currentAge = parseInt(userData.eta, 10) || 30;
    const PU = currentAge / 2;
    const CDS = currentAge / 4;
    const isFatto = age > PU;
    const etaFatto = isFatto ? age : undefined;
    const PT = isFatto ? age - CDS : age + CDS;
    const etaAntefatto = isFatto ? PT - CDS : age;
    const computedEtaFatto = isFatto ? etaFatto : PT + CDS;
    const CDT = Math.abs(PT - PU);
    const diagnosi = PT < PU ? 'Libertà Vincolata' : PT > PU ? 'Sogno Frustrato' : 'Equilibrio';
    return {
      etaEventoCausa: String(age),
      PU,
      CDS,
      PT,
      etaAntefatto: Math.round(etaAntefatto * 10) / 10,
      etaFatto: Math.round(computedEtaFatto * 10) / 10,
      isFatto,
      CDT: Math.round(CDT * 10) / 10,
      diagnosi
    } as const;
  };

  const askWithStrictRepeat = async (questionText: string, guard: SessionGuard): Promise<'SI' | 'NO' | 'NON_RILEVATO'> => {
      setMessage(questionText);
      const res = await voiceService.askQuestionWithSingleRetry(questionText);
      if (guard.isCancelled()) return 'NON_RILEVATO';
      return res.response || 'NON_RILEVATO';
  };

  const runInvestigation = async () => {
    const currentAge = parseInt(userData.eta, 10) || 30;
    const nome = userData.nome || 'Amico';
    const problema = userData.problema || 'il tuo blocco emotivo o disagio';
    guardRef.current?.cancel();
    const guard = new SessionGuard(() => voiceService.cancel());
    guardRef.current = guard;

    setStatus('TESTING');
    try {
      // 1. Introduzione evento causa
      await voiceService.speak(`Caro inconscio di ${nome}, quando accadde quell'evento passato che, se non fosse accaduto, oggi non avresti: ${problema}?`);
      if (!await guard.delay(500)) return;

      // 2. Età evento (ricerca binaria)
      let lower = 0;
      let upper = currentAge;
      while (upper - lower > 1) {
        const midpoint = Math.floor(lower + (upper - lower) / 2);
        const res = await askWithStrictRepeat(`L'evento è accaduto prima dei ${midpoint} anni? Sì o no, attendo risposta.`, guard);
        if (guard.isCancelled()) return;
        if (res === 'NON_RILEVATO') { setStatus('IDLE'); setMessage('Ricerca interrotta.'); return; }
        
        if (res === 'SI') {
          upper = midpoint;
        } else {
          lower = midpoint;
        }
      }
      const foundAge = upper;
      const timeline = calculateTimeline(foundAge);
      setSummary(prev => ({ ...prev, age: foundAge }));
      setUserData(prev => ({
        ...prev,
        timeLine: timeline,
        completedTests: {
          ...prev.completedTests,
          timeLine: true,
          timeLineFromGrandeIndagine: true,
        }
      }));
      await voiceService.speak(`Ok, l'evento è accaduto a ${foundAge} anni. Ora cerchiamo la stagione.`);
      if (!await guard.delay(500)) return;

      // 3. Ricerca della stagione
      let foundSeason: SeasonKey | null = null;
      const seasonsList = Object.keys(seasons) as SeasonKey[];
      for (const season of seasonsList) {
        const res = await askWithStrictRepeat(`L'evento accadde in ${season}? Sì o no, attendo risposta.`, guard);
        if (guard.isCancelled()) return;
        if (res === 'NON_RILEVATO') { setStatus('IDLE'); setMessage('Ricerca interrotta.'); return; }
        if (res === 'SI') {
          foundSeason = season;
          break;
        }
      }
      if (!foundSeason) foundSeason = 'Primavera';

      // 4. Ricerca del mese
      let foundMonth: string | null = null;
      for (const month of seasons[foundSeason]) {
        const res = await askWithStrictRepeat(`L'evento accadde nel mese di ${month}? Sì o no, attendo risposta.`, guard);
        if (guard.isCancelled()) return;
        if (res === 'NON_RILEVATO') { setStatus('IDLE'); setMessage('Ricerca interrotta.'); return; }
        if (res === 'SI') {
          foundMonth = month;
          break;
        }
      }
      if (!foundMonth) foundMonth = seasons[foundSeason][0];

      // 5. Ricerca del giorno
      let lowerDay = 1;
      let upperDay = daysInMonth[foundMonth];
      while (upperDay > lowerDay) {
        const midpoint = Math.floor(lowerDay + (upperDay - lowerDay) / 2);
        const res = await askWithStrictRepeat(`Accadde prima del giorno ${midpoint + 1} di ${foundMonth}? Sì o no, attendo risposta.`, guard);
        if (guard.isCancelled()) return;
        if (res === 'NON_RILEVATO') { setStatus('IDLE'); setMessage('Ricerca interrotta.'); return; }
        
        if (res === 'SI') {
          upperDay = midpoint;
        } else {
          lowerDay = midpoint + 1;
        }
      }
      const foundDate = `${lowerDay} ${foundMonth}`;
      setSummary(prev => ({ ...prev, date: foundDate }));
      setUserData(prev => ({
        ...prev,
        giornoEvento: foundDate,
        completedTests: {
          ...prev.completedTests,
          qualeGiorno: true,
          qualeGiornoFromGrandeIndagine: true,
        }
      }));
      await voiceService.speak(`Avevi ${foundAge} anni, il ${foundDate}. Ora cerchiamo il testimone.`);
      if (!await guard.delay(500)) return;

      // 6-8. Testimone Chiave e Reazione al Torto (blocco condiviso)
      const outcome = await runWitnessAndTortoInvestigation({
        voiceService,
        guard,
        age: String(foundAge),
        onStatusMessage: setMessage,
      });

      if (outcome.status === 'CANCELLED') return;
      if (outcome.status === 'INTERRUPTED') {
        setStatus('IDLE');
        setMessage(outcome.reason);
        return;
      }

      if (outcome.status === 'NOT_IDENTIFIED') {
        setSummary(prev => ({
          ...prev,
          witness: 'non identificato',
          justification: undefined,
          shouldJustify: undefined,
          giustificatoRaw: undefined,
          dovrebbeRaw: undefined,
        }));
        setUserData(prev => ({
          ...prev,
          testimoneChiave: 'non identificato',
          giustificatoTorto: '',
          avreiDovutoGiustificare: '',
          completedTests: {
            ...prev.completedTests,
            timeLine: true,
            timeLineFromGrandeIndagine: true,
            qualeGiorno: true,
            qualeGiornoFromGrandeIndagine: true,
            testimone: true,
            testimoneFromGrandeIndagine: true,
            indagineSingola: true,
          },
        }));
        setStatus('SUCCESS');
        setMessage('Testimone non identificato.');
        await voiceService.speak('Testimone non identificato. Indagine conclusa.');
        return;
      }

      setSummary(prev => ({
        ...prev,
        witness: outcome.witness,
        justification: outcome.giustificato === 'SI' ? 'Giustificato (SÌ)' : 'Non Giustificato (NO)',
        shouldJustify: outcome.avreiDovuto === 'SI' ? 'SÌ' : 'NO',
        giustificatoRaw: outcome.giustificato,
        dovrebbeRaw: outcome.avreiDovuto,
      }));

      // Salvataggio stato completo (solo ruolo pulito e risposte torto)
      setUserData(prev => ({
        ...prev,
        testimoneChiave: outcome.witness,
        giustificatoTorto: outcome.giustificato,
        avreiDovutoGiustificare: outcome.avreiDovuto,
        completedTests: {
          ...prev.completedTests,
          timeLine: true,
          timeLineFromGrandeIndagine: true,
          qualeGiorno: true,
          qualeGiornoFromGrandeIndagine: true,
          testimone: true,
          testimoneFromGrandeIndagine: true,
          indagineSingola: true,
        },
      }));

      setStatus('SUCCESS');
      setMessage(`Indagine completata con successo! Età: ${foundAge} anni; Data: ${foundDate}; Testimone: ${outcome.witness}; Torto: ${outcome.giustificato === 'SI' ? 'Giustificato' : 'Non Giustificato'}.`);
      await voiceService.speak(`Indagine completata con successo. Testimone identificato: ${outcome.witness}. Puoi consultare l'esito.`);
    } catch (error) {
      console.error(error);
      setStatus('ERROR');
      setMessage('Indagine interrotta. Clicca su Ripeti per riprovare.');
    }
  };

  const handleCalibrated = () => {
    setStatus('TESTING');
    runInvestigation();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 pb-24 relative border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 mb-1">
            Indagine Standalone
          </span>
          <h2 className="text-2xl font-serif font-black text-gray-900">Indietro nel Tempo (Grande Indagine)</h2>
          <h3 className="text-sm font-medium text-gray-600">Età Evento → Data Esatta → Testimone Chiave → Reazione al Torto</h3>
        </div>
        <button
          onClick={handleExit}
          data-keep-voice="true"
          className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          &larr; Torna alla Home
        </button>
      </div>

      <InfoBox>
        <p>
          Questa indagine indipendente individua in un unico ciclo continuo l'età esatta dell'evento causa, il periodo e giorno dell'anno, la figura di riferimento (testimone chiave) e l'atteggiamento del tuo inconscio verso il torto ricevuto.
        </p>
      </InfoBox>

      <div className="my-6">
        <CameraView ref={cameraRef} videoRef={videoRef} onReady={handleCameraReady} onCalibrated={handleCalibrated} showCalibrationButton={false} />
      </div>

      <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[90px] flex flex-col justify-center">
        <p className={`font-semibold text-base ${status === 'SUCCESS' ? 'text-emerald-700' : 'text-slate-800'}`}>
          {message}
        </p>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={startCalibration}
          disabled={!isCameraReady}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 uppercase tracking-widest text-sm"
        >
          Inizia Calibrazione e Indagine
        </button>
        {(status === 'CALIBRATING' || status === 'TESTING') && (
          <span className="text-indigo-600 font-bold animate-pulse text-base">
            Indagine in corso... Segui la voce guida.
          </span>
        )}
      </div>

      {/* Standalone Outcome Box */}
      {status === 'SUCCESS' && (
        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 text-slate-800 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⏳</span>
            <div>
              <h4 className="font-serif font-black text-xl text-indigo-950">Quadro Completo dell'Evento Passato</h4>
              <p className="text-xs text-indigo-800 font-medium">Elementi emersi dal dialogo diretto con il tuo inconscio.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">1. Età dell'Evento Causa</span>
              <p className="text-lg font-bold text-indigo-900">{summary.age} anni</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">2. Data Esatta</span>
              <p className="text-lg font-bold text-indigo-900">{summary.date || 'Non specificata'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">3. Testimone Chiave</span>
              <p className="text-lg font-bold text-indigo-900">
                {summary.witness === 'non identificato' ? 'Testimone non identificato' : summary.witness || 'Non identificato'}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">4. Reazione al Torto</span>
              {summary.witness === 'non identificato' ? (
                <p className="text-sm text-slate-600 mt-1">Domande sul torto non poste (testimone non identificato).</p>
              ) : (
                <>
                  <p className="text-base font-bold text-indigo-900">Hai giustificato: {summary.justification || '-'}</p>
                  <p className="text-sm font-semibold text-indigo-800 mt-1">Avresti dovuto: {summary.shouldJustify || '-'}</p>
                  {(summary.giustificatoRaw === 'SI' || summary.giustificatoRaw === 'NO') && (
                    <p className="text-xs text-slate-700 mt-1">{getTortoReactionText(summary.giustificatoRaw)}</p>
                  )}
                  {getTortoCoherenceText(summary.giustificatoRaw, summary.dovrebbeRaw) && (
                    <p className="text-xs italic text-slate-700 mt-1.5 font-medium">
                      {getTortoCoherenceText(summary.giustificatoRaw, summary.dovrebbeRaw)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetTest}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-300 transition duration-300 shadow-sm text-sm"
            >
              🔄 Ripeti Indagine
            </button>
            <button
              onClick={() => setPage(0)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-300 text-sm"
            >
              🏠 Torna ai Test
            </button>
            <button
              onClick={() => navigate('/risultati')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-300 text-sm"
            >
              📊 Vedi Risultati Completi
            </button>
          </div>
        </div>
      )}

      <TestControls onRepeat={resetTest} onExit={handleExit} showControls={status === 'TESTING'} />
    </div>
  );
};

export default IndagineSingola;
