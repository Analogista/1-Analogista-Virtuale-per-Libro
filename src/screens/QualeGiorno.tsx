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
  const [reusePromptDismissed, setReusePromptDismissed] = useState(false);
  const [foundDate, setFoundDate] = useState<string>(userData.giornoEvento || '');
        
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);
  const guardRef = useRef<SessionGuard | null>(null);

  const { testimoneChiave, timeLine } = userData;

  useEffect(() => {
    return () => {
      guardRef.current?.cancel();
      voiceService.cancel();
    };
  }, [voiceService]);

  const handleCameraReady = () => {
    if (videoRef.current) {
      voiceService.initializeDetector(videoRef.current);
      setIsCameraReady(true);
    }
  };

  const handleRepeat = () => {
    guardRef.current?.cancel();
    voiceService.cancel();
    setStatus('IDLE');
    setReusePromptDismissed(true);
    setFoundDate('');
    setMessage('Pronto a trovare il giorno esatto?');
  };

  const handleReuseExisting = () => {
    setFoundDate(userData.giornoEvento);
    setMessage(`Dato riutilizzato: ${userData.giornoEvento}.`);
    setStatus('SUCCESS');
  };

  const handleExit = () => {
    if (window.confirm("Sei sicuro di voler uscire? La voce e il test verranno interrotti.")) {
        guardRef.current?.cancel();
        voiceService.cancel();
        setPage(0);
    }
  };
    
  const startTest = async () => {
    setStatus('TESTING');
    let foundSeason: SeasonKey | null = null;
    let foundMonth: string | null = null;

    guardRef.current?.cancel();
    const guard = new SessionGuard(() => voiceService.cancel());
    guardRef.current = guard;

    try {
      const introText = testimoneChiave && timeLine?.etaEventoCausa
        ? `Adesso individueremo il periodo esatto in cui accadde l'evento con ${testimoneChiave} all'età di ${timeLine.etaEventoCausa} anni.`
        : `Adesso individueremo la stagione, il mese e il giorno esatto in cui accadde l'evento causa nel tuo passato.`;

      setMessage("Iniziamo la ricerca della data...");
      await voiceService.speak(introText);
      if (guard.isCancelled()) return;
      
      // 1. Stagione
      for (const season of Object.keys(seasons) as SeasonKey[]) {
        setMessage(`L'evento accadde in ${season}? (Sì/No)`);
        const res = await voiceService.askQuestionWithSingleRetry(`Era in ${season}? Sì o no, attendo risposta.`);
        if (guard.isCancelled()) return;
        if (res.response === 'NON_RILEVATO') {
          setMessage('Ricerca interrotta: risposta non rilevata.');
          setStatus('IDLE');
          return;
        }
        if (res.response === 'SI') {
          foundSeason = season;
          break;
        }
      }

      // 2. Mese (solo se una stagione ha ricevuto SÌ)
      if (foundSeason) {
        for (const month of seasons[foundSeason]) {
          setMessage(`Era nel mese di ${month}? (Sì/No)`);
          const res = await voiceService.askQuestionWithSingleRetry(`Era nel mese di ${month}? Sì o no, attendo risposta.`);
          if (guard.isCancelled()) return;
          if (res.response === 'NON_RILEVATO') {
            setMessage('Ricerca interrotta: risposta non rilevata.');
            setStatus('IDLE');
            return;
          }
          if (res.response === 'SI') {
            foundMonth = month;
            break;
          }
        }
      }

      // 3. Giorno (Ricerca Binaria, solo se sia stagione sia mese hanno ricevuto SÌ)
      let finalDate: string;
      if (foundSeason && foundMonth) {
        let lowerBound = 1;
        let upperBound = daysInMonth[foundMonth];
        
        while (upperBound > lowerBound) {
          const midPoint = Math.floor(lowerBound + (upperBound - lowerBound) / 2);
          const question = `L'evento accadde prima del giorno ${midPoint + 1} di ${foundMonth}? Sì o no?`;
          setMessage(`Accadde prima del ${midPoint + 1} ${foundMonth}?`);
          const res = await voiceService.askQuestionWithSingleRetry(question);
          if (guard.isCancelled()) return;
          
          if (res.response === 'NON_RILEVATO') {
              setMessage('Ricerca interrotta: risposta non rilevata.');
              setStatus('IDLE');
              return;
          }

          if (res.response === 'SI') {
            upperBound = midPoint;
          } else {
            lowerBound = midPoint + 1;
          }
        }

        finalDate = `${lowerBound} ${foundMonth}`;
        setFoundDate(finalDate);
        setMessage(`Trovato! L'evento è accaduto il ${finalDate}.`);
        await voiceService.speak(`L'evento causa è accaduto il ${finalDate}.`);
      } else {
        finalDate = foundSeason || 'non emersa';
        setFoundDate(finalDate);
        setMessage('Data non emersa: annota ciò che hai e prosegui');
        await voiceService.speak(
          foundSeason
            ? `Stagione individuata: ${foundSeason}. Data non emersa: annota ciò che hai e prosegui.`
            : 'Data non emersa: annota ciò che hai e prosegui.'
        );
      }

      const isFullDateEmerged = Boolean(foundSeason && foundMonth);
      setUserData(prev => ({
        ...prev,
        giornoEvento: finalDate,
        completedTests: {
          ...prev.completedTests,
          qualeGiorno: isFullDateEmerged,
          qualeGiornoFromGrandeIndagine: false,
        },
      }));
      setStatus('SUCCESS');
    } catch {
      if (!guard.isCancelled()) setMessage("Test interrotto.");
    }
  };

  const hasExistingDate = Boolean(
    userData.giornoEvento &&
    userData.giornoEvento !== 'non emersa' &&
    !Object.prototype.hasOwnProperty.call(seasons, userData.giornoEvento)
  );

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
        <button onClick={handleExit} data-keep-voice="true" className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg transition">
          &larr; Torna alla Home
        </button>
      </div>

      <VideoAccordion videoId="c50y8d00yS4" title="🎥 Video: Spiegazione Ricerca della Data" />

      <InfoBox>
        <p>
          Questo test consente di dialogare con l'inconscio per circoscrivere con precisione stagionale e giornaliera l'accaduto dell'evento causa significativo.
        </p>
      </InfoBox>

      {status === 'IDLE' && hasExistingDate && !reusePromptDismissed && (
        <div className="my-5 p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-sm space-y-3">
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-amber-800 border border-amber-200">
              {userData.completedTests?.qualeGiornoFromGrandeIndagine ? 'Dato da Grande Indagine' : 'Dato già presente'}
            </span>
            <h4 className="font-serif font-bold text-lg text-amber-950 mt-1">
              Data già registrata: {userData.giornoEvento}
            </h4>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleReuseExisting}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow transition text-sm"
            >
              ✓ Riutilizza dato esistente
            </button>
            <button
              type="button"
              onClick={() => { setReusePromptDismissed(true); setFoundDate(''); }}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-800 font-bold py-3 px-4 rounded-xl border border-slate-300 transition text-sm"
            >
              🔄 Rifai il test
            </button>
          </div>
        </div>
      )}
      
      <div className="my-6">
        <CameraView videoRef={videoRef} onReady={handleCameraReady} showCalibrationButton={false} />
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
              <p className="text-lg font-bold text-amber-900">
                {foundDate === 'non emersa'
                  ? 'Data non emersa: annota ciò che hai e prosegui'
                  : Object.prototype.hasOwnProperty.call(seasons, foundDate)
                    ? `${foundDate} — Data non emersa: annota ciò che hai e prosegui`
                    : foundDate}
              </p>
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

      {status !== 'SUCCESS' && (!hasExistingDate || reusePromptDismissed) && (
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
