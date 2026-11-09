
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import InfoBox from '../components/InfoBox';
import VideoAccordion from '../components/VideoAccordion';
import TestControls from '../components/TestControls';

interface ScreenProps {
  setPage: (page: number) => void;
  onNext?: () => void;
  isWizard?: boolean;
}

const TestNome: React.FC<ScreenProps> = ({ setPage, onNext, isWizard }) => {
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<'IDLE' | 'CALIBRATING' | 'TESTING_VERO' | 'TESTING_FALSO' | 'DONE' | 'SUCCESS'>('IDLE');
  const [message, setMessage] = useState('Premi "Inizia" per avviare la calibrazione e il test del nome.');
  const [result, setResult] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
    const [isCalibrated, setIsCalibrated] = useState(false);
  
  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  useEffect(() => {
    return () => {
        voiceService.cancel();
    }
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
    await voiceService.speak("stessa posizione come in precedenza, dopo il conto alla rovescia inizieremo il test");
    if (cameraRef.current) {
      cameraRef.current.startCalibration();
    }
  };

      const handleRepeat = () => {
      voiceService.cancel();
            setStatus('IDLE');
      setIsCalibrated(false);
      setMessage('Premi "Inizia" per ricominciare.');
      setResult('');
  };
  const handleExit = () => {
      voiceService.cancel();
      setPage(0);
  };

  const generateFakeName = () => {
      const maleNames = ["Marco", "Luca", "Andrea", "Matteo", "Paolo", "Giuseppe", "Francesco", "Roberto", "Luigi", "Antonio", "Alessandro", "Davide", "Stefano", "Giovanni", "Federico"];
      const femaleNames = ["Maria", "Giulia", "Anna", "Sofia", "Chiara", "Francesca", "Laura", "Sara", "Elena", "Valentina", "Alice", "Giorgia", "Martina", "Silvia", "Beatrice"];

      const isFemale = userData.genere === 'FEMMINA';
      const namePool = isFemale ? femaleNames : maleNames;

      // Filtra i nomi che sono già contenuti o uguali al nome dell'utente
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
    
    try {
      setMessage('Test del tuo nome vero in corso...');
      const veroResponse = await voiceService.askQuestion(
        `Bene, sei in posizione? Fai un bel respiro. Caro inconscio è vero, si o no, che il tuo nome è ${userData.nome}? Se ti chiami ${userData.nome} spingerai il corpo in avanti altrimenti indietro. Attendo risposta.`,
        userData.nome
      );

      const newTestNomeData = { ...userData.testNome, nomeVero: veroResponse };
      setUserData(prev => ({...prev, testNome: newTestNomeData}));
      setResult(`Risposta al nome vero: ${veroResponse}.`);
      
      await new Promise(res => setTimeout(res, 2000));

      setStatus('TESTING_FALSO');
      setMessage('Ora proviamo con un nome falso...');
      
      const fakeName = generateFakeName();
      
      const falsoResponse = await voiceService.askQuestion(
        `Adesso proviamo con un nome falso. Caro inconscio, è vero si o no che il tuo nome è ${fakeName}? Attendo risposta.`,
        fakeName
      );

      const finalTestNomeData = { ...newTestNomeData, nomeFalso: falsoResponse };
      setUserData(prev => ({
        ...prev, 
        testNome: finalTestNomeData,
        completedTests: { ...prev.completedTests, nome: true }
      }));

      setResult(prev => `${prev} Risposta al nome falso (${fakeName}): ${falsoResponse}.`);
      

      if (veroResponse === 'SI') {
        setMessage('Test completato con successo! Proseguiamo.');
        setStatus('SUCCESS');
      } else {
        setMessage('Il tuo inconscio non ha confermato il tuo nome. Ti consigliamo di ripetere il test, ma puoi proseguire se vuoi.');
        setStatus('DONE');
      }
      await voiceService.speak("premi il pulsante qui sotto per proseguire con gli altri test oppure riprova questo test");
    } catch (error) {
        if (status !== 'IDLE') setMessage("Test interrotto.");
    }
  };

  const handleProsegui = () => {
      voiceService.cancel();
      if (onNext) {
          onNext();
      } else {
          setPage(1);
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 pb-24 relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{isWizard ? 'Step 4: Test Nome' : '7) Test Nome'}</h2>
          <h3 className="text-lg font-semibold text-gray-600">Il tuo inconscio ti riconosce?</h3>
        </div>
        {!isWizard && <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>}
      </div>

      <VideoAccordion videoId="AFtsyqyBdes" title="🎥 Video: Spiegazione Test del Nome" />
      
      <InfoBox>
        <p>Posizionati di fronte alla webcam all'interno della sagoma trasparente. La voce guida ti chiederà di confermare il tuo nome e un nome falso. L'app rileverà la risposta del tuo inconscio.</p>
      </InfoBox>

      <div className="my-6">
        <CameraView 
            ref={cameraRef}
            videoRef={videoRef} 
            onReady={handleCameraReady} 
            onCalibrated={handleCalibrated}
        />
      </div>

      <div className="my-6 flex justify-center">
        {status === 'IDLE' && !isCalibrated && (
          <button
            onClick={startCalibration}
            disabled={!isCameraReady}
            className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-700 transition duration-300 disabled:bg-gray-400 uppercase tracking-widest"
          >
            Inizia Calibrazione
          </button>
        )}
        {status === 'CALIBRATING' && (
             <div className="flex items-center space-x-2">
                 <span className="text-cyan-500 font-bold animate-pulse uppercase tracking-widest">Calibrazione in corso...</span>
             </div>
        )}
        {(status === 'TESTING_VERO' || status === 'TESTING_FALSO') && (
           <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-600">Test in corso...</span>
           </div>
        )}
      </div>

       <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[100px] flex flex-col justify-center">
        <p className={`font-semibold text-lg ${status === 'SUCCESS' ? 'text-green-600' : (status === 'DONE' ? 'text-orange-600' : 'text-blue-800')}`}>{message}</p>
        {result && <p className="text-gray-600 mt-2 text-sm">{result}</p>}
      </div>

      {(status === 'SUCCESS' || status === 'DONE') && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button 
                onClick={handleRepeat} 
                className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
            >
                Riprova Test
            </button>
            <button 
                onClick={handleProsegui} 
                className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
            >
                Prosegui →
            </button>
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
