/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import InfoBox from '../components/InfoBox';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService, AutomatedResponse } from '../services/AdvancedVoiceService';
import TimeLineGraph from '../components/TimeLineGraph';
import VideoAccordion from '../components/VideoAccordion';
import TestControls from '../components/TestControls';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

const CalcolaTimeLine: React.FC<ScreenProps> = ({ setPage }) => {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const [isCalculated, setIsCalculated] = useState(!!userData.completedTests?.timeLine);
  
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('Premi "Avvia Ricerca Guidata" per individuare l\'età dell\'evento causa.');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [userAgeInput, setUserAgeInput] = useState<string>(userData.eta || '30');
  
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

  const resetTest = () => {
    voiceService.cancel();
    setTestStatus('IDLE');
    setIsCalculated(false);
    setMessage('Premi "Avvia Ricerca Guidata" per iniziare.');
  };

  const handleExit = () => {
    voiceService.cancel();
    setPage(0);
  };

  const handleCalculate = (etaEvento: string) => {
    const etaAttualeNum = parseInt(userAgeInput || userData.eta || '30', 10);
    const etaEventoNum = parseInt(etaEvento, 10);

    if (isNaN(etaAttualeNum) || isNaN(etaEventoNum)) return;

    const PU = etaAttualeNum / 2;
    const CDS = etaAttualeNum / 4;
    const isFatto = etaEventoNum > PU;
    let PT: number;
    let etaAntefatto: number;
    let etaFatto: number;

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

    const timelineData = {
      etaEventoCausa: etaEvento,
      PU,
      CDS,
      PT,
      etaAntefatto: Math.round(etaAntefatto * 10) / 10,
      etaFatto: Math.round(etaFatto * 10) / 10,
      isFatto,
      CDT: Math.round(CDT * 10) / 10,
      diagnosi
    };

    setUserData(prev => ({
      ...prev,
      eta: String(etaAttualeNum),
      timeLine: timelineData,
      completedTests: { ...prev.completedTests, timeLine: true }
    }));
    setIsCalculated(true);
  };

  const startInteractiveSearch = async () => {
    const etaAttualeNum = parseInt(userAgeInput || userData.eta || '30', 10);
    if (isNaN(etaAttualeNum) || etaAttualeNum <= 0) {
      setMessage("Inserisci un'età valida per procedere.");
      setTestStatus('ERROR');
      return;
    }

    // Aggiorna l'età globale se modificata localmente
    setUserData(prev => ({ ...prev, eta: String(etaAttualeNum) }));

    setTestStatus('TESTING');
    setIsCalculated(false);

    try {
      const nome = userData.nome || 'Amico';
      const sigilloRef = userData.sigilloFinale;
      const puntoRef = userData.puntoDistonicoFinale;

      let introText = '';
      if (sigilloRef && sigilloRef !== 'Nessun sigillo rilevato' && puntoRef) {
        introText = `Caro inconscio di ${nome}, è emerso che a causa del sigillo "${sigilloRef}", vai a bloccare l'area "${puntoRef}". Quando accadde quell'evento passato determinante che ha innescato questo meccanismo?`;
      } else if (sigilloRef && sigilloRef !== 'Nessun sigillo rilevato') {
        introText = `Caro inconscio di ${nome}, quando accadde quell'evento passato determinante legato al sigillo "${sigilloRef}"?`;
      } else {
        introText = `Caro inconscio di ${nome}, andiamo indietro nel tempo. Quando accadde quell'evento causa significativo che ha generato il tuo blocco emotivo o problema dichiarato?`;
      }

      setMessage("Iniziamo la ricerca dell'età dell'evento causa...");
      await voiceService.speak(introText);

      let lowerBound = 0;
      let upperBound = etaAttualeNum;

      while (upperBound - lowerBound > 1) {
        const midPoint = Math.floor(lowerBound + (upperBound - lowerBound) / 2);
        if (midPoint === lowerBound && upperBound - lowerBound <= 1) break;

        const question = `L'evento è accaduto prima dei ${midPoint} anni? Sì o no? Attendo risposta.`;
        setMessage(`Domanda: L'evento è accaduto prima dei ${midPoint} anni?`);

        let response: AutomatedResponse = await voiceService.askQuestion(question);

        // Se non rilevato, ripeti una volta con sollecito
        if (response !== 'SI' && response !== 'NO') {
          setMessage("Risposta non rilevata chiaramente. Ripeto la domanda...");
          await voiceService.speak("Risposta non rilevata chiaramente. Ripeto la domanda.");
          response = await voiceService.askQuestion(question);
        }

        if (response === 'SI') {
          upperBound = midPoint;
        } else if (response === 'NO') {
          lowerBound = midPoint;
        } else {
          // Fallback a metà se l'oscillazione è neutrale
          upperBound = midPoint;
        }
      }

      const foundAge = upperBound;
      setMessage(`Trovato! L'evento causa è accaduto all'età di ${foundAge} anni. Calcolo della Time Line completato.`);
      await voiceService.speak(`Ok, l'evento è accaduto a ${foundAge} anni. Ho calcolato la tua Time Line.`);
      handleCalculate(foundAge.toString());
      setTestStatus('SUCCESS');
    } catch (error) {
      console.error(error);
      if (testStatus !== 'IDLE') setMessage("Test interrotto.");
    }
  };

  const currentTimeline = userData.timeLine;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 pb-24 relative border border-slate-100">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 mb-1">
            Test Standalone
          </span>
          <h2 className="text-2xl font-serif font-black text-gray-900">Test Time Line (Linea del Tempo)</h2>
          <h3 className="text-sm font-medium text-gray-600">Calcolo dell'Evento Causa, PU, PT e Diagnosi Analogica</h3>
        </div>
        <button
          onClick={handleExit}
          className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          &larr; Torna alla Home
        </button>
      </div>

      <VideoAccordion videoId="0ynXFEIhA0g" title="🎥 Video: La Time Line e l'Evento Causa" />

      <InfoBox>
        <p>
          La <strong>Time Line</strong> è il modello analogico di Stefano Benemeglio che individua l'età esatta dell'evento causa nel tuo passato e calcola il <em>Punto di Unione (PU)</em>, il <em>Punto di Rottura/Tensione (PT)</em> e la relativa diagnosi (<em>Libertà Vincolata</em> o <em>Sogno Frustrato</em>). Funziona in totale autonomia.
        </p>
      </InfoBox>

      {/* Input Età se non impostata */}
      <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <label htmlFor="userAgeInput" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            La tua Età Attuale:
          </label>
          <p className="text-xs text-slate-500">Utilizzata per calcolare i quarti e il Punto di Unione (PU = Età/2).</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="userAgeInput"
            type="number"
            min="10"
            max="120"
            value={userAgeInput}
            onChange={(e) => setUserAgeInput(e.target.value)}
            className="w-20 px-3 py-2 border rounded-lg font-bold text-center text-slate-800 bg-white"
          />
          <span className="text-sm font-medium text-slate-600">anni</span>
        </div>
      </div>

      {/* Camera View */}
      <div className="my-6">
        <CameraView videoRef={videoRef} onReady={handleCameraReady} />
      </div>

      {/* Status Bar */}
      <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[80px] flex flex-col items-center justify-center">
        <p className={`font-semibold text-base ${testStatus === 'SUCCESS' ? 'text-emerald-700' : 'text-blue-900'}`}>
          {message}
        </p>
        {testStatus === 'TESTING' && (
          <div className="flex items-center space-x-2 mt-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-600 text-sm font-bold">Rilevamento oscillazione in corso...</span>
          </div>
        )}
      </div>

      {/* Start Button */}
      {testStatus !== 'SUCCESS' && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={startInteractiveSearch}
            disabled={!isCameraReady || testStatus === 'TESTING'}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 uppercase tracking-widest text-sm"
          >
            {testStatus === 'TESTING' ? 'Ricerca in corso...' : 'Avvia Ricerca Guidata'}
          </button>
        </div>
      )}

      {/* Esito Time Line e Grafico Interattivo */}
      {isCalculated && currentTimeline?.etaEventoCausa && (
        <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🧭</span>
            <div>
              <h4 className="font-serif font-black text-xl text-blue-950">Esito Time Line Analogica</h4>
              <p className="text-xs text-blue-800">Evento Causa individuato all'età di <strong>{currentTimeline.etaEventoCausa} anni</strong>.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-center">
            <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">Età Evento Causa</span>
              <p className="text-xl font-bold text-blue-700">{currentTimeline.etaEventoCausa} anni</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">Punto Unione (PU)</span>
              <p className="text-xl font-bold text-indigo-700">{currentTimeline.PU} anni</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">Punto Rottura (PT)</span>
              <p className="text-xl font-bold text-purple-700">{currentTimeline.PT} anni</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500">Diagnosi</span>
              <p className="text-sm font-bold text-emerald-700 mt-1">{currentTimeline.diagnosi || 'Equilibrio'}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm my-4">
            <h5 className="text-xs uppercase font-bold text-slate-700 mb-2 text-center tracking-wider">Grafico della Linea del Tempo</h5>
            <TimeLineGraph
              age={parseInt(userAgeInput || userData.eta || '30', 10)}
              PU={currentTimeline.PU || 0}
              PT={currentTimeline.PT}
              eventAge={parseInt(currentTimeline.etaEventoCausa || '0', 10)}
              diagnosis={currentTimeline.diagnosi}
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetTest}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-300 transition duration-300 shadow-sm text-sm"
            >
              🔄 Riprova Ricerca
            </button>
            <button
              onClick={() => setPage(0)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-300 text-sm"
            >
              🏠 Torna ai Test
            </button>
            <button
              onClick={() => navigate('/risultati')}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-300 text-sm"
            >
              📊 Vedi Risultati Completi
            </button>
          </div>
        </div>
      )}

      <TestControls
        onRepeat={resetTest}
        onExit={handleExit}
        showControls={testStatus === 'TESTING'}
      />
    </div>
  );
};

export default CalcolaTimeLine;
