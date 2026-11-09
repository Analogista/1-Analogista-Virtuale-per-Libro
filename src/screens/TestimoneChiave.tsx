/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import InfoBox from '../components/InfoBox';
import VideoAccordion from '../components/VideoAccordion';
import TestControls from '../components/TestControls';

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
  const [foundWitness, setFoundWitness] = useState<string>(userData.testimoneChiave || '');
    
  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  const { sigilloFinale, timeLine } = userData;

  useEffect(() => { return () => voiceService.cancel(); }, [voiceService]);

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
      await voiceService.speak("Stessa posizione: in piedi, braccia lungo il corpo. Dopo il conto alla rovescia inizieremo la ricerca del testimone.");
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
    voiceService.cancel();
    setStatus('IDLE');
    setIsCalibrated(false);
    setFoundWitness('');
    setMessage('Pronto a scoprire il Testimone Chiave?');
  };

  const handleExit = () => {
    voiceService.cancel();
    setPage(0);
  };
    
  const startTest = async () => {
    setStatus('TESTING');
            
    const testimoniMaschi = ["Tuo padre", "Tuo nonno", "Tuo zio", "Tuo fratello", "Tuo cugino", "Un insegnante", "Un amico"];
    const testimoniFemmine = ["Tua madre", "Tua nonna", "Tua zia", "Tua sorella", "Tua cugina", "Un'insegnante", "Un'amica"];
    const parentiAmbigui = ["Tuo nonno", "Tuo zio", "Tuo cugino", "Tua nonna", "Tua zia", "Tua cugina"];

    try {
      const introText = sigilloFinale && timeLine?.etaEventoCausa
        ? `Adesso andremo a ricercare quel soggetto, maschio o femmina, legato al sigillo "${sigilloFinale}" all'età di ${timeLine.etaEventoCausa} anni.`
        : `Adesso andremo a ricercare la figura chiave, maschile o femminile, legata all'evento causa nel tuo passato.`;

      setMessage("Introduzione in corso...");
      await voiceService.speak(introText);
      await new Promise(res => setTimeout(res, 1000));

      setMessage("L'evento fu causato o vissuto con un uomo? (Sì/No)");
      let response = await voiceService.askQuestion("Era un uomo? Sì o No, attendo risposta.");

      let testimoniDaTestare: string[] = [];
      if (response === 'SI') {
        testimoniDaTestare = testimoniMaschi;
      } else if (response === 'NO') {
        setMessage("L'evento fu vissuto con una donna? (Sì/No)");
        response = await voiceService.askQuestion("Era una donna? Sì o No, attendo risposta.");
        if (response === 'SI') {
          testimoniDaTestare = testimoniFemmine;
        } else {
          setMessage("Genere del testimone non univoco. Il test si è concluso.");
          setUserData(prev => ({ ...prev, testimoneChiave: "Non univoco", completedTests: { ...prev.completedTests, testimone: true } }));
          setStatus('SUCCESS');
          return;
        }
      } else {
        testimoniDaTestare = testimoniMaschi; // Fallback
      }

      let selectedWitness = 'Non identificato';
      for (const testimone of testimoniDaTestare) {
        setMessage(`Era ${testimone}?`);
        const resp = await voiceService.askQuestion(`Era ${testimone}? Sì o No, attendo risposta.`);
        if (resp === 'SI') {
          selectedWitness = testimone;
          if (parentiAmbigui.includes(testimone)) {
            const side = await voiceService.askQuestion("Da parte di papà? Sì o No, attendo risposta.");
            selectedWitness += side === 'SI' ? ' (Paterno)' : ' (Materno)';
          }
          break;
        }
      }

      setFoundWitness(selectedWitness);
      setMessage(`Testimone identificato: ${selectedWitness}.`);
      await voiceService.speak(`Il testimone chiave identificato è ${selectedWitness}.`);

      setUserData(prev => ({
        ...prev,
        testimoneChiave: selectedWitness,
        completedTests: { ...prev.completedTests, testimone: true }
      }));
      setStatus('SUCCESS');
    } catch {
      if (status !== 'IDLE') setMessage("Test interrotto.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 pb-24 relative border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 mb-1">
            Test Standalone
          </span>
          <h2 className="text-2xl font-serif font-black text-gray-900">Testimone Chiave</h2>
          <h3 className="text-sm font-medium text-gray-600">Ricerca della figura coinvolta nell'evento causa</h3>
        </div>
        <button onClick={handleExit} className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg transition">
          &larr; Torna alla Home
        </button>
      </div>

      <VideoAccordion videoId="c50y8d00yS4" title="🎥 Video: Il Testimone Chiave nelle Discipline Analogiche" />

      <InfoBox>
        <p>
          Il Testimone Chiave è la figura specifica (genitore, parente, figura autoritaria o affettiva) collegata alla memoria emotiva dell'inconscio.
        </p>
      </InfoBox>

      <div className="my-6">
        <CameraView ref={cameraRef} videoRef={videoRef} onReady={handleCameraReady} onCalibrated={handleCalibrated} />
      </div>

      <div className="my-6 flex justify-center">
        {status === 'IDLE' && !isCalibrated && (
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
            <span className="text-blue-800 font-bold text-sm">Ricerca testimone in corso...</span>
          </div>
        )}
      </div>

      <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[80px] flex flex-col items-center justify-center">
        <p className={`font-semibold text-base ${status === 'SUCCESS' ? 'text-teal-800' : 'text-blue-900'}`}>{message}</p>
      </div>

      {status === 'SUCCESS' && foundWitness && (
        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-300 text-slate-800 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">👤</span>
            <div>
              <h4 className="font-serif font-black text-xl text-teal-950">Testimone Chiave Identificato</h4>
              <p className="text-lg font-bold text-teal-900">{foundWitness}</p>
            </div>
          </div>
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
