
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

const sigilliMapping = {
  colpa: "Sensi di colpa",
  abbandono: "Paura dell'abbandono",
  disistima: "Mancanza di autostima",
  giudizio: "Timore del giudizio degli altri"
};
type SigilloKey = keyof typeof sigilliMapping;

const TestSigilliVincoli: React.FC<ScreenProps> = ({ setPage, onNext, isWizard }) => {
    const { userData, setUserData } = useUser();
    const [status, setStatus] = useState<'IDLE' | 'CALIBRATING' | 'TESTING' | 'SELECTING' | 'DONE' | 'SUCCESS'>('IDLE');
    const [message, setMessage] = useState('Premi "Inizia" per avviare la calibrazione e il test dei sigilli.');
    const [results, setResults] = useState<Partial<Record<SigilloKey, string>>>({});
    const [isCameraReady, setIsCameraReady] = useState(false);
        const [isCalibrated, setIsCalibrated] = useState(false);
    
    const cameraRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const voiceService = useMemo(() => new AdvancedVoiceService(), []);

    const { puntoDistonicoFinale } = userData;

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
        await voiceService.speak("stessa posizione come in precedenza, dopo il conto alla rovescia inizieremo il test");
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
            completedTests: { ...prev.completedTests, sigilli: true }
        }));
        setMessage(finalMessage);
        setStatus('SUCCESS');
        await voiceService.speak(isWizard
            ? "premi il pulsante qui sotto per proseguire con gli altri test oppure riprova questo test"
            : "Il test singolo è completato. Puoi tornare alla schermata dei test o ripetere il test.");
    };
    
    const startTest = async () => {
        if (isWizard && !puntoDistonicoFinale) {
            setMessage("Punto distonico finale non identificato. Torna al test precedente.");
            return;
        }
        
        setStatus('TESTING');
        setResults({});
                const currentSigilli = { ...userData.sigilli };

        try {
            if (isWizard) {
                await voiceService.speak(`Caro inconscio di ${userData.nome}, nel test dei punti distonici presenti nella tua vita, è risultato ${puntoDistonicoFinale}. Adesso scopriamo quali sigilli, complessi, o blocchi, sono presenti in te e causano quel disagio.`);
            } else {
                await voiceService.speak(`Caro inconscio di ${userData.nome}, ora verifichiamo quali sigilli o complessi sono presenti in te.`);
            }
            
            const sigilliQuestionMapping = {
              colpa: `Caro inconscio, sono i sensi di colpa? Si o No, attendo risposta.`,
              abbandono: `È la paura dell'abbandono? Si o no, attendo risposta.`,
              giudizio: `È il timore del giudizio degli altri? Si o no, attendo risposta.`,
              disistima: `È la mancanza di autostima? Si o no, attendo risposta.`
            };

            for (const sigillo of Object.keys(sigilliMapping) as SigilloKey[]) {
                setMessage(`Test in corso: ${sigilliMapping[sigillo]}`);
                const text = sigilliQuestionMapping[sigillo];
                const response = await voiceService.askQuestion(text);
                
                setResults(prev => ({ ...prev, [sigillo]: response }));
                currentSigilli[sigillo] = response;
                await new Promise(res => setTimeout(res, 1500));
            }

            setUserData(prev => ({ ...prev, sigilli: currentSigilli }));

            const sigilliPresenti = (Object.keys(currentSigilli) as SigilloKey[]).filter(k => currentSigilli[k] === 'SI');

            if (!isWizard) {
                const presenti = sigilliPresenti.map(k => sigilliMapping[k]);
                completeTest(presenti.length > 0
                    ? `Test singolo completato. Sigilli presenti: ${presenti.join(', ')}.`
                    : 'Test singolo completato. Nessun sigillo rilevato.');
                return;
            }

            if (sigilliPresenti.length === 0) {
                setUserData(prev => ({ ...prev, sigilloFinale: "Nessun sigillo rilevato" }));
                completeTest('Test completato. Nessun sigillo rilevato!');
            } else if (sigilliPresenti.length === 1) {
                const finalSigillo = sigilliMapping[sigilliPresenti[0]];
                setUserData(prev => ({ ...prev, sigilloFinale: finalSigillo }));
                completeTest(`Test completato. Sigillo identificato: ${finalSigillo}.`);
            } else {
                setStatus('SELECTING');
                setMessage('Sono emersi più sigilli. Ora determineremo il principale.');
                await voiceService.speak(`Caro inconscio, adesso individuiamo quale dei sigilli presenti desideri sbloccare, risolvere.`);
                
                for (const sigillo of sigilliPresenti) {
                    const sigilloName = sigilliMapping[sigillo];
                    setMessage(`Vuoi risolvere: ${sigilloName}?`);
                    const finalResponse = await voiceService.askQuestion(`Vuoi risolvere ${sigilloName}? Si o no, attendo risposta.`);
                    if (finalResponse === 'SI') {
                        setUserData(prev => ({ ...prev, sigilloFinale: sigilloName }));
                        completeTest(`Sigillo principale selezionato: ${sigilloName}.`);
                        return;
                    }
                }
                
                const fallbackSigillo = sigilliMapping[sigilliPresenti[0]];
                setUserData(prev => ({ ...prev, sigilloFinale: fallbackSigillo }));
                completeTest(`Nessun sigillo prioritario indicato. Selezioniamo il primo per default: ${fallbackSigillo}.`);
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
                <h2 className="text-2xl font-bold text-gray-800">{isWizard ? 'Step 6: Sigilli e Vincoli' : '9) Test Sigilli-Vincoli'}</h2>
                <h3 className="text-lg font-semibold text-gray-600">Scopri i blocchi emotivi presenti.</h3>
              </div>
              {!isWizard && <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>}
            </div>
            
            <VideoAccordion videoId="jTXIaDt9G_M" title="🎥 Video: Cosa sono i Sigilli e i Vincoli?" />

            <InfoBox>
                <p>Posizionati di fronte alla webcam all'interno della sagoma trasparente. Identificheremo i sigilli e i complessi presenti.</p>
                {isWizard && !puntoDistonicoFinale && <p className="text-red-600 font-bold mt-2">Completa prima il Test Punti Distonici!</p>}
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
                        disabled={!isCameraReady || (isWizard && !puntoDistonicoFinale)}
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
                        <p key={key} className="capitalize">{sigilliMapping[key as SigilloKey]}: <span className={`font-bold ${value === 'SI' ? 'text-green-600' : 'text-red-600'}`}>{value}</span></p>
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

export default TestSigilliVincoli;
