/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService, SessionGuard } from '../services/AdvancedVoiceService';
import InfoBox from '../components/InfoBox';
import VideoAccordion from '../components/VideoAccordion';
import TestControls from '../components/TestControls';
import {
  runWitnessAndTortoInvestigation,
  getTortoReactionText,
  getTortoCoherenceText,
} from '../utils/witnessInvestigation';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

const TestimoneChiave: React.FC<ScreenProps> = ({ setPage }) => {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<'IDLE' | 'CALIBRATING' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('Premi "Inizia Calibrazione" per avviare la ricerca del testimone.');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [reusePromptDismissed, setReusePromptDismissed] = useState(false);
  const [foundWitness, setFoundWitness] = useState<string>(userData.testimoneChiave || '');
  const [tortoResult, setTortoResult] = useState<{ giustificato?: string; avrebbeDovuto?: string }>({
    giustificato: userData.giustificatoTorto || undefined,
    avrebbeDovuto: userData.avreiDovutoGiustificare || undefined
  });
    
  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);
  const guardRef = useRef<SessionGuard | null>(null);

  const { sigilloFinale, timeLine } = userData;

  useEffect(() => {
    return () => {
      guardRef.current?.cancel();
      voiceService.cancel();
    };
  }, [voiceService]);

  const handleCameraReady = () => {
    if (videoRef.current) {
      voiceService.initializeDetector(videoRef.current);
      setIsCameraReady(true);
    }
  };

  const startCalibration = async () => {
    setStatus('CALIBRATING');
    setMessage("Rimani immobile per la calibrazione...");
    try {
      await voiceService.speak("Stessa posizione: in piedi, braccia lungo il corpo. Dopo il conto alla rovescia inizieremo la ricerca del testimone e del torto.");
    } catch { /* ignore */ }
    if (cameraRef.current) {
      cameraRef.current.startCalibration();
    }
  };

  const handleCalibrated = () => {
    setIsCalibrated(true);
    startTest();
  };

  const handleRepeat = () => {
    guardRef.current?.cancel();
    voiceService.cancel();
    setStatus('IDLE');
    setIsCalibrated(false);
    setReusePromptDismissed(true);
    setFoundWitness('');
    setTortoResult({});
    setMessage('Pronto a scoprire Testimone & Torto?');
  };

  const handleReuseExisting = () => {
    setFoundWitness(userData.testimoneChiave || 'non identificato');
    setTortoResult({
      giustificato: userData.giustificatoTorto || undefined,
      avrebbeDovuto: userData.avreiDovutoGiustificare || undefined,
    });
    setMessage('Dato esistente confermato.');
    setStatus('SUCCESS');
  };

  const handleExit = () => {
    if (window.confirm("Sei sicuro di voler uscire? La voce e il test verranno interrotti.")) {
        guardRef.current?.cancel();
        voiceService.cancel();
        setPage(0);
    }
  };
    
  const startTest = async () => {
    setStatus('TESTING');
    setTortoResult({});

    guardRef.current?.cancel();
    const guard = new SessionGuard(() => voiceService.cancel());
    guardRef.current = guard;

    try {
      const introText = sigilloFinale && timeLine?.etaEventoCausa
        ? `Adesso andremo a ricercare quel soggetto, maschio o femmina, legato al sigillo "${sigilloFinale}" all'età di ${timeLine.etaEventoCausa} anni.`
        : `Adesso andremo a ricercare la figura chiave, maschile o femminile, legata all'evento causa nel tuo passato.`;

      setMessage("Introduzione in corso...");
      await voiceService.speak(introText);
      if (!await guard.delay(1000)) return;

      const outcome = await runWitnessAndTortoInvestigation({
        voiceService,
        guard,
        age: timeLine?.etaEventoCausa || undefined,
        onStatusMessage: setMessage,
      });

      if (outcome.status === 'CANCELLED') return;
      if (outcome.status === 'INTERRUPTED') {
        setStatus('IDLE');
        setIsCalibrated(false);
        setMessage(outcome.reason);
        return;
      }

      if (outcome.status === 'NOT_IDENTIFIED') {
        setFoundWitness('non identificato');
        setTortoResult({});
        setMessage('Testimone non identificato.');
        setUserData(prev => ({
          ...prev,
          testimoneChiave: 'non identificato',
          giustificatoTorto: '',
          avreiDovutoGiustificare: '',
          completedTests: {
            ...prev.completedTests,
            testimone: true,
            testimoneFromGrandeIndagine: false,
          },
        }));
        setStatus('SUCCESS');
        try { await voiceService.speak('Testimone non identificato. Il test si è concluso.'); } catch { /* ignore */ }
        return;
      }

      setFoundWitness(outcome.witness);
      setTortoResult({
        giustificato: outcome.giustificato,
        avrebbeDovuto: outcome.avreiDovuto,
      });
      setMessage(`Testimone identificato: ${outcome.witness}. Reazione al torto registrata.`);

      setUserData(prev => ({
        ...prev,
        testimoneChiave: outcome.witness,
        giustificatoTorto: outcome.giustificato,
        avreiDovutoGiustificare: outcome.avreiDovuto,
        completedTests: {
          ...prev.completedTests,
          testimone: true,
          testimoneFromGrandeIndagine: false,
        },
      }));
      setStatus('SUCCESS');
      try {
        await voiceService.speak(`Test completato. Testimone chiave: ${outcome.witness}.`);
      } catch { /* ignore */ }
    } catch {
      if (!guard.isCancelled()) setMessage("Test interrotto.");
    }
  };

  const formatTortoLabel = (val?: string) => {
    if (val === 'SI') return 'SÌ';
    if (val === 'NO') return 'NO';
    if (val === 'NON_RILEVATO') return 'Non rilevato';
    return '-';
  };

  const coherenceMessage = getTortoCoherenceText(tortoResult.giustificato, tortoResult.avrebbeDovuto);
  const hasExistingWitness = Boolean(userData.testimoneChiave);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 pb-24 relative border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 mb-1">
            Test Standalone
          </span>
          <h2 className="text-2xl font-serif font-black text-gray-900">Testimone &amp; Torto</h2>
          <h3 className="text-sm font-medium text-gray-600">Ricerca della figura coinvolta e della reazione al torto</h3>
        </div>
        <button onClick={handleExit} data-keep-voice="true" className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg transition">
          &larr; Torna alla Home
        </button>
      </div>

      <VideoAccordion videoId="c50y8d00yS4" title="🎥 Video: Il Testimone Chiave nelle Discipline Analogiche" />

      <InfoBox>
        <p>
          La scheda <strong>Testimone &amp; Torto</strong> individua il ruolo della persona coinvolta nell'evento e verifica le due domande sulla reazione al torto.
        </p>
      </InfoBox>

      {status === 'IDLE' && hasExistingWitness && !reusePromptDismissed && (
        <div className="my-5 p-4 sm:p-5 rounded-2xl bg-teal-50 border-2 border-teal-200 shadow-sm space-y-3">
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-teal-800 border border-teal-200">
              {userData.completedTests?.testimoneFromGrandeIndagine ? 'Dato da Grande Indagine' : 'Dato già presente'}
            </span>
            <h4 className="font-serif font-bold text-lg text-teal-950 mt-1">
              Testimone già registrato: {userData.testimoneChiave === 'non identificato' ? 'Testimone non identificato' : userData.testimoneChiave}
            </h4>
            {userData.giustificatoTorto && (
              <p className="text-xs sm:text-sm text-teal-900 mt-0.5">
                Hai giustificato: <strong>{formatTortoLabel(userData.giustificatoTorto)}</strong>
                {userData.avreiDovutoGiustificare ? ` · Avresti dovuto: ${formatTortoLabel(userData.avreiDovutoGiustificare)}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleReuseExisting}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow transition text-sm"
            >
              ✓ Riutilizza dato esistente
            </button>
            <button
              type="button"
              onClick={() => { setReusePromptDismissed(true); setFoundWitness(''); setTortoResult({}); }}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-800 font-bold py-3 px-4 rounded-xl border border-slate-300 transition text-sm"
            >
              🔄 Rifai il test
            </button>
          </div>
        </div>
      )}

      <div className="my-6">
        <CameraView ref={cameraRef} videoRef={videoRef} onReady={handleCameraReady} onCalibrated={handleCalibrated} showCalibrationButton={false} />
      </div>

      <div className="my-6 flex justify-center">
        {status === 'IDLE' && !isCalibrated && (!hasExistingWitness || reusePromptDismissed) && (
          <button
            onClick={startCalibration}
            disabled={!isCameraReady}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 uppercase tracking-widest text-sm"
          >
            Inizia Calibrazione e Test
          </button>
        )}
        {status === 'CALIBRATING' && (
          <div className="flex items-center space-x-2 bg-teal-50 border border-teal-200 px-5 py-3 rounded-xl">
            <span className="w-2.5 h-2.5 bg-teal-600 rounded-full animate-ping"></span>
            <span className="text-teal-800 font-bold uppercase tracking-widest text-xs">Calibrazione in corso...</span>
          </div>
        )}
        {status === 'TESTING' && (
          <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-5 py-3 rounded-xl">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="text-blue-800 font-bold text-sm">Ricerca testimone e torto in corso...</span>
          </div>
        )}
      </div>

      <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[80px] flex flex-col items-center justify-center">
        <p className={`font-semibold text-base ${status === 'SUCCESS' ? 'text-teal-800' : 'text-blue-900'}`}>{message}</p>
      </div>

      {status === 'SUCCESS' && foundWitness && (
        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-300 text-slate-800 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">👤</span>
            <div>
              <h4 className="font-serif font-black text-xl text-teal-950">Testimone &amp; Torto</h4>
              <p className="text-lg font-bold text-teal-900">
                {foundWitness === 'non identificato' ? 'Testimone non identificato' : foundWitness}
              </p>
            </div>
          </div>

          {foundWitness !== 'non identificato' && (tortoResult.giustificato || tortoResult.avrebbeDovuto) && (
            <div className="bg-white/80 rounded-xl p-4 border border-teal-200 space-y-2 text-sm">
              <p><strong>Hai giustificato il torto:</strong> {formatTortoLabel(tortoResult.giustificato)}</p>
              <p className="text-xs text-slate-700">{getTortoReactionText(tortoResult.giustificato)}</p>
              <p><strong>Avresti dovuto giustificare:</strong> {formatTortoLabel(tortoResult.avrebbeDovuto)}</p>
              {coherenceMessage && (
                <p className="text-xs italic text-slate-800 font-medium pt-1 border-t border-teal-100">
                  {coherenceMessage}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleRepeat} className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-300 transition duration-300 shadow-sm text-sm">
              🔄 Riprova
            </button>
            <button onClick={() => setPage(0)} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-300 text-sm">
              🏠 Torna ai Test
            </button>
            <button onClick={() => navigate('/risultati')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-300 text-sm">
              📊 Vedi Risultati
            </button>
          </div>
        </div>
      )}

      <TestControls onRepeat={handleRepeat} onExit={handleExit} showControls={status === 'TESTING'} />
    </div>
  );
};

export default TestimoneChiave;
