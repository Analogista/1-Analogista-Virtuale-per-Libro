import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import TestControls from '../components/TestControls';

interface ScreenProps {
  setPage: (page: number) => void;
  onNext?: () => void;
  isWizard?: boolean;
}

type TestStatus = 'WAITING_CALIBRATION' | 'CALIBRATING' | 'WAITING_INTRO' | 'INTRO_PLAYING' | 'TESTING_DESTRA' | 'TESTING_SINISTRA' | 'DONE' | 'SUCCESS';

const TestInduttore: React.FC<ScreenProps> = ({ setPage, onNext, isWizard }) => {
  const { userData, setUserData } = useUser();
  const { apiKey } = useApiKey();
  const [status, setStatus] = useState<TestStatus>('WAITING_CALIBRATION');
  const [message, setMessage] = useState('Premi "Inizia" per avviare la calibrazione e il test induttore.');
  const [results, setResults] = useState({ destra: '', sinistra: '' });
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
      setMessage('Premi "Inizia" per ricominciare.');
      setResults({ destra: '', sinistra: '' });
  };
  
  const handleExit = () => {
      try { voiceService.cancel(); } catch { /* ignore */ }
      // Piccolo delay per evitare crash di React durante lo smontaggio
      setTimeout(() => setPage(0), 50);
  };

  const playInstructions = async () => {
    setStatus('INTRO_PLAYING');
    setMessage('Ascolta le istruzioni...');
    const introText = `${userData.nome} mettiti in piedi di fronte alla telecamera, è sufficiente che io ti veda dalla vita in su. Braccia distese lungo il corpo, piedi larghezza delle spalle e occhi chiusi. ti chiederò di muovere, come nel video esempio, prima la mano destra e poi la mano sinistra e valuterò l'oscillazione naturale del tuo corpo, se in avanti o indietro. Quando sei pronto iniziamo.`;
    
    try {
      await voiceService.speak(introText);
      startTest();
    } catch (error) {
      console.error("Speech error:", error);
      // Rimosso il blocco che causava la scritta fantasma "Configurazione Audio... / Errore audio"
    }
  };

  const startTest = async () => {
    setStatus('TESTING_DESTRA');
    setResults({ destra: '', sinistra: '' });
    try {
      setMessage('Test della mano DESTRA in corso...');
      const destraPrompt = `Adesso ${userData.nome} sfrega il pollice della mano destra con le altre dita della mano per qualche secondo, io rileverò l'oscillazione.`;
      const destraResponse = await voiceService.askQuestion(destraPrompt);
      const destraResultText = destraResponse === 'SI' ? 'Avanti' : destraResponse === 'NO' ? 'Indietro' : 'Non Rilevato';
      setResults(prev => ({ ...prev, destra: destraResultText }));
      
      if (destraResponse === 'NON_RILEVATO') {
          setMessage('Risposta non rilevata per la mano destra. Riprova il test.');
          setStatus('WAITING_CALIBRATION'); 
          return;
      }
      await new Promise(res => setTimeout(res, 2000));

      setStatus('TESTING_SINISTRA');
      setMessage('Ora test della mano SINISTRA...');
      const sinistraPrompt = "Bene, adesso fai la stessa cosa con la mano sinistra ed io rileverò l'oscillazione.";
      const sinistraResponse = await voiceService.askQuestion(sinistraPrompt);
      const sinistraResultText = sinistraResponse === 'SI' ? 'Avanti' : sinistraResponse === 'NO' ? 'Indietro' : 'Non Rilevato';
      setResults(prev => ({ ...prev, destra: destraResultText, sinistra: sinistraResultText }));

      if (sinistraResponse === 'NON_RILEVATO') {
          setMessage('Risposta non rilevata per la mano sinistra. Riprova il test.');
          setStatus('WAITING_CALIBRATION');
          return;
      }

      let induttoreFinalResult: 'Destro' | 'Sinistro' | '' = '';
      if (destraResultText === 'Avanti' && sinistraResultText === 'Indietro') {
        induttoreFinalResult = 'Destro';
        setMessage('Induttore Destro rilevato! Indica un "Problema di Libertà" (Sindrome di Giulietta e Romeo): difficoltà nel prendere decisioni.');
      } else if (destraResultText === 'Indietro' && sinistraResultText === 'Avanti') {
        induttoreFinalResult = 'Sinistro';
        setMessage('Induttore Sinistro rilevato! Corrisponde alla "Sindrome di Dante e Beatrice" (Problema di Sogno/Conquista).');
      } else {
        setMessage('Combinazione di risposte non valida. Prova a ripetere il test per un risultato chiaro.');
        setStatus('DONE');
        setUserData(prev => ({ ...prev, testInduttore: { manoDestra: destraResultText as 'Avanti' | 'Indietro', manoSinistra: sinistraResultText as 'Avanti' | 'Indietro' }, induttoreResult: '' }));
        return;
      }
      
      setUserData(prev => ({ ...prev, testInduttore: { manoDestra: destraResultText as 'Avanti' | 'Indietro', manoSinistra: sinistraResultText as 'Avanti' | 'Indietro' }, induttoreResult: induttoreFinalResult, completedTests: { ...prev.completedTests, induttore: true } }));
      setStatus('SUCCESS');
      await voiceService.speak("premi il pulsante qui sotto per proseguire con gli altri test oppure riprova questo test");
    } catch (error) {
        console.error("Test error:", error);
        setMessage("Test interrotto.");
    }
  };

  const handleProsegui = () => {
      try { voiceService.cancel(); } catch { /* ignore */ }
      if (onNext) onNext(); else setPage(1);
  };

  const showControls = status === 'INTRO_PLAYING' || status === 'TESTING_DESTRA' || status === 'TESTING_SINISTRA';
  const isProMode = true;

  return (
    <div className={`${isProMode ? 'bg-[#0a0a0c] text-white' : 'bg-white text-gray-800'} min-h-screen p-4 sm:p-6 pb-24 relative transition-colors duration-500`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className={`text-2xl font-serif font-black ${isProMode ? 'text-cyan-400' : 'text-gray-800'}`}>{isWizard ? 'STEP 3: TEST INDUTTORE' : '6) TEST INDUTTORE'}</h2>
          <h3 className={`text-sm tracking-widest uppercase font-bold ${isProMode ? 'text-gray-400' : 'text-gray-600'}`}>Mano destra e sinistra</h3>
        </div>
        {!isWizard && (<button onClick={() => setPage(0)} className="text-xs uppercase tracking-widest font-bold text-cyan-500 hover:text-cyan-400">&larr; ESCI</button>)}
      </div>

      <div className="my-6">
         <div className={`relative rounded-2xl overflow-hidden shadow-2xl border-4 ${isProMode ? 'border-gray-800' : 'border-gray-200'} bg-black`}>
            <CameraView ref={cameraRef} videoRef={videoRef} onReady={handleCameraReady} onCalibrated={handleCalibrated} />
         </div>
      </div>

      <div className="my-8 flex justify-center gap-4">
        {status === 'WAITING_CALIBRATION' && (
            <button onClick={startCalibration} disabled={!isCameraReady} className="w-full bg-cyan-600 text-white font-black py-4 px-8 rounded-2xl transition duration-300 disabled:opacity-30 uppercase tracking-widest shadow-xl">
                Inizia Calibrazione
            </button>
        )}
        {status === 'CALIBRATING' && (
             <div className="flex items-center space-x-3 bg-cyan-950/20 px-6 py-4 rounded-2xl border border-cyan-500/30 animate-pulse">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
                <span className="text-cyan-400 font-black uppercase tracking-widest text-sm">CALIBRAZIONE IN CORSO...</span>
           </div>
        )}
        {status === 'INTRO_PLAYING' && (
             <div className="flex items-center space-x-3 bg-cyan-950/20 px-6 py-4 rounded-2xl border border-cyan-500/30 animate-pulse">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
                <span className="text-cyan-400 font-black uppercase tracking-widest text-sm">VOCE GUIDA IN CORSO...</span>
           </div>
        )}
        {(status === 'TESTING_DESTRA' || status === 'TESTING_SINISTRA') && (
           <div className="flex items-center space-x-3 bg-cyan-950/20 px-6 py-4 rounded-2xl border border-cyan-500/30 animate-pulse-cyan">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
                <span className="text-cyan-400 font-black uppercase tracking-widest text-sm">TEST IN CORSO...</span>
           </div>
        )}
      </div>

       <div className={`text-center p-6 rounded-2xl min-h-[100px] flex flex-col justify-center border transition-all ${isProMode ? 'bg-gray-900/20 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
        <p className={`font-medium text-lg leading-relaxed ${status === 'SUCCESS' ? 'text-green-400' : (status === 'DONE' ? 'text-orange-400' : (isProMode ? 'text-gray-300' : 'text-blue-800'))}`}>
          {message}
        </p>
        <div className="mt-4 flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <p>DX: <span className={results.destra ? 'text-cyan-400' : ''}>{results.destra || '-'}</span></p>
            <p>SX: <span className={results.sinistra ? 'text-cyan-400' : ''}>{results.sinistra || '-'}</span></p>
        </div>
      </div>

      {(status === 'SUCCESS' || status === 'DONE') && (
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleRepeat} className="flex-1 bg-gray-800 text-gray-400 font-black py-4 px-6 rounded-2xl hover:bg-gray-700 transition duration-300 uppercase tracking-widest border border-white/5">RIPROVA</button>
            <button onClick={handleProsegui} className="flex-1 bg-cyan-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-cyan-500 transition duration-300 shadow-xl uppercase tracking-widest">PROSEGUI →</button>
        </div>
      )}

      <TestControls onRepeat={handleRepeat} onExit={handleExit} showControls={showControls} />
    </div>
  );
};

export default TestInduttore;
