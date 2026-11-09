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

const seasons = {
  Primavera: ['Marzo', 'Aprile', 'Maggio'],
  Estate: ['Giugno', 'Luglio', 'Agosto'],
  Autunno: ['Settembre', 'Ottobre', 'Novembre'],
  Inverno: ['Dicembre', 'Gennaio', 'Febbraio']
};
type SeasonKey = keyof typeof seasons;

const daysInMonth: { [key: string]: number } = {
  Gennaio: 31, Febbraio: 28, Marzo: 31, Aprile: 30, Maggio: 31, Giugno: 30,
  Luglio: 31, Agosto: 31, Settembre: 30, Ottobre: 31, Novembre: 30, Dicembre: 31
};

const QualeGiorno: React.FC<ScreenProps> = ({ setPage }) => {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('Pronto a trovare la data e il giorno esatto dell\'evento?');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [foundDate, setFoundDate] = useState<string>(userData.giornoEvento || '');
        
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  const { testimoneChiave, timeLine } = userData;

  useEffect(() => { return () => voiceService.cancel(); }, [voiceService]);

  const handleCameraReady = () => {
    if (videoRef.current) {
      voiceService.initializeDetector(videoRef.current);
      setIsCameraReady(true);
    }
  };

  const handleRepeat = () => {
    voiceService.cancel();
    setStatus('IDLE');
    setFoundDate('');
    setMessage('Pronto a trovare il giorno esatto?');
  };

  const handleExit = () => {
    voiceService.cancel();
    setPage(0);
  };
    
  const startTest = async () => {
    setStatus('TESTING');
    let foundSeason: SeasonKey | null = null;
    let foundMonth: string | null = null;

    try {
      const introText = testimoneChiave && timeLine?.etaEventoCausa
        ? `Adesso individueremo il periodo esatto in cui accadde l'evento con ${testimoneChiave} all'età di ${timeLine.etaEventoCausa} anni.`
        : `Adesso individueremo la stagione, il mese e il giorno esatto in cui accadde l'evento causa nel tuo passato.`;

      setMessage("Iniziamo la ricerca della data...");
      await voiceService.speak(introText);
      
      // 1. Stagione
      for (const season of Object.keys(seasons) as SeasonKey[]) {
        setMessage(`L'evento accadde in ${season}? (Sì/No)`);
        const response = await voiceService.askQuestion(`Era in ${season}? Sì o no, attendo risposta.`);
        if (response === 'SI') {
          foundSeason = season;
          break;
        }
      }

      if (!foundSeason) foundSeason = 'Primavera';

      // 2. Mese
      for (const month of seasons[foundSeason]) {
        setMessage(`Era nel mese di ${month}? (Sì/No)`);
        const response = await voiceService.askQuestion(`Era nel mese di ${month}? Sì o no, attendo risposta.`);
        if (response === 'SI') {
          foundMonth = month;
          break;
        }
      }

      if (!foundMonth) foundMonth = seasons[foundSeason][0];

      // 3. Giorno (Ricerca Binaria)
      let lowerBound = 1;
      let upperBound = daysInMonth[foundMonth];
      
      while (upperBound > lowerBound) {
        const midPoint = Math.floor(lowerBound + (upperBound - lowerBound) / 2);
        const question = `L'evento accadde prima del giorno ${midPoint + 1} di ${foundMonth}? Sì o no?`;
        setMessage(`Accadde prima del ${midPoint + 1} ${foundMonth}?`);
        const response = await voiceService.askQuestion(question);

        if (response === 'SI') {
          upperBound = midPoint;
        } else {
          lowerBound = midPoint + 1;
        }
      }

      const finalDate = `${lowerBound} ${foundMonth}`;
      setFoundDate(finalDate);
      setMessage(`Trovato! L'evento è accaduto il ${finalDate}.`);
      await voiceService.speak(`L'evento causa è accaduto il ${finalDate}.`);

      setUserData(prev => ({
        ...prev,
        giornoEvento: finalDate,
        completedTests: { ...prev.completedTests, qualeGiorno: true }
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
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-1">
            Test Standalone
          </span>
          <h2 className="text-2xl font-serif font-black text-gray-900">Test Quale Giorno</h2>
          <h3 className="text-sm font-medium text-gray-600">Individuazione della data esatta (Stagione, Mese, Giorno)</h3>
        </div>
        <button onClick={handleExit} className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg transition">
          &larr; Torna alla Home
        </button>
      </div>

      <VideoAccordion videoId="c50y8d00yS4" title="🎥 Video: Spiegazione Ricerca della Data" />

      <InfoBox>
        <p>
          Questo test consente di dialogare con l'inconscio per circoscrivere con precisione stagionale e giornaliera l'accaduto dell'evento causa significativo.
        </p>
      </InfoBox>
      
      <div className="my-6">
        <CameraView videoRef={videoRef} onReady={handleCameraReady} />
      </div>

      <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl min-h-[80px] flex flex-col items-center justify-center">
        <p className={`font-semibold text-base ${status === 'SUCCESS' ? 'text-emerald-700' : 'text-blue-900'}`}>{message}</p>
        {status === 'TESTING' && (
          <div className="flex items-center space-x-2 mt-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="text-blue-600 text-sm font-bold">Rilevamento oscillazione in corso...</span>
          </div>
        )}
      </div>

      {status === 'SUCCESS' && foundDate && (
        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 text-slate-800 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📅</span>
            <div>
              <h4 className="font-serif font-black text-xl text-amber-950">Data Individuata</h4>
              <p className="text-lg font-bold text-amber-900">{foundDate}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleRepeat} className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-300 transition duration-300 shadow-sm text-sm">
              🔄 Riprova
            </button>
            <button onClick={() => setPage(0)} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-300 text-sm">
              🏠 Torna ai Test
            </button>
            <button onClick={() => navigate('/risultati')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition duration-300 text-sm">
              📊 Vedi Risultati
            </button>
          </div>
        </div>
      )}

      {status !== 'SUCCESS' && (
        <div className="mt-8 text-center">
          <button 
            onClick={startTest} 
            disabled={!isCameraReady || status === 'TESTING'}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 uppercase tracking-widest text-sm"
          >
            {status === 'TESTING' ? 'Ricerca in corso...' : 'Avvia Ricerca Data'}
          </button>
        </div>
      )}

      <TestControls onRepeat={handleRepeat} onExit={handleExit} showControls={status === 'TESTING'} />
    </div>
  );
};

export default QualeGiorno;
