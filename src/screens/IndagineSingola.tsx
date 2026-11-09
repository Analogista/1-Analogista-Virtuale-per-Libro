import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService, AutomatedResponse } from '../services/AdvancedVoiceService';
import InfoBox from '../components/InfoBox';
import TestControls from '../components/TestControls';

const seasons = {
  Primavera: ['Marzo', 'Aprile', 'Maggio'],
  Estate: ['Giugno', 'Luglio', 'Agosto'],
  Autunno: ['Settembre', 'Ottobre', 'Novembre'],
  Inverno: ['Dicembre', 'Gennaio', 'Febbraio']
} as const;
type SeasonKey = keyof typeof seasons;
const daysInMonth: Record<string, number> = {
  Gennaio: 31, Febbraio: 28, Marzo: 31, Aprile: 30, Maggio: 31, Giugno: 30,
  Luglio: 31, Agosto: 31, Settembre: 30, Ottobre: 31, Novembre: 30, Dicembre: 31
};

interface ScreenProps { setPage: (page: number) => void; }
type Status = 'IDLE' | 'CALIBRATING' | 'TESTING' | 'SUCCESS' | 'ERROR';

const IndagineSingola: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<Status>('IDLE');
  const [message, setMessage] = useState('Premi “Inizia calibrazione” per avviare l’indagine singola.');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [summary, setSummary] = useState<{ age?: number; date?: string; witness?: string; justification?: string }>({});
  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  useEffect(() => () => voiceService.cancel(), [voiceService]);

  const handleCameraReady = () => {
    if (videoRef.current) {
      voiceService.initializeDetector(videoRef.current);
      setIsCameraReady(true);
    }
  };

  const handleExit = () => {
    voiceService.cancel();
    setPage(0);
  };

  const resetTest = () => {
    voiceService.cancel();
    setStatus('IDLE');
    setSummary({});
    setMessage('Premi “Inizia calibrazione” per avviare l’indagine singola.');
  };

  const startCalibration = async () => {
    setStatus('CALIBRATING');
    setMessage('Rimani immobile per la calibrazione...');
    if (cameraRef.current) {
      cameraRef.current.startCalibration();
    }
  };

  const calculateTimeline = (age: number) => {
    const currentAge = parseInt(userData.eta, 10) || 30;
    const PU = currentAge / 2;
    const CDS = currentAge / 4;
    const isFatto = age > PU;
    const etaFatto = isFatto ? age : undefined;
    const PT = isFatto ? age - CDS : age + CDS;
    const etaAntefatto = isFatto ? PT - CDS : age;
    const computedEtaFatto = isFatto ? etaFatto : PT + CDS;
    const CDT = Math.abs(PT - PU);
    const diagnosi = PT < PU ? 'Libertà Vincolata' : PT > PU ? 'Sogno Frustrato' : 'Equilibrio';
    return {
      etaEventoCausa: String(age), PU, CDS, PT,
      etaAntefatto: Math.round(etaAntefatto * 10) / 10,
      etaFatto: Math.round(computedEtaFatto * 10) / 10,
      isFatto, CDT: Math.round(CDT * 10) / 10, diagnosi
    } as const;
  };

  // Strict rule: if detection is not SI or NO, repeat the exact same question until a valid SI/NO is detected
  const askWithStrictRepeat = async (questionText: string): Promise<'SI' | 'NO'> => {
    while (true) {
      setMessage(questionText);
      const response: AutomatedResponse = await voiceService.askQuestion(questionText);
      if (response === 'SI' || response === 'NO') {
        return response;
      }
      setMessage(`Risposta non rilevata. Ripeto la domanda...`);
      await voiceService.speak("Risposta non rilevata. Ripeto la domanda.");
      await new Promise(res => setTimeout(res, 600));
    }
  };

  const runInvestigation = async () => {
    const currentAge = parseInt(userData.eta, 10);
    const nome = userData.nome || 'Amico';
    const problema = userData.problema || 'il tuo problema';

    if (Number.isNaN(currentAge) || currentAge <= 0) {
      setStatus('ERROR');
      setMessage('Inserisci la tua età corretta nei dati anagrafici (Chi Sei).');
      return;
    }

    setStatus('TESTING');
    try {
      // 1 & 2. Cause event question intro
      await voiceService.speak(`Caro inconscio di ${nome}, quando accadde quell’evento che, se non fosse accaduto, oggi non avresti il problema: ${problema}?`);

      // 3. Age binary search
      let lower = 0;
      let upper = currentAge;
      while (upper - lower > 1) {
        const midpoint = Math.floor(lower + (upper - lower) / 2);
        const response = await askWithStrictRepeat(`L'evento è accaduto prima dei ${midpoint} anni? Sì o no, attendo risposta.`);
        if (response === 'SI') {
          upper = midpoint;
        } else {
          lower = midpoint;
        }
      }
      const foundAge = upper;
      const timeline = calculateTimeline(foundAge);
      setSummary(prev => ({ ...prev, age: foundAge }));
      setUserData(prev => ({
        ...prev,
        timeLine: timeline,
        completedTests: { ...prev.completedTests, timeLine: true }
      }));
      await voiceService.speak(`Ok, l'evento è accaduto a ${foundAge} anni. Ora cerchiamo la stagione.`);

      // 4. Season search
      let foundSeason: SeasonKey | null = null;
      const seasonsList = Object.keys(seasons) as SeasonKey[];
      for (const season of seasonsList) {
        const response = await askWithStrictRepeat(`L'evento accadde in ${season}? Sì o no, attendo risposta.`);
        if (response === 'SI') {
          foundSeason = season;
          break;
        }
      }
      if (!foundSeason) foundSeason = 'Primavera';

      // 5. Month search
      let foundMonth: string | null = null;
      for (const month of seasons[foundSeason]) {
        const response = await askWithStrictRepeat(`L'evento accadde nel mese di ${month}? Sì o no, attendo risposta.`);
        if (response === 'SI') {
          foundMonth = month;
          break;
        }
      }
      if (!foundMonth) foundMonth = seasons[foundSeason][0];

      // 6. Day binary search
      let lowerDay = 1;
      let upperDay = daysInMonth[foundMonth];
      while (upperDay > lowerDay) {
        const midpoint = Math.floor(lowerDay + (upperDay - lowerDay) / 2);
        const response = await askWithStrictRepeat(`Accadde prima del giorno ${midpoint + 1} di ${foundMonth}? Sì o no, attendo risposta.`);
        if (response === 'SI') {
          upperDay = midpoint;
        } else {
          lowerDay = midpoint + 1;
        }
      }
      const foundDate = `${lowerDay} ${foundMonth}`;
      setSummary(prev => ({ ...prev, date: foundDate }));
      setUserData(prev => ({
        ...prev,
        giornoEvento: foundDate,
        completedTests: { ...prev.completedTests, qualeGiorno: true }
      }));
      await voiceService.speak(`Avevi ${foundAge} anni, il ${foundDate}. Ora cerchiamo il testimone.`);

      // 7. Witness gender search
      const maleResponse = await askWithStrictRepeat('Era un uomo? Sì o no, attendo risposta.');

      const maleCandidates = ['Tuo padre', 'Tuo nonno', 'Tuo zio', 'Tuo fratello', 'Tuo cugino', 'Un insegnante', 'Un amico'];
      const femaleCandidates = ['Tua madre', 'Tua nonna', 'Tua zia', 'Tua sorella', 'Tua cugina', "Un'insegnante", "Un'amica"];
      const ambiguous = ['Tuo nonno', 'Tuo zio', 'Tuo cugino', 'Tua nonna', 'Tua zia', 'Tua cugina'];
      
      let candidates: string[];
      if (maleResponse === 'SI') {
        candidates = maleCandidates;
      } else {
        const femaleResponse = await askWithStrictRepeat('Era una donna? Sì o no, attendo risposta.');
        candidates = femaleResponse === 'SI' ? femaleCandidates : maleCandidates;
      }

      // 8. Witness specific figure search
      let witness = 'Non identificato';
      for (const candidate of candidates) {
        const response = await askWithStrictRepeat(`Era ${candidate}? Sì o no, attendo risposta.`);
        if (response === 'SI') {
          witness = candidate;
          // 9. Specificazione eventuale (Paterno / Materno)
          if (ambiguous.includes(candidate)) {
            const side = await askWithStrictRepeat('Da parte di papà? Sì o no, attendo risposta.');
            witness += side === 'SI' ? ' (Paterno)' : ' (Materno)';
          }
          break;
        }
      }

      setSummary(prev => ({ ...prev, witness }));

      // 10. Final justification question: "Caro inconscio hai giustificato il torto ricevuto da (testimone) SI o NO, attendo risposta"
      const justificationResponse = await askWithStrictRepeat(`Caro inconscio, hai giustificato il torto ricevuto da ${witness}? Sì o no, attendo risposta.`);
      
      setSummary(prev => ({ ...prev, justification: justificationResponse === 'SI' ? 'Giustificato' : 'Non Giustificato' }));

      // Salvataggio definitivo
      setUserData(prev => ({
        ...prev,
        testimoneChiave: witness,
        giustificatoTorto: justificationResponse,
        completedTests: {
          ...prev.completedTests,
          timeLine: true,
          qualeGiorno: true,
          testimone: true,
          indagineSingola: true
        }
      }));

      setStatus('SUCCESS');
      setMessage(`Indagine completata! Età: ${foundAge}; Data: ${foundDate}; Testimone: ${witness}; Torto: ${justificationResponse === 'SI' ? 'Giustificato' : 'Non Giustificato'}.`);
      await voiceService.speak(`Indagine completata con successo. Testimone identificato: ${witness}. Torto ${justificationResponse === 'SI' ? 'giustificato' : 'non giustificato'}. Puoi procedere.`);
    } catch (error) {
      console.error(error);
      setStatus('ERROR');
      setMessage('Indagine interrotta o errore di rilevazione. Clicca su Ripeti per riprovare.');
    }
  };

  const handleCalibrated = () => {
    setStatus('TESTING');
    runInvestigation();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 pb-24 relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">10) Indietro nel tempo</h2>
          <h3 className="text-lg font-semibold text-gray-600">Età → Data → Testimone → Reazione</h3>
        </div>
        <button onClick={handleExit} className="text-sm text-blue-600 hover:underline">← Torna ai test</button>
      </div>
      <InfoBox>
        <p>In questo test unificato indipendente, individueremo in un unico flusso continuo l’età, la data esatta, il testimone chiave e se giustificasti il torto ricevuto.</p>
      </InfoBox>
      <div className="my-6">
        <CameraView ref={cameraRef} videoRef={videoRef} onReady={handleCameraReady} onCalibrated={handleCalibrated} />
      </div>
      <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[100px] flex flex-col justify-center">
        <p className={`font-semibold text-lg ${status === 'SUCCESS' ? 'text-green-600' : 'text-blue-800'}`}>{message}</p>
        {summary.age && <p className="text-sm mt-2">Età evento: <strong>{summary.age}</strong></p>}
        {summary.date && <p className="text-sm">Data evento: <strong>{summary.date}</strong></p>}
        {summary.witness && <p className="text-sm">Testimone: <strong>{summary.witness}</strong></p>}
        {summary.justification && <p className="text-sm">Torto: <strong>{summary.justification}</strong></p>}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        {(status === 'IDLE' || status === 'ERROR') && (
          <button onClick={startCalibration} disabled={!isCameraReady} className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-400 hover:bg-cyan-700 transition">
            Inizia calibrazione
          </button>
        )}
        {(status === 'CALIBRATING' || status === 'TESTING') && (
          <span className="text-blue-600 font-bold animate-pulse text-lg">Indagine in corso... Segui la voce guida.</span>
        )}
        {status === 'SUCCESS' && (
          <>
            <button onClick={resetTest} className="bg-gray-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition">Ripeti</button>
            <button onClick={handleExit} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition">Fine</button>
          </>
        )}
      </div>
      <TestControls onRepeat={resetTest} onExit={handleExit} showControls={status === 'TESTING'} />
    </div>
  );
};
export default IndagineSingola;
