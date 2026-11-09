
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

const TestimoneChiave: React.FC<ScreenProps> = ({ setPage }) => {
    const { userData, setUserData } = useUser();
    const [status, setStatus] = useState<'IDLE' | 'CALIBRATING' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('Premi "Inizia" per avviare la calibrazione e la ricerca del testimone.');
    const [isCameraReady, setIsCameraReady] = useState(false);
        const [isCalibrated, setIsCalibrated] = useState(false);
    
    const cameraRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const voiceService = useMemo(() => new AdvancedVoiceService(), []);

    const { sigilloFinale, timeLine } = userData;

    useEffect(() => { return () => voiceService.cancel(); }, [voiceService]);

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
        setMessage('Pronto a scoprire il Testimone Chiave?');
    };
    const handleExit = () => {
        voiceService.cancel();
        setPage(0);
    };
    
    const startTest = async () => {
        if (!sigilloFinale || !timeLine.etaEventoCausa) {
            setMessage("Completa prima i test 9 (Sigilli) e 10 (Time Line).");
            setStatus('ERROR');
            return;
        }
        setStatus('TESTING');
                
        const testimoniMaschi = ["Tuo padre", "Tuo nonno", "Tuo zio", "Tuo fratello", "Tuo cugino", "Un insegnante", "Un amico"];
        const testimoniFemmine = ["Tua madre", "Tua nonna", "Tua zia", "Tua sorella", "Tua cugina", "Un'insegnante", "Un'amica"];
        const parentiAmbigui = ["Tuo nonno", "Tuo zio", "Tuo cugino", "Tua nonna", "Tua zia", "Tua cugina"];

        try {
            const introText = `Adesso andremo a ricercare quel soggetto, maschio o femmina, che determinò il sigillo "${sigilloFinale}" quando avevi ${timeLine.etaEventoCausa} anni. Mettiti in posizione, cominciamo.`;
            setMessage("Introduzione in corso...");
            await voiceService.speak(introText);
            await new Promise(res => setTimeout(res, 1000));

            setMessage("L'evento fu causato da un uomo? (Sì/No)");
            let response = await voiceService.askQuestion("Era un uomo? Si o No, attendo risposta.");

            let testimoniDaTestare: string[] = [];
            if (response === 'SI') {
                testimoniDaTestare = testimoniMaschi;
            } else if (response === 'NO') {
                setMessage("L'evento fu causato da una donna? (Sì/No)");
                response = await voiceService.askQuestion("Era una donna? Si o No, attendo risposta.");
                if (response === 'SI') {
                    testimoniDaTestare = testimoniFemmine;
                } else {
                     setMessage("Non è stato possibile determinare il genere del testimone. Test concluso.");
                     setUserData(prev => ({ ...prev, testimoneChiave: "Genere non determinato", completedTests: { ...prev.completedTests, testimone: true } }));
                     setStatus('SUCCESS');
                     return;
                }
            } else {
                setMessage("Risposta non rilevata. Il test si è concluso.");
                setUserData(prev => ({ ...prev, testimoneChiave: "Risposta non rilevata", completedTests: { ...prev.completedTests, testimone: true } }));
                setStatus('SUCCESS');
                return;
            }
            
            for (const testimone of testimoniDaTestare) {
                setMessage(`Era ${testimone}? (Sì/No)`);
                const questionResponse = await voiceService.askQuestion(`Era ${testimone}? Si o No, attendo risposta.`);

                if (questionResponse === 'SI') {
                    let testimoneFinale = testimone;
                    if (parentiAmbigui.includes(testimone)) {
                        setMessage("Specificare: Da parte di papà? (Sì = Paterno, No = Materno)");
                        const specResponse = await voiceService.askQuestion(`Da parte di papà? Si o No?`);
                        if (specResponse === 'SI') testimoneFinale += " (Paterno)";
                        else testimoneFinale += " (Materno)"; 
                    }

                    setMessage(`Testimone Chiave identificato: ${testimoneFinale}.`);
                    await voiceService.speak(`Testimone identificato: ${testimoneFinale}`);

                    setUserData(prev => ({
                        ...prev,
                        testimoneChiave: testimoneFinale,
                        completedTests: { ...prev.completedTests, testimone: true }
                    }));
                    setStatus('SUCCESS');
                    await voiceService.speak("premi il pulsante qui sotto per proseguire con gli altri test oppure riprova questo test");
                    return;
                }
                 await new Promise(res => setTimeout(res, 1000));
            }
            
            setMessage("Nessun testimone identificato dalla lista. Il test è comunque completato.");
            setUserData(prev => ({
                ...prev,
                testimoneChiave: "Non identificato dalla lista fornita",
                completedTests: { ...prev.completedTests, testimone: true }
            }));
            setStatus('SUCCESS');
            await voiceService.speak("premi il pulsante qui sotto per proseguire con gli altri test oppure riprova questo test");
        } catch (error) {
             if(status !== 'IDLE') setMessage("Test interrotto.");
        }
    };
    
    const canStart = sigilloFinale && timeLine.etaEventoCausa;

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 pb-24 relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">11) Il Testimone Chiave</h2>
                <h3 className="text-lg font-semibold text-gray-600">Da chi subisti il torto?</h3>
              </div>
              <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
            </div>
            
            <VideoAccordion videoId="v0S-AkO1WOk" title="🎥 Video: Il Testimone Chiave" />
            
            <InfoBox>
                <p>In questo test, scopriremo chi ha determinato il sigillo <strong>"{sigilloFinale || '(non definito)'}"</strong> all'età di <strong>{timeLine.etaEventoCausa || '(non definita)'}</strong>. Posizionati di fronte alla webcam all'interno della sagoma trasparente e segui le istruzioni.</p>
                {!canStart && <p className="text-red-600 font-bold mt-2">Completa prima i test Sigilli e Time Line!</p>}
            </InfoBox>

            <div className="my-6">
                <CameraView 
                    ref={cameraRef}
                    videoRef={videoRef} 
                    onReady={handleCameraReady} 
                    onCalibrated={handleCalibrated}
                />
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[100px] flex flex-col justify-center">
                <p className={`font-semibold text-lg ${status === 'SUCCESS' ? 'text-green-600' : 'text-blue-800'}`}>{message}</p>
                 {status === 'CALIBRATING' && (
                    <div className="flex items-center space-x-2 mt-2 justify-center">
                         <span className="text-cyan-500 font-bold animate-pulse uppercase tracking-widest">Calibrazione in corso...</span>
                    </div>
                 )}
                 {status === 'TESTING' && (
                    <div className="flex items-center space-x-2 mt-2 justify-center">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-blue-600">Indagine in corso...</span>
                   </div>
                )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                 {status === 'IDLE' && !isCalibrated && (
                    <button
                        onClick={startCalibration}
                        disabled={!isCameraReady || !canStart}
                        className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-700 transition duration-300 disabled:bg-gray-400 uppercase tracking-widest shadow-xl"
                    >
                        Inizia Calibrazione
                    </button>
                 )}
                 {status === 'SUCCESS' && (
                     <>
                        <button 
                            onClick={handleRepeat} 
                            className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-300 uppercase tracking-widest"
                        >
                            Riprova Test
                        </button>
                        <button 
                            onClick={() => setPage(1)} 
                            className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 uppercase tracking-widest"
                        >
                           Prosegui →
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

export default TestimoneChiave;
