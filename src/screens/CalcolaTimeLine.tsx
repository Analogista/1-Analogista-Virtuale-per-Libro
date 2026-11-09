
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import InfoBox from '../components/InfoBox';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import TimeLineGraph from '../components/TimeLineGraph';
import VideoAccordion from '../components/VideoAccordion';
import TestControls from '../components/TestControls';

interface ScreenProps {
  setPage: (page: number) => void;
}

const CalcolaTimeLine: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData, setUserData } = useUser();
  const [isCalculated, setIsCalculated] = useState(!!userData.completedTests?.timeLine);
  
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('Premi "Avvia Ricerca Guidata" per iniziare.');
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  useEffect(() => { return () => voiceService.cancel(); }, [voiceService]);

  const handleCameraReady = () => {
    if (videoRef.current) {
      voiceService.initializeDetector(videoRef.current);
      setIsCameraReady(true);
    }
  };

      const resetTest = () => {
    voiceService.cancel();
    setTestStatus('IDLE');
    setIsCalculated(false);
        setMessage('Premi "Avvia Ricerca Guidata" per iniziare.');
    setUserData(prev => ({...prev, timeLine: { etaEventoCausa: ''}}))
  };
  const handleExit = () => {
      voiceService.cancel();
      setPage(0);
  };

  const startInteractiveSearch = async () => {
    setTestStatus('TESTING');
    setIsCalculated(false);
        
    const etaAttualeNum = parseInt(userData.eta, 10);
    if (isNaN(etaAttualeNum) || etaAttualeNum <= 0) {
        setMessage("Età attuale non valida.");
        setTestStatus('ERROR');
        return;
    }

    if (!userData.puntoDistonicoFinale || !userData.sigilloFinale) {
        setMessage("Dati dai test precedenti mancanti. Completa prima i test 8 e 9.");
        setTestStatus('ERROR');
        return;
    }

    try {
        const introText = `Caro inconscio, è risultato che a causa del sigillo "${userData.sigilloFinale}", ancora oggi vai a bloccare il punto distonico "${userData.puntoDistonicoFinale}". Perciò ti chiedo: quando accadde quell'evento che se non si fosse verificato non sarebbe presente il sigillo "${userData.sigilloFinale}"?`;
        
        setMessage("Iniziamo la ricerca dell'età dell'evento causa.");
        await voiceService.speak(introText);
        
        let lowerBound = 0;
        let upperBound = etaAttualeNum;

        while (upperBound - lowerBound > 1) {
            const midPoint = Math.floor(lowerBound + (upperBound - lowerBound) / 2);
            if (midPoint === lowerBound && upperBound - lowerBound <= 1) break;

            const question = `L'evento è accaduto prima dei ${midPoint} anni? Si o no? Attendo risposta.`;
            setMessage(`Domanda: L'evento è accaduto prima dei ${midPoint} anni?`);
            
            const response = await voiceService.askQuestion(question);

            if (response === 'SI') {
                upperBound = midPoint;
            } else if (response === 'NO') {
                lowerBound = midPoint;
            } else {
                setMessage("Non ho rilevato una risposta. Riprova la ricerca.");
                await voiceService.speak("Risposta non rilevata. Per favore, riprova.");
                setTestStatus('IDLE');
                return;
            }
        }

        const foundAge = upperBound;
        setMessage(`Trovato! L'evento causa è accaduto all'età di ${foundAge} anni. Ora calcolo la Time Line.`);
        await voiceService.speak(`Ok, l'evento è accaduto a ${foundAge} anni.`);
        handleCalculate(foundAge.toString());
        setTestStatus('SUCCESS');

    } catch (error) {
        if(testStatus !== 'IDLE') setMessage("Test interrotto.");
    }
  };


  const handleCalculate = (etaEvento: string) => {
    const etaAttualeNum = parseInt(userData.eta, 10);
    const etaEventoNum = parseInt(etaEvento, 10);

    if (isNaN(etaAttualeNum) || isNaN(etaEventoNum)) return;

    const PU = etaAttualeNum / 2;
    const CDS = etaAttualeNum / 4;
    const isFatto = etaEventoNum > PU;
    let PT, etaAntefatto, etaFatto;

    if (isFatto) {
      etaFatto = etaEventoNum;
      PT = etaFatto - CDS;
      etaAntefatto = PT - CDS;
    } else {
      etaAntefatto = etaEventoNum;
      PT = etaAntefatto + CDS;
      etaFatto = PT + CDS;
    }

    const CDT = Math.abs(PT - PU);
    let diagnosi: 'Libertà Vincolata' | 'Sogno Frustrato' | 'Equilibrio' = 'Equilibrio';
    if (PT < PU) {
        diagnosi = 'Libertà Vincolata';
    } else if (PT > PU) {
        diagnosi = 'Sogno Frustrato';
    }

    setUserData(prev => ({
      ...prev,
      timeLine: {
        etaEventoCausa: etaEvento,
        PU, CDS, PT,
        etaAntefatto: Math.round(etaAntefatto * 10) / 10,
        etaFatto: Math.round(etaFatto * 10) / 10,
        isFatto, CDT: Math.round(CDT * 10) / 10,
        diagnosi
      },
      completedTests: { ...prev.completedTests, timeLine: true }
    }));
    setIsCalculated(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 pb-24 relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">10) Quando accadde?</h2>
          <h3 className="text-lg font-semibold text-gray-600">vai indietro nel tempo</h3>
        </div>
        <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
      </div>

      <VideoAccordion videoId="0ynXFEIhA0g" title="🎥 Video: La Time Line e l'Evento Causa" />

      <InfoBox>
        <p>Con questa indagine andremo a identificare un evento, accaduto in passato, legato al Sigillo/Complesso emerso nel test precedente. Altresì calcolerò la "Time-Line", fondamentale se deciderai di inviarla all'Analogista di riferimento.</p>
        {!userData.sigilloFinale && <p className="text-red-600 font-bold mt-2">Completa prima il Test Sigilli-Vincoli!</p>}
      </InfoBox>
      
      <div className="my-6">
        <CameraView videoRef={videoRef} onReady={handleCameraReady} />
      </div>

      <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col items-center justify-center">
        <p className={`font-semibold text-lg ${testStatus === 'SUCCESS' ? 'text-green-600' : 'text-blue-800'}`}>{message}</p>
        {testStatus === 'TESTING' && (
            <div className="flex items-center space-x-2 mt-2">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="text-blue-600">Ascolto la tua risposta...</span>
            </div>
        )}
      </div>

      {isCalculated && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-bold text-lg text-green-800 mb-2 text-center">Risultati Time Line</h4>
          
          <TimeLineGraph 
             age={parseInt(userData.eta)} 
             PU={userData.timeLine.PU || 0} 
             PT={userData.timeLine.PT} 
             eventAge={parseInt(userData.timeLine.etaEventoCausa || '0')}
             diagnosis={userData.timeLine.diagnosi}
          />
        </div>
      )}

      <div className="mt-8 text-right">
        {testStatus !== 'SUCCESS' ? (
            <button 
              onClick={startInteractiveSearch} 
              disabled={!isCameraReady || testStatus === 'TESTING' || !userData.sigilloFinale}
              className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
            >
              {testStatus === 'IDLE' || testStatus === 'ERROR' ? 'Avvia Ricerca Guidata' : 'Ricerca in corso...'}
            </button>
        ) : (
             <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                    onClick={resetTest}
                    className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                    Rifai Ricerca
                </button>
                <button 
                    onClick={() => setPage(1)} 
                    className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300"
                >
                    Prosegui →
                </button>
            </div>
        )}
      </div>

      <TestControls 
                                onRepeat={resetTest}
        onExit={handleExit}
        showControls={testStatus === 'TESTING'}
      />
    </div>
  );
};

export default CalcolaTimeLine;
