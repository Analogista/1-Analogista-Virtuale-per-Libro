
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

const puntiMapping = {
  famiglia: "rapporti con la famiglia d'origine",
  sentimentali: "rapporti sentimentali e affettivi",
  sessuali: "rapporti sessuali e passionali",
  autorealizzazione: "autorealizzazione, hobby e lavoro"
};
type PuntoKey = keyof typeof puntiMapping;

const TestPuntiDistonici: React.FC<ScreenProps> = ({ setPage, onNext, isWizard }) => {
    const { userData, setUserData } = useUser();
    const [status, setStatus] = useState<'IDLE' | 'CALIBRATING' | 'TESTING' | 'SELECTING' | 'DONE' | 'SUCCESS'>('IDLE');
    const [message, setMessage] = useState('Premi "Inizia" per avviare la calibrazione e il test dei punti distonici.');
    const [results, setResults] = useState<Partial<Record<PuntoKey, string>>>({});
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
        await voiceService.speak("stessa posizione come in precedenza, dopo il countdown inizieremo il test");
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
        setMessage('Premi "Inizia" per ricominciare.');
        setResults({});
    };
    const handleExit = () => {
        voiceService.cancel();
        setPage(0);
    };

    const completeTest = async (finalMessage: string) => {
        setUserData(prev => ({
            ...prev,
            completedTests: { ...prev.completedTests, puntiDistonici: true }
        }));
        setMessage(finalMessage);
        setStatus('SUCCESS');
        await voiceService.speak(isWizard
            ? "premi il pulsante qui sotto per proseguire con gli altri test oppure riprova questo test"
            : "Il test singolo è completato. Puoi tornare alla schermata dei test o ripetere il test.");
    };

    const startTest = async () => {
        setStatus('TESTING');
        setResults({});
                const currentPuntiDistonici = { ...userData.puntiDistonici };

        try {
            for (const punto of Object.keys(puntiMapping) as PuntoKey[]) {
                setMessage(`Test in corso: ${puntiMapping[punto]}`);
                const text = `Caro inconscio, sei soddisfatto di come ${userData.nome} sta gestendo i ${puntiMapping[punto]}? Si o No? Attendo risposta.`;
                const response = await voiceService.askQuestion(text);
                
                setResults(prev => ({ ...prev, [punto]: response }));
                currentPuntiDistonici[punto] = response;
                await new Promise(res => setTimeout(res, 1500));
            }
            
            setUserData(prev => ({...prev, puntiDistonici: currentPuntiDistonici}));

            const nonSoddisfatti = (Object.keys(currentPuntiDistonici) as PuntoKey[]).filter(k => currentPuntiDistonici[k] === 'NO');

            if (!isWizard) {
                const presenti = nonSoddisfatti.map(k => puntiMapping[k]);
                completeTest(presenti.length > 0
                    ? `Test singolo completato. Punti distonici rilevati: ${presenti.join(', ')}.`
                    : 'Test singolo completato. Nessun punto distonico rilevato.');
                return;
            }

            if (nonSoddisfatti.length === 0) {
                completeTest('Test completato. Nessun punto distonico rilevato!');
            } else if (nonSoddisfatti.length === 1) {
                setUserData(prev => ({ ...prev, puntoDistonicoFinale: puntiMapping[nonSoddisfatti[0]] }));
                completeTest('Test completato. Punto distonico identificato.');
            } else {
                setStatus('SELECTING');
                setMessage('Sono emersi più punti distonici. Ora determineremo il principale.');
                await voiceService.speak(`Sono emersi più punti distonici. Ora ti chiederò quale vuoi risolvere subito.`);
                
                for (const punto of nonSoddisfatti) {
                    setMessage(`Vuoi risolvere subito: ${puntiMapping[punto]}?`);
                    const finalResponse = await voiceService.askQuestion(`Vuoi risolvere ${puntiMapping[punto]}? Si o no, attendo risposta.`);
                    if (finalResponse === 'SI') {
                        setUserData(prev => ({ ...prev, puntoDistonicoFinale: puntiMapping[punto] }));
                        completeTest(`Punto principale selezionato: ${puntiMapping[punto]}.`);
                        return;
                    }
                }
                setUserData(prev => ({ ...prev, puntoDistonicoFinale: puntiMapping[nonSoddisfatti[0]] }));
                completeTest('Nessun punto prioritario selezionato. Scegliamo il primo per default.');
            }
        } catch (error) {
            if(status !== 'IDLE') setMessage("Test interrotto.");
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
                <h2 className="text-2xl font-bold text-gray-800">{isWizard ? 'Step 5: Punti Distonici' : '8) Test Punti Distonici'}</h2>
                <h3 className="text-lg font-semibold text-gray-600">Identifica le aree di disagio.</h3>
              </div>
              {!isWizard && <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>}
            </div>

            <VideoAccordion videoId="JKC5t2boVK4" title="🎥 Video: Cosa sono i Punti Distonici?" />

            <InfoBox><p>Posizionati di fronte alla webcam all'interno della sagoma trasparente. Questo test indaga le 4 aree della tua vita per identificare quella su cui lavorare.</p></InfoBox>
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
                {(status === 'TESTING' || status === 'SELECTING') ? (
                    <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-blue-600">{status === 'TESTING' ? 'Test in corso...' : 'Selezione in corso...'}</span>
                   </div>
                ) : null}
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[100px] flex flex-col justify-center">
                <p className={`font-semibold text-lg ${status === 'SUCCESS' ? 'text-green-600' : 'text-blue-800'}`}>{message}</p>
                 <div className="text-sm grid grid-cols-2 gap-x-4 mt-2">
                    {Object.entries(results).map(([key, value]) => (
                        <p key={key} className="capitalize">{puntiMapping[key as PuntoKey]}: <span className={`font-bold ${value === 'SI' ? 'text-green-600' : 'text-red-600'}`}>{value || '-'}</span></p>
                    ))}
                </div>
            </div>

            {status === 'SUCCESS' && (
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
                showControls={status === 'TESTING' || status === 'SELECTING'}
            />
        </div>
    );
};

export default TestPuntiDistonici;
