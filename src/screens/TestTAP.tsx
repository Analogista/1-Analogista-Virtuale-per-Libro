import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import TestControls from '../components/TestControls';
import { SYMBOLS_CONFIG, computeTapDiagnosis, enrichTapDiagnosis, SymbolType, SymbolReaction } from '../utils/tapEngine';

interface ScreenProps {
  setPage: (page: number) => void;
  onNext?: () => void;
  isWizard?: boolean;
}

type TestStatus = 'WAITING_CALIBRATION' | 'CALIBRATING' | 'WAITING_INTRO' | 'TESTING_SYMBOL' | 'DONE' | 'SUCCESS';

export const TestTAP: React.FC<ScreenProps> = ({ setPage, onNext, isWizard }) => {
  const { userData, setUserData } = useUser();
  const { apiKey } = useApiKey();
  const [status, setStatus] = useState<TestStatus>('WAITING_CALIBRATION');
  const [currentSymbolKey, setCurrentSymbolKey] = useState<SymbolType>('cerchio');
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [showOverlayOnCam, setShowOverlayOnCam] = useState<boolean>(true);
  const [genere, setGenere] = useState<'MASCHIO' | 'FEMMINA'>(userData.genere === 'FEMMINA' ? 'FEMMINA' : 'MASCHIO');
  const [results, setResults] = useState<Record<SymbolType, SymbolReaction>>({
    cerchio: userData.testTAP?.results?.cerchio || '',
    asta: userData.testTAP?.results?.asta || '',
    triangolo: userData.testTAP?.results?.triangolo || ''
  });
  const [message, setMessage] = useState('Posizionati di fronte alla webcam, seleziona il tuo genere e avvia la calibrazione.');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraServiceId, setCameraServiceId] = useState<string | null>(null);

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
    if (videoRef.current) {
      voiceService.initializeDetector(videoRef.current);
      setIsCameraReady(true);
    }
  };

  const startCalibration = async () => {
    setStatus('CALIBRATING');
    setMessage("Rimani immobile per la calibrazione del sistema analogico multi-campione...");
    try {
      await voiceService.speak("Mettiti in piedi di fronte alla telecamera, braccia lungo il corpo. Ora calibriamo la tua posizione neutra.");
    } catch { /* ignore */ }
    if (cameraRef.current) cameraRef.current.startCalibration();
  };

  const handleCalibrated = () => {
    playIntroAndStartTest();
  };

  const handleRepeat = () => {
    try { voiceService.cancel(); } catch { /* ignore */ }
    setStatus('WAITING_CALIBRATION');
    setMessage('Premi "Inizia Calibrazione" per ricominciare il test T.A.P.');
    setResults({ cerchio: '', asta: '', triangolo: '' });
    setIsZooming(false);
  };

  const handleExit = () => {
    try { voiceService.cancel(); } catch { /* ignore */ }
    setTimeout(() => setPage(0), 50);
  };

  const playIntroAndStartTest = async () => {
    setStatus('WAITING_INTRO');
    setMessage('Preparazione al test T.A.P. in corso...');
    try {
      await voiceService.speak("osserva il simbolo che avanza. Saranno 3 simboli. io rileverò la tua oscillazione naturale, se in avanti o indietro per ciascun simbolo");
      runSymbolTests();
    } catch (error) {
      console.error("Voice intro error:", error);
      runSymbolTests();
    }
  };

  const runSymbolTests = async () => {
    const symbolKeys: SymbolType[] = ['cerchio', 'asta', 'triangolo'];
    const currentResults = { ...results };

    for (const symKey of symbolKeys) {
      setCurrentSymbolKey(symKey);
      setStatus('TESTING_SYMBOL');
      setIsZooming(true);
      const conf = SYMBOLS_CONFIG[symKey];
      setMessage(`Analisi in corso per ${conf.label}: ${conf.archetype} (2 cicli). Rilevamento oscillazione in background...`);

      let forwardCount = 0;
      let backwardCount = 0;

      const movementListener = (e: any) => {
        const { serviceId, direction } = e.detail;
        if (cameraServiceId && serviceId !== cameraServiceId) return;
        if (direction === 'forward') forwardCount++;
        if (direction === 'backward') backwardCount++;
        const dirLabel = direction === 'forward' ? 'SÌ (In avanti)' : 'NO (All\'indietro)';
        setMessage(`⚡ Rilevato per ${conf.label}: ${dirLabel} (SÌ: ${forwardCount}, NO: ${backwardCount})`);
      };

      window.addEventListener('movementDetected', movementListener);

      // 2 cicli da 6 secondi = 12 secondi totali per simbolo
      await new Promise(res => setTimeout(res, 12000));

      window.removeEventListener('movementDetected', movementListener);

      // Distinguere rigorosamente NEUTRO, NON_RILEVATO (parità) e SI/NO
      let reaction: SymbolReaction;
      if (forwardCount === 0 && backwardCount === 0) {
        reaction = 'NEUTRO';
      } else if (forwardCount === backwardCount) {
        reaction = 'NON_RILEVATO';
      } else if (forwardCount > backwardCount) {
        reaction = 'SI';
      } else {
        reaction = 'NO';
      }

      currentResults[symKey] = reaction;
      setResults({ ...currentResults });
      setIsZooming(false);

      const reactionLabel = 
        reaction === 'SI' ? 'SÌ (In avanti - Gradimento)' : 
        reaction === 'NO' ? 'NO (All\'indietro - Rifiuto)' : 
        reaction === 'NON_RILEVATO' ? 'NON RILEVATO (Parità/Instabile)' : 'Neutro (Nessuna oscillazione)';
      
      setMessage(`✅ Registrato per ${conf.label}: ${reactionLabel}`);

      await new Promise(res => setTimeout(res, 1500));
    }

    // Finished all symbols - compute diagnosis with validation
    const diagnosis = enrichTapDiagnosis(computeTapDiagnosis(currentResults, genere));

    if (!diagnosis.isValid) {
      setStatus('WAITING_CALIBRATION');
      setMessage(`⚠️ ${diagnosis.tipologia}: ${diagnosis.distonia}. Si prega di ripetere il test.`);
      try {
        await voiceService.speak("Il test non ha prodotto risposte sufficientemente stabili o univoche. Ti invito a ripetere la calibrazione e il test.");
      } catch { /* ignore */ }
      return;
    }

    setUserData(prev => ({
      ...prev,
      genere,
      testTAP: {
        results: currentResults,
        diagnosis
      },
      completedTests: { ...prev.completedTests, tap: true }
    }));

    setStatus('SUCCESS');
    setMessage(`Test T.A.P. Completato! Tipologia rilevata: ${diagnosis.tipologia}`);
    try {
      const profile = diagnosis.profilo;
      const profileSpeech = profile
        ? ` Famiglia evolutiva: ${profile.famiglia}. Referente simbolico: ${profile.referente}. Polarità: ${profile.polarita}. Origine: ${profile.origine}. Stile comportamentale: ${profile.stile}. Dinamica diagnostica: ${diagnosis.dinamica}. Dinamica relazionale: ${profile.relazioni}. Meccanismo: ${profile.meccanismo}. Orientamento: ${profile.orientamento}.`
        : '';
      await voiceService.speak(`Test T.A.P. completato con successo. La tua tipologia analogica è ${diagnosis.tipologia}.${profileSpeech} Premi il pulsante per proseguire.`);
    } catch { /* ignore */ }
  };

  const diagnosis = enrichTapDiagnosis(computeTapDiagnosis(results, genere));

  const handleProsegui = () => {
    try { voiceService.cancel(); } catch { /* ignore */ }
    if (onNext) onNext(); else setPage(0);
  };

  const showControls = status === 'WAITING_INTRO' || status === 'TESTING_SYMBOL';

  return (
    <div className="bg-[#0a0a0c] text-white min-h-screen p-4 sm:p-6 pb-24 relative transition-colors duration-500">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-serif font-black text-cyan-400">{isWizard ? 'TEST T.A.P. (Cerchio, Asta, Triangolo)' : 'TEST T.A.P. (TIPOLOGIA ANALOGICA)'}</h2>
          <h3 className="text-sm tracking-widest uppercase font-bold text-gray-400">Analisi degli Archetipi di Stefano Benemeglio</h3>
        </div>
        {!isWizard && (<button onClick={() => setPage(0)} className="text-xs uppercase tracking-widest font-bold text-cyan-500 hover:text-cyan-400">&larr; ESCI</button>)}
      </div>

      {/* Seleziona Genere e Toggle Overlay */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-300">Soggetto (Genere):</span>
          <button 
            onClick={() => setGenere('MASCHIO')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${genere === 'MASCHIO' ? 'bg-cyan-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            MASCHIO (M)
          </button>
          <button 
            onClick={() => setGenere('FEMMINA')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${genere === 'FEMMINA' ? 'bg-pink-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            FEMMINA (F)
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-300 cursor-pointer flex items-center gap-2 select-none">
            <input 
              type="checkbox" 
              checked={showOverlayOnCam} 
              onChange={e => setShowOverlayOnCam(e.target.checked)}
              className="rounded accent-cyan-500"
            />
            Simbolo in overlay su Webcam
          </label>
        </div>
      </div>

      {/* Webcam View con Overlay del Simbolo integrato */}
      <div className="mb-6">
         <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-black">
            <CameraView ref={cameraRef} videoRef={videoRef} showSilhouette={false} onReady={handleCameraReady} onServiceId={setCameraServiceId} onCalibrated={handleCalibrated} />

            {/* Header / Badge del simbolo corrente all'interno della webcam */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none z-30">
              <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/30 text-xs uppercase tracking-widest text-cyan-400 font-mono shadow-lg">
                {SYMBOLS_CONFIG[currentSymbolKey].label} - {SYMBOLS_CONFIG[currentSymbolKey].archetype}
              </div>
              <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-gray-300 shadow-lg">
                {status === 'TESTING_SYMBOL' ? '⚡ RILEVAMENTO OSCILLAZIONE ATTIVO...' : status}
              </div>
            </div>

            {/* Overlay del simbolo al centro della Webcam durante lo zoom */}
            {showOverlayOnCam && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className={`flex items-center justify-center ${isZooming ? 'animate-symbol-zoom-slow' : 'opacity-30 scale-75'}`}>
                  <div className="p-8 rounded-3xl">
                    {currentSymbolKey === 'cerchio' && <div className="h-32 w-32 rounded-full bg-black shadow-[0_0_18px_rgba(255,255,255,0.28)]" aria-label="Cerchio pieno" />}
                    {currentSymbolKey === 'asta' && <div className="h-40 w-12 rounded-sm bg-black shadow-[0_0_18px_rgba(255,255,255,0.28)]" aria-label="Asta piena" />}
                    {currentSymbolKey === 'triangolo' && <div className="h-0 w-0 border-l-[4.5rem] border-r-[4.5rem] border-b-[8rem] border-l-transparent border-r-transparent border-b-black drop-shadow-[0_0_18px_rgba(255,255,255,0.28)]" aria-label="Triangolo pieno" />}
                  </div>
                </div>
              </div>
            )}
         </div>
      </div>

      <div className="my-6 flex justify-center">
        {status === 'WAITING_CALIBRATION' && (
            <button onClick={startCalibration} disabled={!isCameraReady} className="w-full bg-cyan-600 text-white font-black py-4 px-8 rounded-2xl transition duration-300 disabled:opacity-30 uppercase tracking-widest shadow-xl hover:bg-cyan-500">
                Inizia Calibrazione e Test T.A.P.
            </button>
        )}
        {status === 'CALIBRATING' && (
             <div className="flex items-center space-x-3 bg-cyan-950/20 px-6 py-4 rounded-2xl border border-cyan-500/30 animate-pulse">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
                <span className="text-cyan-400 font-black uppercase tracking-widest text-sm">CALIBRAZIONE MULTI-CAMPIONE IN CORSO...</span>
           </div>
        )}
        {(status === 'WAITING_INTRO' || status === 'TESTING_SYMBOL') && (
           <div className="flex items-center space-x-3 bg-cyan-950/20 px-6 py-4 rounded-2xl border border-cyan-500/30 animate-pulse-cyan">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
                <span className="text-cyan-400 font-black uppercase tracking-widest text-sm">TEST T.A.P. IN CORSO...</span>
           </div>
        )}
      </div>

       <div className="text-center p-6 rounded-2xl min-h-[120px] flex flex-col justify-center border bg-gray-900/40 border-gray-800 backdrop-blur">
        <p className={`font-medium text-lg leading-relaxed ${status === 'SUCCESS' ? 'text-green-400' : 'text-cyan-200'}`}>
          {message}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
            {(['cerchio', 'asta', 'triangolo'] as SymbolType[]).map(sym => (
                <div key={sym} className={`p-2 rounded-lg border ${results[sym] ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300' : 'bg-gray-900 border-gray-800'}`}>
                    {SYMBOLS_CONFIG[sym].label}: <span className="font-bold text-white">{results[sym] || '-'}</span>
                </div>
            ))}
        </div>
      </div>

      {diagnosis.isValid && (
        <div className="mt-6 p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-center animate-fadeIn">
          <h4 className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-1">Diagnosi T.A.P. Rilevata</h4>
          <p className="text-xl font-serif font-bold text-white mb-2">{diagnosis.tipologia}</p>
          {diagnosis.distonia && <p className="text-sm text-indigo-200">Distonia: {diagnosis.distonia}</p>}
          {diagnosis.profilo && (
            <div className="mt-5 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-xl bg-black/20 p-3"><p className="text-[10px] uppercase tracking-widest text-indigo-300">Famiglia e referente</p><p className="text-sm text-white">{diagnosis.profilo.famiglia} — {diagnosis.profilo.referente}</p></div>
              <div className="rounded-xl bg-black/20 p-3"><p className="text-[10px] uppercase tracking-widest text-indigo-300">Polarità</p><p className="text-sm text-white">{diagnosis.profilo.polarita}</p></div>
              <div className="rounded-xl bg-black/20 p-3 sm:col-span-2"><p className="text-[10px] uppercase tracking-widest text-indigo-300">Origine interpretativa</p><p className="text-sm text-indigo-100">{diagnosis.profilo.origine}</p></div>
              <div className="rounded-xl bg-black/20 p-3 sm:col-span-2"><p className="text-[10px] uppercase tracking-widest text-indigo-300">Stile comportamentale</p><p className="text-sm text-indigo-100">{diagnosis.profilo.stile}</p></div>
              <div className="rounded-xl bg-black/20 p-3 sm:col-span-2"><p className="text-[10px] uppercase tracking-widest text-indigo-300">Dinamica relazionale</p><p className="text-sm text-indigo-100">{diagnosis.profilo.relazioni}</p></div>
              <div className="rounded-xl bg-black/20 p-3 sm:col-span-2"><p className="text-[10px] uppercase tracking-widest text-indigo-300">Meccanismo e orientamento</p><p className="text-sm text-indigo-100">{diagnosis.profilo.meccanismo} {diagnosis.profilo.orientamento}</p></div>
            </div>
          )}
        </div>
      )}

      {status === 'SUCCESS' && (
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleRepeat} className="flex-1 bg-gray-800 text-gray-300 font-black py-4 px-6 rounded-2xl hover:bg-gray-700 transition duration-300 uppercase tracking-widest border border-white/5">RIPROVA TEST</button>
            <button onClick={handleProsegui} className="flex-1 bg-cyan-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-cyan-500 transition duration-300 shadow-xl uppercase tracking-widest">PROSEGUI →</button>
        </div>
      )}

      <TestControls onRepeat={handleRepeat} onExit={handleExit} showControls={showControls} />
    </div>
  );
};

export default TestTAP;
