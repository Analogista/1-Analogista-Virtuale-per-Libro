/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService, SessionGuard } from '../services/AdvancedVoiceService';
import InfoBox from '../components/InfoBox';
import VideoAccordion from '../components/VideoAccordion';
import TestControls from '../components/TestControls';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

const TestNome: React.FC<ScreenProps> = ({ setPage }) => {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<'IDLE' | 'CALIBRATING' | 'TESTING_VERO' | 'TESTING_FALSO' | 'DONE' | 'SUCCESS'>('IDLE');
  const [message, setMessage] = useState('Premi "Inizia Calibrazione" per avviare il test del nome.');
  const [result, setResult] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [fakeNameUsed, setFakeNameUsed] = useState('');

  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  useEffect(() => {
    return () => {
      voiceService.cancel();
    };
  }, [voiceService]);

  const handleCameraReady = () => {
    if (videoRef.current) {
      voiceService.initializeDetector(videoRef.current);
      setIsCameraReady(true);
    }
  };

  const handleCalibrated = () => {
    setIsCalibrated(true);
    startTest();
  };

  const startCalibration = async () => {
    setStatus('CALIBRATING');
    setMessage("Rimani immobile per la calibrazione...");
    try {
      await voiceService.speak("Stessa posizione: in piedi, braccia lungo il corpo. Dopo il conto alla rovescia inizieremo il test del nome.");
    } catch { /* ignore */ }
    if (cameraRef.current) {
      cameraRef.current.startCalibration();
    }
  };

  const handleRepeat = () => {
    voiceService.cancel();
    setStatus('IDLE');
    setIsCalibrated(false);
    setMessage('Premi "Inizia Calibrazione" per ricominciare.');
    setResult('');
    setFakeNameUsed('');
  };

  const handleExit = () => {
    if (window.confirm("Sei sicuro di voler uscire? La voce e il test verranno interrotti.")) {
        voiceService.cancel();
        setPage(0);
    }
  };

  const generateFakeName = () => {
    const maleNames = ["Marco", "Luca", "Andrea", "Matteo", "Paolo", "Giuseppe", "Francesco", "Roberto", "Luigi", "Antonio", "Alessandro", "Davide", "Stefano", "Giovanni", "Federico"];
    const femaleNames = ["Maria", "Giulia", "Anna", "Sofia", "Chiara", "Francesca", "Laura", "Sara", "Elena", "Valentina", "Alice", "Giorgia", "Martina", "Silvia", "Beatrice"];

    const isFemale = userData.genere === 'FEMMINA';
    const namePool = isFemale ? femaleNames : maleNames;

    const userFirstName = (userData.nome || '').trim().toLowerCase();
    const validNames = namePool.filter(n => {
      const lowerN = n.toLowerCase();
      return userFirstName !== lowerN && !userFirstName.includes(lowerN) && !lowerN.includes(userFirstName);
    });

    if (validNames.length > 0) {
      return validNames[Math.floor(Math.random() * validNames.length)];
    }

    return isFemale ? "Vittoria" : "Stefano";
  };

  const startTest = async () => {
    setStatus('TESTING_VERO');
    setResult('');
    const userRealName = userData.nome || 'Amico';
    const guard = new SessionGuard(() => voiceService.cancel());
    
    try {
      setMessage('Test del tuo nome vero in corso...');
      const veroRes = await voiceService.askQuestionWithSingleRetry(
        `Bene, sei in posizione? Fai un bel respiro. Caro inconscio, è vero, sì o no, che il tuo nome è ${userRealName}? Se ti chiami ${userRealName} spingerai il corpo in avanti altrimenti indietro. Attendo risposta.`,
        userRealName
      );
      if (guard.isCancelled()) return;
      const veroResponse = veroRes.response;

      const newTestNomeData = { ...userData.testNome, nomeVero: veroResponse };
      setUserData(prev => ({ ...prev, testNome: newTestNomeData }));
      setResult(`Risposta al nome vero (${userRealName}): ${veroResponse}.`);
      
      if (!await guard.delay(2000)) return;

      setStatus('TESTING_FALSO');
      setMessage('Ora verifichiamo la reazione con un nome falso...');
      
      const fakeName = generateFakeName();
      setFakeNameUsed(fakeName);
      
      const falsoRes = await voiceService.askQuestionWithSingleRetry(
        `Adesso proviamo con un nome falso. Caro inconscio, è vero sì o no che il tuo nome è ${fakeName}? Attendo risposta.`,
        fakeName
      );
      if (guard.isCancelled()) return;
      const falsoResponse = falsoRes.response;

      const finalTestNomeData = { ...newTestNomeData, nomeFalso: falsoResponse };
      setUserData(prev => ({
        ...prev, 
        testNome: finalTestNomeData,
        completedTests: { ...prev.completedTests, nome: true }
      }));

      setResult(prev => `${prev} Risposta al nome falso (${fakeName}): ${falsoResponse}.`);

      if (veroResponse === 'SI' && falsoResponse === 'NO') {
        setMessage('Congratulazioni! Il tuo inconscio ha validato perfettamente la tua identità reale (Sì al nome vero, No al nome falso).');
        setStatus('SUCCESS');
        await voiceService.speak("Test del nome completato con successo. Il tuo inconscio riconosce pienamente la tua identità.");
      } else if (veroResponse === 'SI') {
        setMessage('Il tuo inconscio ha confermato il tuo nome reale.');
        setStatus('SUCCESS');
        await voiceService.speak("Test del nome completato. Il tuo nome è stato confermato.");
      } else {
        setMessage('Il tuo inconscio non ha dato risposta affermativa al tuo nome. Potrebbe esserci una resistenza emotiva transitoria.');
        setStatus('DONE');
        await voiceService.speak("Il tuo inconscio non ha confermato il tuo nome reale. Ti consigliamo di ripetere la calibrazione e il test.");
      }
    } catch (e) {
      console.error(e);
      if (status !== 'IDLE') setMessage("Test interrotto.");
    }
  };

  const nomeVeroResponse = userData.testNome?.nomeVero;
  const nomeFalsoResponse = userData.testNome?.nomeFalso;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 pb-24 relative border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1">
            Test Standalone
          </span>
          <h2 className="text-2xl font-serif font-black text-gray-900">Test del Nome</h2>
          <h3 className="text-sm font-medium text-gray-600">Riconoscimento dell'identità reale vs fittizia da parte dell'inconscio</h3>
        </div>
        <button
          onClick={handleExit}
          className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          &larr; Torna alla Home
        </button>
      </div>

      <VideoAccordion videoId="AFtsyqyBdes" title="🎥 Video: Spiegazione Test del Nome" />
      
      <InfoBox>
        <p>
          In questo test autonomo l'inconscio viene interrogato sulla tua identità anagrafica: un'oscillazione in avanti al proprio nome vero e all'indietro a un nome fittizio conferma la piena coerenza analogica del canale inconscio.
        </p>
      </InfoBox>

      <div className="my-6">
        <CameraView 
          ref={cameraRef}
          videoRef={videoRef} 
          onReady={handleCameraReady}
          onCalibrated={handleCalibrated}
          showCalibrationButton={false}
        />
      </div>

      <div className="my-6 flex justify-center">
        {status === 'IDLE' && !isCalibrated && (
          <button
            onClick={startCalibration}
            disabled={!isCameraReady}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 uppercase tracking-widest text-sm"
          >
            Inizia Calibrazione e Test
          </button>
        )}
        {status === 'CALIBRATING' && (
          <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-xl">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-ping"></span>
            <span className="text-emerald-800 font-bold uppercase tracking-widest text-xs">Calibrazione in corso...</span>
          </div>
        )}
        {(status === 'TESTING_VERO' || status === 'TESTING_FALSO') && (
          <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 px-5 py-3 rounded-xl">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-800 font-bold text-sm">
              {status === 'TESTING_VERO' ? 'Verifica nome vero in corso...' : 'Verifica nome falso in corso...'}
            </span>
          </div>
        )}
      </div>

      <div className="text-center p-5 bg-slate-50 border border-slate-200 rounded-xl min-h-[90px] flex flex-col justify-center">
        <p className={`font-semibold text-base ${status === 'SUCCESS' ? 'text-emerald-700' : 'text-slate-800'}`}>
          {message}
        </p>
        {result && <p className="text-xs text-slate-600 mt-2 font-mono">{result}</p>}
      </div>

      {/* Standalone Outcome Card */}
      {(status === 'SUCCESS' || status === 'DONE') && (
        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 text-slate-800 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🆔</span>
            <div>
              <h4 className="font-serif font-black text-xl text-emerald-950">Esito Test del Nome</h4>
              <p className="text-xs text-emerald-800 font-medium">Reattività dell'inconscio alla tua identità anagrafica.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">Nome Reale ({userData.nome || 'Amico'})</span>
              <p className={`text-base font-bold ${nomeVeroResponse === 'SI' ? 'text-emerald-600' : 'text-red-600'}`}>
                {nomeVeroResponse ? (nomeVeroResponse === 'SI' ? '✓ Riconosciuto (Sì)' : '✗ Non Riconosciuto (No)') : '-'}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">Nome Fittizio ({fakeNameUsed || 'Falso'})</span>
              <p className={`text-base font-bold ${nomeFalsoResponse === 'NO' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {nomeFalsoResponse ? (nomeFalsoResponse === 'NO' ? '✓ Rifiutato (No - Corretto)' : 'Ambivalente (Sì)') : '-'}
              </p>
            </div>
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
        showControls={status === 'TESTING_VERO' || status === 'TESTING_FALSO'}
      />
    </div>
  );
};

export default TestNome;
