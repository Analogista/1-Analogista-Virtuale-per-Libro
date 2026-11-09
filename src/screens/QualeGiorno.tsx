
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import InfoBox from '../components/InfoBox';
import VideoAccordion from '../components/VideoAccordion';
import TestControls from '../components/TestControls';

interface ScreenProps {
  setPage: (page: number) => void;
}

const seasons = {
    'Primavera': ['Marzo', 'Aprile', 'Maggio'],
    'Estate': ['Giugno', 'Luglio', 'Agosto'],
    'Autunno': ['Settembre', 'Ottobre', 'Novembre'],
    'Inverno': ['Dicembre', 'Gennaio', 'Febbraio']
};
type SeasonKey = keyof typeof seasons;

const daysInMonth: { [key: string]: number } = {
    'Gennaio': 31, 'Febbraio': 28, 'Marzo': 31, 'Aprile': 30, 'Maggio': 31, 'Giugno': 30,
    'Luglio': 31, 'Agosto': 31, 'Settembre': 30, 'Ottobre': 31, 'Novembre': 30, 'Dicembre': 31
};

const QualeGiorno: React.FC<ScreenProps> = ({ setPage }) => {
    const { userData, setUserData } = useUser();
    const [status, setStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('Pronto a trovare il giorno esatto?');
    const [isCameraReady, setIsCameraReady] = useState(false);
        
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
        setMessage('Pronto a trovare il giorno esatto?');
    };
    const handleExit = () => {
        voiceService.cancel();
        setPage(0);
    };
    
    const startTest = async () => {
        if (!testimoneChiave || !timeLine.etaEventoCausa) {
            setMessage("Completa prima i test 10 (Time Line) e 11 (Testimone Chiave).");
            setStatus('ERROR');
            return;
        }
        setStatus('TESTING');
                let foundSeason: SeasonKey | null = null;
        let foundMonth: string | null = null;

        try {
            const introText = `Adesso individueremo il periodo esatto in cui accadde l'evento con ${testimoneChiave} quando avevi ${timeLine.etaEventoCausa} anni.`;
            setMessage("Iniziamo la ricerca della data...");
            await voiceService.speak(introText);
            
            // 1. Find the Season
            for (const season of Object.keys(seasons) as SeasonKey[]) {
                setMessage(`L'evento accadde in ${season}? (Sì/No)`);
                const response = await voiceService.askQuestion(`Era in ${season}? Si o no, attendo risposta.`);
                if (response === 'SI') {
                    foundSeason = season;
                    break;
                }
            }

            if (!foundSeason) {
                setMessage("Nessuna stagione identificata. Il test si è concluso.");
                setStatus('SUCCESS');
                return;
            }

            // 2. Find the Month
            for (const month of seasons[foundSeason]) {
                setMessage(`Era nel mese di ${month}? (Sì/No)`);
                const response = await voiceService.askQuestion(`Era nel mese di ${month}? Si o no, attendo risposta.`);
                if (response === 'SI') {
                    foundMonth = month;
                    break;
                }
            }

            if (!foundMonth) {
                setMessage("Nessun mese identificato. Il test si è concluso.");
                setStatus('SUCCESS');
                return;
            }

            // 3. Find the Day (Binary Search)
            let lowerBound = 1;
            let upperBound = daysInMonth[foundMonth];
            
            while (upperBound > lowerBound) {
                const midPoint = Math.floor(lowerBound + (upperBound - lowerBound) / 2);
                
                const question = `L'evento accadde prima del giorno ${midPoint + 1} di ${foundMonth}? Si o no?`;
                setMessage(`Accadde prima del ${midPoint + 1} ${foundMonth}?`);
                const response = await voiceService.askQuestion(question);
    
                if (response === 'SI') {
                    upperBound = midPoint;
                } else if (response === 'NO') {
                    lowerBound = midPoint + 1;
                } else {
                    setMessage("Risposta non rilevata. Riprova la ricerca.");
                    await voiceService.speak("Risposta non rilevata. Per favore, riprova.");
                    setStatus('IDLE');
                    return;
                }
            }

            const foundDay = lowerBound;
            const finalResult = `${foundDay} ${foundMonth}`;

            // 4. Justification Question
            setMessage(`Data trovata: ${finalResult}. Ora l'ultima domanda...`);
            await voiceService.speak(`Ok, l'evento è accaduto il ${finalResult}. Adesso un'ultima domanda.`);
            await new Promise(res => setTimeout(res, 1000));

            const justificationQuestion = `Adesso cerchiamo di capire cosa accadde con ${testimoneChiave}. Caro inconscio, nell'evento accaduto a ${timeLine.etaEventoCausa} anni, hai giustificato il torto ricevuto da ${testimoneChiave}? Si o no, attendo risposta.`;
            setMessage("Hai giustificato il torto ricevuto? (Sì/No)");
            const justificationResponse = await voiceService.askQuestion(justificationQuestion);

            const finalMessageText = justificationResponse === 'SI' ? 'Hai GIUSTIFICATO il torto.' : justificationResponse === 'NO' ? 'NON hai giustificato il torto.' : 'Risposta non rilevata.';
            setMessage(`Test completato! ${finalMessageText}`);
            await voiceService.speak(`Ok, test completato. ${finalMessageText}`);
            
            setUserData(prev => ({
                ...prev,
                giornoEvento: finalResult,
                giustificatoTorto: justificationResponse,
                completedTests: { ...prev.completedTests, qualeGiorno: true }
            }));
            setStatus('SUCCESS');

        } catch (error) {
             if(status !== 'IDLE') setMessage("Test interrotto.");
        }
    };
    
    const canStart = testimoneChiave && timeLine.etaEventoCausa;

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 pb-24 relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">12) Quale giorno accadde?</h2>
                <h3 className="text-lg font-semibold text-gray-600">Individua il giorno esatto dell'evento e se giustificasti il torto.</h3>
              </div>
              <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
            </div>
            
            <VideoAccordion videoId="RXCd7MXQmqM" title="🎥 Video: Spiegazione Quale Giorno e Reazione" />

            <InfoBox>
                <p>In questo ultimo test, identificheremo il giorno esatto in cui hai subito il torto da parte di <strong>"{testimoneChiave || '(non definito)'}"</strong> quando avevi <strong>{timeLine.etaEventoCausa || '...'} anni</strong>. Altresì capiremo se Giustificasti o meno il torto ricevuto da quella persona. Segui la voce guida.</p>
                {!canStart && <p className="text-red-600 font-bold mt-2">Completa prima i test Time Line e Testimone Chiave!</p>}
            </InfoBox>

            <div className="my-6"><CameraView videoRef={videoRef} onReady={handleCameraReady} /></div>

            <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[100px] flex flex-col justify-center">
                <p className={`font-semibold text-lg ${status === 'SUCCESS' ? 'text-green-600' : 'text-blue-800'}`}>{message}</p>
                 {status === 'TESTING' && (
                    <div className="flex items-center space-x-2 mt-2">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-blue-600">Ricerca in corso...</span>
                   </div>
                )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                 {status !== 'SUCCESS' ? (
                    <button 
                        onClick={startTest} 
                        disabled={!isCameraReady || !canStart || status === 'TESTING'}
                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {status === 'IDLE' || status === 'ERROR' ? 'Inizia Test' : 'Test in corso...'}
                    </button>
                 ) : (
                     <>
                        <button 
                            onClick={handleRepeat} 
                            className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
                        >
                            Riprova Test
                        </button>
                        <button 
                            onClick={() => setPage(0)} 
                            className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300"
                        >
                           ✓ Fatto, torna alla Home
                        </button>
                     </>
                 )}
            </div>
            
            <TestControls 
                                                                onRepeat={handleRepeat}
                onExit={handleExit}
                showControls={status === 'TESTING'}
            />
        </div>
    );
};

export default QualeGiorno;
