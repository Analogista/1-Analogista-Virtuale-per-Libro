/* © 2027 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService, SessionGuard } from '../services/AdvancedVoiceService';
import TestControls from '../components/TestControls';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

type TestStatus = 'WAITING_CALIBRATION' | 'CALIBRATING' | 'WAITING_INTRO' | 'INTRO_PLAYING' | 'TESTING_DESTRA' | 'TESTING_SINISTRA' | 'DONE' | 'SUCCESS';

const TestInduttore: React.FC<ScreenProps> = ({ setPage }) => {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const { apiKey } = useApiKey();
  const [status, setStatus] = useState<TestStatus>('WAITING_CALIBRATION');
  const [message, setMessage] = useState('Premi "Inizia Calibrazione" per avviare il test induttore.');
  const [results, setResults] = useState({
    destra: userData.testInduttore?.manoDestra || '',
    sinistra: userData.testInduttore?.manoSinistra || ''
  });
  const [isCameraReady, setIsCameraReady] = useState(false);
    
  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  useEffect(() => {
    if (apiKey) voiceService.setApiKey(apiKey);
  }, [apiKey, voiceService]);

  useEffect(() => {
    return () => {
      try { voiceService.cancel(); } catch { /* ignore */ }
    };
  }, [voiceService]);

  const handleCameraReady = () => {
    if (videoRef.current) setIsCameraReady(true);
  };

  const startCalibration = () => {
    setStatus('CALIBRATING');
    setMessage("Rimani immobile per la calibrazione...");
    if (cameraRef.current) cameraRef.current.startCalibration();
  };

  const handleCalibrated = () => {
    playInstructions();
  };
  
  const handleRepeat = () => {
    try { voiceService.cancel(); } catch { /* ignore */ }
    setStatus('WAITING_CALIBRATION');
    setMessage('Premi "Inizia Calibrazione" per ricominciare il test.');
    setResults({ destra: '', sinistra: '' });
  };
  
  const handleExit = () => {
    if (window.confirm("Sei sicuro di voler uscire? La voce e il test verranno interrotti.")) {
        try { voiceService.cancel(); } catch { /* ignore */ }
        setTimeout(() => setPage(0), 50);
    }
  };

  const playInstructions = async () => {
    setStatus('INTRO_PLAYING');
    setMessage('Ascolta le istruzioni della voce guida...');
    const nome = userData.nome || 'Amico';
    const introText = `${nome}, mettiti in piedi di fronte alla telecamera, è sufficiente che io ti veda dalla vita in su. Braccia distese lungo il corpo, piedi alla larghezza delle spalle e occhi chiusi. Ti chiederò di muovere prima la mano destra e poi la mano sinistra e valuterò l'oscillazione naturale del tuo corpo. Iniziamo.`;
    
    try {
      await voiceService.speak(introText);
      startTest();
    } catch (error) {
      console.error("Speech error:", error);
      startTest();
    }
  };

  const startTest = async () => {
    setStatus('TESTING_DESTRA');
    setResults({ destra: '', sinistra: '' });
    const nome = userData.nome || 'Amico';
    const guard = new SessionGuard(() => voiceService.cancel());

    try {
      setMessage('Test della mano DESTRA in corso...');
      const destraPrompt = `Adesso ${nome}, sfrega il pollice della mano destra con le altre dita della mano per qualche secondo, io rileverò l'oscillazione del tuo corpo.`;
      
      const destraRes = await voiceService.askQuestionWithSingleRetry(destraPrompt);
      if (guard.isCancelled()) return;
      const destraResponse = destraRes.response;
      const destraResultText = destraResponse === 'SI' ? 'Avanti' : destraResponse === 'NO' ? 'Indietro' : 'Non Rilevato';
      setResults(prev => ({ ...prev, destra: destraResultText }));
      
      if (destraResponse === 'NON_RILEVATO') {
        setMessage('Risposta non rilevata per la mano destra. Riprova il test.');
        setStatus('WAITING_CALIBRATION'); 
        return;
      }
      if (!await guard.delay(1800)) return;

      setStatus('TESTING_SINISTRA');
      setMessage('Ora test della mano SINISTRA...');
      const sinistraPrompt = "Bene, adesso fai la stessa cosa con la mano sinistra ed io rileverò la tua oscillazione.";
      
      const sinistraRes = await voiceService.askQuestionWithSingleRetry(sinistraPrompt);
      if (guard.isCancelled()) return;
      const sinistraResponse = sinistraRes.response;
      const sinistraResultText = sinistraResponse === 'SI' ? 'Avanti' : sinistraResponse === 'NO' ? 'Indietro' : 'Non Rilevato';
      setResults(prev => ({ ...prev, destra: destraResultText, sinistra: sinistraResultText }));

      if (sinistraResponse === 'NON_RILEVATO') {
        setMessage('Risposta non rilevata per la mano sinistra. Riprova il test.');
        setStatus('WAITING_CALIBRATION');
        return;
      }

      let induttoreFinalResult: 'Destro' | 'Sinistro' | 'Non chiaro' = 'Non chiaro';
      if (destraResultText === 'Avanti' && sinistraResultText === 'Indietro') {
        induttoreFinalResult = 'Destro';
        setMessage('Induttore Destro rilevato! Fase Istituzionale (Grillo Parlante): orientamento sul tema della libertà.');
      } else if (destraResultText === 'Indietro' && sinistraResultText === 'Avanti') {
        induttoreFinalResult = 'Sinistro';
        setMessage('Induttore Sinistro rilevato! Fase Trasgressiva (Lucignolo): orientamento sul tema del sogno.');
      } else {
        induttoreFinalResult = 'Non chiaro';
        setMessage('Oscillazione ambivalente registrata come «Non chiaro». Fai una breve pausa e ripeti una volta se desideri chiarire, senza forzare alcuna polarità.');
      }
      
      setUserData(prev => ({
        ...prev,
        testInduttore: {
          manoDestra: destraResultText as 'Avanti' | 'Indietro',
          manoSinistra: sinistraResultText as 'Avanti' | 'Indietro'
        },
        induttoreResult: induttoreFinalResult,
        completedTests: { ...prev.completedTests, induttore: true }
      }));
      setStatus('SUCCESS');
      if (induttoreFinalResult === 'Non chiaro') {
        await voiceService.speak('Le due mani hanno mostrato la stessa direzione: esito registrato come Non chiaro. Puoi fare una breve pausa e ripetere una volta oppure proseguire.');
      } else {
        await voiceService.speak(`Test induttore completato con successo. Induttore ${induttoreFinalResult} rilevato.`);
      }
    } catch (error) {
      console.error("Test error:", error);
      setMessage("Test interrotto.");
    }
  };

  const showControls = status === 'INTRO_PLAYING' || status === 'TESTING_DESTRA' || status === 'TESTING_SINISTRA';
  const isProMode = true;

  return (
    <div className={`${isProMode ? 'bg-[#0a0a0c] text-white' : 'bg-white text-gray-800'} min-h-screen p-4 sm:p-6 pb-24 relative transition-colors duration-500`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-950 border border-cyan-800 text-cyan-400 mb-1">
            Test Standalone
          </span>
          <h2 className={`text-2xl font-serif font-black ${isProMode ? 'text-cyan-400' : 'text-gray-800'}`}>
            TEST INDUTTORE (MANO DESTRA E SINISTRA)
          </h2>
          <h3 className={`text-sm tracking-widest uppercase font-bold ${isProMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Induttore Destro vs Induttore Sinistro — Libertà o Sogno
          </h3>
        </div>
        <button onClick={handleExit} data-keep-voice="true" className="text-xs uppercase tracking-widest font-bold text-cyan-500 hover:text-cyan-400 border border-cyan-900/60 px-3 py-1.5 rounded-lg transition">
          &larr; ESCI / HOME
        </button>
      </div>

      <div className="my-6">
         <div className={`relative rounded-2xl overflow-hidden shadow-2xl border-4 ${isProMode ? 'border-gray-800' : 'border-gray-200'} bg-black`}>
            <CameraView ref={cameraRef} videoRef={videoRef} onReady={handleCameraReady} onCalibrated={handleCalibrated} sensitivity={userData.sensibilita ?? 75} showCalibrationButton={false} />
         </div>
      </div>

      <div className="my-6 flex justify-center gap-4">
        {status === 'WAITING_CALIBRATION' && (
          <button onClick={startCalibration} disabled={!isCameraReady} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 px-8 rounded-2xl transition duration-300 disabled:opacity-30 uppercase tracking-widest shadow-xl">
            Inizia Calibrazione e Test Induttore
          </button>
        )}
        {status === 'CALIBRATING' && (
          <div className="flex items-center space-x-3 bg-cyan-950/20 px-6 py-4 rounded-2xl border border-cyan-500/30 animate-pulse">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
            <span className="text-cyan-400 font-black uppercase tracking-widest text-sm">CALIBRAZIONE IN CORSO...</span>
          </div>
        )}
        {(status === 'INTRO_PLAYING' || status === 'TESTING_DESTRA' || status === 'TESTING_SINISTRA') && (
          <div className="flex items-center space-x-3 bg-cyan-950/20 px-6 py-4 rounded-2xl border border-cyan-500/30 animate-pulse-cyan">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
            <span className="text-cyan-400 font-black uppercase tracking-widest text-sm">TEST INDUTTORE IN CORSO...</span>
          </div>
        )}
      </div>

      {/* Box Messaggio e Risultati Mani */}
      <div className="text-center p-6 rounded-2xl min-h-[100px] flex flex-col justify-center border bg-gray-900/40 border-gray-800 backdrop-blur">
        <p className={`font-medium text-lg leading-relaxed ${status === 'SUCCESS' ? 'text-green-400' : 'text-cyan-200'}`}>
          {message}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-black uppercase tracking-widest text-gray-300">
          <div className={`p-3 rounded-xl border ${results.destra ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300' : 'bg-gray-900 border-gray-800'}`}>
            Mano Destra: <span className="font-bold text-white">{results.destra || '-'}</span>
          </div>
          <div className={`p-3 rounded-xl border ${results.sinistra ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300' : 'bg-gray-900 border-gray-800'}`}>
            Mano Sinistra: <span className="font-bold text-white">{results.sinistra || '-'}</span>
          </div>
        </div>
      </div>

      {/* Standalone Outcome Card */}
      {status === 'SUCCESS' && userData.induttoreResult && (
        <div className="mt-6 p-6 rounded-2xl bg-indigo-950/50 border-2 border-indigo-500/40 text-center animate-fadeIn">
          <h4 className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-1">Esito Induttore Rilevato</h4>
          <p className="text-2xl font-serif font-black text-white mb-2">
            {userData.induttoreResult === 'Non chiaro'
              ? 'Esito: Non chiaro'
              : `Induttore ${userData.induttoreResult}`}
          </p>
          <p className="text-sm text-indigo-200 max-w-xl mx-auto">
            {userData.induttoreResult === 'Destro'
              ? 'Fase Istituzionale (Grillo Parlante) — tema della libertà. Segnala una dinamica legata a regole, coerenza e confronto con i vincoli.'
              : userData.induttoreResult === 'Sinistro'
              ? 'Fase Trasgressiva (Lucignolo) — tema del sogno. Segnala una dinamica legata a desiderio, slancio emotivo e sfera affettiva.'
              : 'Le due mani hanno prodotto una risposta ambivalente (entrambe avanti o entrambe indietro). Puoi fare una breve pausa e ripetere una volta per verificare, oppure proseguire mantenendo registrato «Non chiaro».'}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleRepeat} className="flex-1 bg-gray-800 text-gray-300 font-black py-4 px-6 rounded-2xl hover:bg-gray-700 transition duration-300 uppercase tracking-widest border border-white/5">
              RIPROVA TEST
            </button>
            <button onClick={() => setPage(0)} className="flex-1 bg-cyan-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-cyan-500 transition duration-300 shadow-xl uppercase tracking-widest">
              TORNA AI TEST
            </button>
            <button onClick={() => navigate('/risultati')} className="flex-1 bg-indigo-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-indigo-500 transition duration-300 shadow-xl uppercase tracking-widest">
              VEDI RISULTATI
            </button>
          </div>
        </div>
      )}

      <TestControls onRepeat={handleRepeat} onExit={handleExit} showControls={showControls} />
    </div>
  );
};

export default TestInduttore;
