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

const puntiMapping = {
  famiglia: "rapporti con la famiglia d'origine",
  sentimentali: "rapporti sentimentali e affettivi",
  sessuali: "rapporti sessuali e passionali",
  autorealizzazione: "autorealizzazione, hobby e lavoro"
};
type PuntoKey = keyof typeof puntiMapping;

const TestPuntiDistonici: React.FC<ScreenProps> = ({ setPage }) => {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<'IDLE' | 'CALIBRATING' | 'TESTING' | 'SELECTING' | 'SUCCESS'>('IDLE');
  const [message, setMessage] = useState('Premi "Inizia Calibrazione" per avviare il test dei punti distonici.');
  const [results, setResults] = useState<Partial<Record<PuntoKey, string>>>(userData.puntiDistonici || {});
  const [selectedPunto, setSelectedPunto] = useState<string>(userData.puntoDistonicoFinale || '');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);

  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  useEffect(() => {
    return () => voiceService.cancel();
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
      await voiceService.speak("Stessa posizione: in piedi, braccia lungo il corpo. Dopo il conto alla rovescia inizieremo il test dei punti distonici.");
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
    setMessage('Premi "Inizia Calibrazione" per ricominciare il test.');
    setResults({});
    setSelectedPunto('');
  };

  const handleExit = () => {
    voiceService.cancel();
    setPage(0);
  };

  const completeTest = async (finalPunto: string, finalMessage: string) => {
    setSelectedPunto(finalPunto);
    setMessage(finalMessage);
    setStatus('SUCCESS');
    setUserData(prev => ({
      ...prev,
      puntoDistonicoFinale: finalPunto,
      completedTests: { ...prev.completedTests, puntiDistonici: true }
    }));
    try {
      await voiceService.speak(`${finalMessage}. Test completato con successo. Puoi visualizzare l'esito finale.`);
    } catch { /* ignore */ }
  };

  const startTest = async () => {
    setStatus('TESTING');
    setResults({});
    const currentPuntiDistonici: Record<string, string> = {};
    const nome = userData.nome ? userData.nome : 'Amico';

    try {
      await voiceService.speak(`Caro inconscio di ${nome}, adesso verifichiamo le 4 aree fondamentali della tua vita per individuare eventuali punti distonici.`);

      for (const punto of Object.keys(puntiMapping) as PuntoKey[]) {
        setMessage(`Indagine in corso: ${puntiMapping[punto]}...`);
        const text = `Caro inconscio, sei soddisfatto di come ${nome} sta gestendo i ${puntiMapping[punto]}? Sì o No? Attendo risposta.`;
        const response = await voiceService.askQuestion(text);

        setResults(prev => ({ ...prev, [punto]: response }));
        currentPuntiDistonici[punto] = response;
        await new Promise(res => setTimeout(res, 1200));
      }

      setUserData(prev => ({
        ...prev,
        puntiDistonici: currentPuntiDistonici as any
      }));

      // In analogic disciplines, 'NO' means dissatisfaction / distonic point
      const nonSoddisfatti = (Object.keys(currentPuntiDistonici) as PuntoKey[]).filter(k => currentPuntiDistonici[k] === 'NO');

      if (nonSoddisfatti.length === 0) {
        await completeTest('Nessun punto distonico', 'Ottimo! Nessun punto distonico rilevato: tutte e 4 le aree risultano in equilibrio.');
      } else if (nonSoddisfatti.length === 1) {
        const unicoPunto = puntiMapping[nonSoddisfatti[0]];
        await completeTest(unicoPunto, `Punto distonico identificato: ${unicoPunto}.`);
      } else {
        // More than 1 distonic point: ask unconscious which one is priority
        setStatus('SELECTING');
        setMessage('Sono emersi più punti distonici. Identifichiamo quello prioritario...');
        await voiceService.speak("Sono emerse più aree distoniche. Ora determiniamo quale desideri risolvere prima.");

        let identifiedPunto = '';
        for (const punto of nonSoddisfatti) {
          const nomeArea = puntiMapping[punto];
          setMessage(`Vuoi risolvere subito: ${nomeArea}?`);
          const priorityResponse = await voiceService.askQuestion(`Vuoi risolvere ${nomeArea}? Sì o no, attendo risposta.`);
          if (priorityResponse === 'SI') {
            identifiedPunto = nomeArea;
            break;
          }
        }

        if (!identifiedPunto) {
          identifiedPunto = puntiMapping[nonSoddisfatti[0]];
        }

        await completeTest(identifiedPunto, `Punto distonico prioritario: ${identifiedPunto}.`);
      }
    } catch (error) {
      console.error(error);
      if (status !== 'IDLE') setMessage("Test interrotto. Clicca su Riprova per ricominciare.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 pb-24 relative border border-slate-100">
      {/* Header Test */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 mb-1">
            Test Standalone
          </span>
          <h2 className="text-2xl font-serif font-black text-gray-900">Test Punti Distonici</h2>
          <h3 className="text-sm font-medium text-gray-600">Le 4 Aree della Vita: famiglia, sentimenti, passioni, realizzazione</h3>
        </div>
        <button
          onClick={handleExit}
          className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          &larr; Torna alla Home
        </button>
      </div>

      <VideoAccordion videoId="JKC5t2boVK4" title="🎥 Video: Cosa sono i Punti Distonici?" />

      <InfoBox>
        <p>
          Posizionati in piedi di fronte alla webcam con il busto centrato. Il test indaga in modo indipendente le 4 aree fondamentali della tua vita (famiglia, affetti, passioni, autorealizzazione) per individuare dove si annidano i disagi emotivi.
        </p>
      </InfoBox>

      {/* Camera View */}
      <div className="my-6">
        <CameraView
          ref={cameraRef}
          videoRef={videoRef}
          onReady={handleCameraReady}
          onCalibrated={handleCalibrated}
        />
      </div>

      {/* Status Controls */}
      <div className="my-6 flex justify-center">
        {status === 'IDLE' && !isCalibrated && (
          <button
            onClick={startCalibration}
            disabled={!isCameraReady}
            className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 uppercase tracking-widest text-sm"
          >
            Inizia Calibrazione e Test
          </button>
        )}
        {status === 'CALIBRATING' && (
          <div className="flex items-center space-x-2 bg-cyan-50 border border-cyan-200 px-5 py-3 rounded-xl">
            <span className="w-2.5 h-2.5 bg-cyan-600 rounded-full animate-ping"></span>
            <span className="text-cyan-800 font-bold uppercase tracking-widest text-xs">Calibrazione in corso...</span>
          </div>
        )}
        {(status === 'TESTING' || status === 'SELECTING') && (
          <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 px-5 py-3 rounded-xl">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-800 font-bold text-sm">
              {status === 'TESTING' ? 'Test delle 4 aree in corso...' : 'Scelta dell\'area prioritaria...'}
            </span>
          </div>
        )}
      </div>

      {/* Message and Real-time indicators */}
      <div className="text-center p-5 bg-slate-50 rounded-xl border border-slate-200 min-h-[90px] flex flex-col justify-center">
        <p className={`font-semibold text-base ${status === 'SUCCESS' ? 'text-emerald-700' : 'text-slate-800'}`}>
          {message}
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {(Object.keys(puntiMapping) as PuntoKey[]).map(key => {
            const val = results[key];
            const isDistonic = val === 'NO';
            const isArmonico = val === 'SI';
            return (
              <div
                key={key}
                className={`p-2.5 rounded-lg border flex justify-between items-center transition ${
                  isDistonic
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                    : isArmonico
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <span className="capitalize">{puntiMapping[key]}</span>
                <span className="font-bold text-xs uppercase px-2 py-0.5 rounded">
                  {val === 'SI' ? '✓ Soddisfatto' : val === 'NO' ? '⚠️ Distonia' : '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Standalone Outcome Card */}
      {status === 'SUCCESS' && (
        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 text-slate-800 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎯</span>
            <div>
              <h4 className="font-serif font-black text-xl text-emerald-950">Esito Test Punti Distonici</h4>
              <p className="text-xs text-emerald-800 font-medium">Analisi indipendente completata e salvata nel tuo profilo.</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-emerald-200 my-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">Punto Distonico Prioritario:</p>
            <p className="text-lg font-serif font-bold text-emerald-900">
              {selectedPunto || 'Nessun punto distonico rilevato'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {selectedPunto && selectedPunto !== 'Nessun punto distonico'
                ? `L'inconscio segnala che i blocchi emotivi attuali si riflettono principalmente su: ${selectedPunto}.`
                : 'Tutte le aree di vita analizzate risultano in equilibrio analogico.'}
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRepeat}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-300 transition duration-300 shadow-sm text-sm"
            >
              🔄 Riprova Test
            </button>
            <button
              onClick={() => setPage(0)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-300 text-sm"
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

      <TestControls
        onRepeat={handleRepeat}
        onExit={handleExit}
        showControls={status === 'TESTING' || status === 'SELECTING'}
      />
    </div>
  );
};

export default TestPuntiDistonici;
