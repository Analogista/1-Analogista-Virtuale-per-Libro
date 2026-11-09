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

const sigilliMapping = {
  colpa: "Sensi di colpa",
  abbandono: "Paura dell'abbandono",
  disistima: "Mancanza di autostima",
  giudizio: "Timore del giudizio degli altri"
};
type SigilloKey = keyof typeof sigilliMapping;

const TestSigilliVincoli: React.FC<ScreenProps> = ({ setPage }) => {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<'IDLE' | 'CALIBRATING' | 'TESTING' | 'SELECTING' | 'SUCCESS'>('IDLE');
  const [message, setMessage] = useState('Premi "Inizia Calibrazione" per avviare il test dei sigilli e vincoli.');
  const [results, setResults] = useState<Partial<Record<SigilloKey, string>>>(userData.sigilli || {});
  const [selectedSigillo, setSelectedSigillo] = useState<string>(userData.sigilloFinale || '');
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
      await voiceService.speak("Stessa posizione: in piedi, braccia lungo il corpo. Dopo il conto alla rovescia inizieremo il test dei sigilli.");
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
    setSelectedSigillo('');
  };

  const handleExit = () => {
    voiceService.cancel();
    setPage(0);
  };

  const completeTest = async (finalSigillo: string, finalMessage: string) => {
    setSelectedSigillo(finalSigillo);
    setMessage(finalMessage);
    setStatus('SUCCESS');
    setUserData(prev => ({
      ...prev,
      sigilloFinale: finalSigillo,
      completedTests: { ...prev.completedTests, sigilli: true }
    }));
    try {
      await voiceService.speak(`${finalMessage}. Test completato con successo. Puoi visualizzare l'esito.`);
    } catch { /* ignore */ }
  };

  const startTest = async () => {
    setStatus('TESTING');
    setResults({});
    const currentSigilli: Record<string, string> = {};
    const nome = userData.nome ? userData.nome : 'Amico';
    const distoniaRef = userData.puntoDistonicoFinale;

    try {
      if (distoniaRef && distoniaRef !== 'Nessun punto distonico') {
        await voiceService.speak(`Caro inconscio di ${nome}, in relazione all'area emersa (${distoniaRef}), adesso scopriamo quali sigilli, complessi o blocchi emotivi sono presenti in te.`);
      } else {
        await voiceService.speak(`Caro inconscio di ${nome}, ora verifichiamo quali sigilli o complessi emotivi sono presenti in te.`);
      }

      const sigilliQuestionMapping: Record<SigilloKey, string> = {
        colpa: `Caro inconscio, sono i sensi di colpa? Sì o No, attendo risposta.`,
        abbandono: `È la paura dell'abbandono? Sì o no, attendo risposta.`,
        giudizio: `È il timore del giudizio degli altri? Sì o no, attendo risposta.`,
        disistima: `È la mancanza di autostima? Sì o no, attendo risposta.`
      };

      for (const sigillo of Object.keys(sigilliMapping) as SigilloKey[]) {
        setMessage(`Indagine in corso: ${sigilliMapping[sigillo]}...`);
        const text = sigilliQuestionMapping[sigillo];
        const response = await voiceService.askQuestion(text);

        setResults(prev => ({ ...prev, [sigillo]: response }));
        currentSigilli[sigillo] = response;
        await new Promise(res => setTimeout(res, 1200));
      }

      setUserData(prev => ({ ...prev, sigilli: currentSigilli as any }));

      const sigilliPresenti = (Object.keys(currentSigilli) as SigilloKey[]).filter(k => currentSigilli[k] === 'SI');

      if (sigilliPresenti.length === 0) {
        await completeTest("Nessun sigillo rilevato", "Nessun sigillo o blocco emotivo primario rilevato! Il tuo inconscio non evidenzia vincoli attivi.");
      } else if (sigilliPresenti.length === 1) {
        const finalSigillo = sigilliMapping[sigilliPresenti[0]];
        await completeTest(finalSigillo, `Sigillo identificato: ${finalSigillo}.`);
      } else {
        setStatus('SELECTING');
        setMessage('Sono emersi più sigilli. Determiniamo quello prioritario...');
        await voiceService.speak(`Caro inconscio, individuiamo quale dei sigilli presenti desideri sbloccare con priorità.`);

        let priorityFound = '';
        for (const sigillo of sigilliPresenti) {
          const sigilloName = sigilliMapping[sigillo];
          setMessage(`Vuoi risolvere: ${sigilloName}?`);
          const priorityResponse = await voiceService.askQuestion(`Vuoi risolvere ${sigilloName}? Sì o no, attendo risposta.`);
          if (priorityResponse === 'SI') {
            priorityFound = sigilloName;
            break;
          }
        }

        if (!priorityFound) {
          priorityFound = sigilliMapping[sigilliPresenti[0]];
        }

        await completeTest(priorityFound, `Sigillo prioritario identificato: ${priorityFound}.`);
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
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 mb-1">
            Test Standalone
          </span>
          <h2 className="text-2xl font-serif font-black text-gray-900">Test Sigilli e Vincoli</h2>
          <h3 className="text-sm font-medium text-gray-600">Sensi di colpa, paura dell'abbandono, mancanza di autostima, giudizio</h3>
        </div>
        <button
          onClick={handleExit}
          className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          &larr; Torna alla Home
        </button>
      </div>

      <VideoAccordion videoId="jTXIaDt9G_M" title="🎥 Video: Cosa sono i Sigilli e i Vincoli?" />

      <InfoBox>
        <p>
          I sigilli sono complessi emotivi inconsci legati a vissuti del passato. Questo test opera in completa autonomia per individuare quali vincoli emotivi sono attivi dentro di te.
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
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 uppercase tracking-widest text-sm"
          >
            Inizia Calibrazione e Test
          </button>
        )}
        {status === 'CALIBRATING' && (
          <div className="flex items-center space-x-2 bg-purple-50 border border-purple-200 px-5 py-3 rounded-xl">
            <span className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-ping"></span>
            <span className="text-purple-800 font-bold uppercase tracking-widest text-xs">Calibrazione in corso...</span>
          </div>
        )}
        {(status === 'TESTING' || status === 'SELECTING') && (
          <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 px-5 py-3 rounded-xl">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-800 font-bold text-sm">
              {status === 'TESTING' ? 'Test dei sigilli in corso...' : 'Selezione del sigillo prioritario...'}
            </span>
          </div>
        )}
      </div>

      {/* Message and Indicator Grid */}
      <div className="text-center p-5 bg-slate-50 rounded-xl border border-slate-200 min-h-[90px] flex flex-col justify-center">
        <p className={`font-semibold text-base ${status === 'SUCCESS' ? 'text-purple-700' : 'text-slate-800'}`}>
          {message}
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {(Object.keys(sigilliMapping) as SigilloKey[]).map(key => {
            const val = results[key];
            const isPresent = val === 'SI';
            return (
              <div
                key={key}
                className={`p-2.5 rounded-lg border flex justify-between items-center transition ${
                  isPresent
                    ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                    : val === 'NO'
                    ? 'bg-slate-50 border-slate-200 text-slate-600'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <span>{sigilliMapping[key]}</span>
                <span className="font-bold text-xs uppercase px-2 py-0.5 rounded">
                  {val === 'SI' ? '🔐 Attivo' : val === 'NO' ? '✓ Libero' : '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Standalone Outcome Card */}
      {status === 'SUCCESS' && (
        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 text-slate-800 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🔐</span>
            <div>
              <h4 className="font-serif font-black text-xl text-purple-950">Esito Test Sigilli e Vincoli</h4>
              <p className="text-xs text-purple-800 font-medium">Analisi indipendente completata e registrata nel profilo.</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-purple-200 my-3">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-800 mb-1">Sigillo Primario Identificato:</p>
            <p className="text-lg font-serif font-bold text-purple-900">
              {selectedSigillo || 'Nessun sigillo rilevato'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {selectedSigillo && selectedSigillo !== 'Nessun sigillo rilevato'
                ? `L'inconscio manifesta una risonanza dominante con il sigillo "${selectedSigillo}". Comprendere l'origine di questo vincolo permette di liberare energia vitale.`
                : 'Nessun vincolo emotivo restrittivo emerso in questa sessione.'}
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
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-300 text-sm"
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

export default TestSigilliVincoli;
