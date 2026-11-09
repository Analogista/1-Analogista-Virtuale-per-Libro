/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import CameraView from '../components/CameraView';
import TestControls from '../components/TestControls';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

const CalibrazioneScreen: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData, setUserData } = useUser();
  const { apiKey } = useApiKey();
  const [status, setStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS'>('IDLE');
  const [message, setMessage] = useState('Premi "Avvia Calibrazione" per iniziare.');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [sensitivity, setSensitivity] = useState(75);
  
  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  useEffect(() => {
    if (apiKey) voiceService.setApiKey(apiKey);
  }, [apiKey, voiceService]);

  useEffect(() => {
    if (userData.completedTests?.calibrazione && status === 'IDLE') {
      const timer = setTimeout(() => {
        setStatus('SUCCESS');
        setMessage("Calibrazione precedentemente completata! Puoi ricalibrare o tornare ai test.");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [userData.completedTests?.calibrazione, status]);

  useEffect(() => {
    return () => {
      voiceService.cancel();
    };
  }, [voiceService]);

  const handleCameraReady = () => {
    if (videoRef.current) {
      voiceService.initializeDetector(videoRef.current);
      voiceService.updateSensitivity(sensitivity);
      setIsCameraReady(true);
    }
  };

  const handleCalibrated = () => {
    setStatus('SUCCESS');
    setMessage("Calibrazione completata con successo! Prova ad oscillare per verificare il feedback corporeo.");
    setUserData(prev => ({
      ...prev,
      completedTests: { ...prev.completedTests, calibrazione: true }
    }));
    voiceService.startManualDetection();
  };
  
  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSensitivity(val);
    if (isCameraReady) {
      voiceService.updateSensitivity(val);
    }
  };

  const playVoiceGuide = async () => {
    try {
      const nome = userData?.nome || "Amico";
      await voiceService.speak(`Poggia lo smartphone o il pc di fronte a te e mettiti in piedi. È sufficiente che la telecamera inquadri il tuo busto, dalla vita alla testa. Questo test ci servirà per calibrare l'oscillazione del tuo corpo, in avanti o indietro. In alto trovi la barra per regolare la sensibilità. Quando premerai il pulsante arancione ci sarà un conto alla rovescia da 5 a 0 e congelerà la posizione iniziale. Nei test successivi potrai sempre ricalibrare. Buona sessione ${nome}.`);
      setHasPlayedIntro(true);
    } catch (e) {
      console.error(e);
    }
  };

  const startCalibration = async () => {
    setStatus('TESTING');
    setMessage("Preparazione in corso...");
    
    try {
      if (!hasPlayedIntro) {
        await voiceService.speak(`Poggia il dispositivo di fronte a te e mettiti in piedi. Calibriamo l'oscillazione del tuo corpo. Mantieni una postura rilassata.`);
        setHasPlayedIntro(true);
      }
      
      if (cameraRef.current) {
        cameraRef.current.startCalibration();
      }
    } catch (error) {
      console.error("Error during calibration:", error);
      setMessage("Si è verificato un errore. Riprova la calibrazione.");
      setStatus('IDLE');
    }
  };

  const handleRepeat = () => {
    voiceService.cancel();
    setStatus('IDLE');
    setMessage('Premi "Inizia Calibrazione" per iniziare.');
  };
  
  const handleExit = () => {
    voiceService.cancel();
    setPage(0);
  };

  const isProMode = true;

  return (
    <div className={`${isProMode ? 'bg-[#0a0a0c] text-white' : 'bg-white text-gray-800'} min-h-screen p-4 sm:p-6 pb-24 relative transition-colors duration-500`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-950 border border-cyan-800 text-cyan-400 mb-1">
            Preparazione Standalone
          </span>
          <h2 className={`text-2xl font-serif font-black ${isProMode ? 'text-cyan-400' : 'text-gray-800'}`}>
            CALIBRAZIONE POSTURA E OSCILLAZIONE
          </h2>
          <h3 className={`text-sm tracking-widest uppercase font-bold ${isProMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Zero Assoluto e Soglia di Sensibilità
          </h3>
        </div>
        <button onClick={handleExit} className="text-xs uppercase tracking-widest font-bold text-cyan-500 hover:text-cyan-400 border border-cyan-900/60 px-3 py-1.5 rounded-lg transition">
          &larr; ESCI / HOME
        </button>
      </div>

      {/* SENSITIVITY SLIDER */}
      <div className={`mb-6 p-4 rounded-xl border ${isProMode ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <label htmlFor="sensitivity" className="block text-xs font-bold uppercase tracking-widest mb-3 flex justify-between">
          <span>SENSIBILITÀ OSCILLAZIONE: {sensitivity}%</span>
        </label>
        <input 
          type="range" 
          id="sensitivity" 
          min="0" 
          max="100" 
          value={sensitivity} 
          onChange={handleSensitivityChange}
          className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-2"
        />
        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
          <span>MINIMA (Movimenti ampi)</span>
          <span>MASSIMA (Micro-oscillazioni)</span>
        </div>
      </div>

      <div className="my-6">
        <div className={`relative rounded-2xl overflow-hidden shadow-2xl border-4 ${isProMode ? 'border-gray-800' : 'border-gray-200'} bg-black`}>
          <CameraView 
            ref={cameraRef}
            videoRef={videoRef} 
            onReady={handleCameraReady}
            onCalibrated={handleCalibrated}
            sensitivity={sensitivity}
            onVoiceGuide={playVoiceGuide}
          />
        </div>
         
        <div className="mt-8 flex flex-col items-center gap-4 w-full">
          {(status === 'IDLE' || status === 'SUCCESS') && (
            <button
              onClick={startCalibration}
              disabled={!isCameraReady}
              className={`w-full font-black py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl text-base uppercase tracking-[0.2em] transform active:scale-95 ${
                !isCameraReady 
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : status === 'SUCCESS'
                    ? 'bg-amber-600 text-white hover:bg-amber-500 border-b-4 border-amber-900'
                    : 'bg-cyan-600 text-white hover:bg-cyan-500 hover:shadow-cyan-500/20 shadow-lg'
              }`}
            >
              {status === 'SUCCESS' ? 'RICALIBRA POSIZIONE' : 'INIZIA CALIBRAZIONE'}
            </button>
          )}
          
          {status === 'TESTING' && (
            <div className="w-full flex items-center justify-center space-x-3 bg-cyan-950/30 px-6 py-4 rounded-2xl border border-cyan-500/30 animate-pulse-cyan">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
              <span className="text-cyan-400 font-black tracking-widest text-sm uppercase">RILEVAMENTO POSIZIONE ATTIVO</span>
            </div>
          )}
        </div>
      </div>

      <div className={`text-center p-6 rounded-2xl min-h-[80px] flex flex-col justify-center border transition-all ${
        isProMode ? 'bg-gray-900/20 border-gray-800/50' : 'bg-gray-50 border-gray-100'
      }`}>
        <p className={`font-medium text-lg leading-relaxed ${
          status === 'SUCCESS' ? 'text-green-400' : (isProMode ? 'text-gray-300' : 'text-blue-800')
        }`}>
          {message}
        </p>
      </div>

      {status === 'SUCCESS' && (
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => setPage(0)} 
            className="w-full sm:w-64 bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 px-6 rounded-2xl transition duration-300 shadow-xl uppercase tracking-widest"
          >
            TORNA AI TEST →
          </button>
        </div>
      )}

      <TestControls 
        onRepeat={handleRepeat}
        onExit={handleExit}
        showControls={status === 'TESTING'}
      />
    </div>
  );
};

export default CalibrazioneScreen;
