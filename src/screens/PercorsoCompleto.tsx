
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import CameraView from '../components/CameraView';
import InfoBox from '../components/InfoBox';
import TestControls from '../components/TestControls';

// Import existing test screens for reuse
import CalibrazioneScreen from './CalibrazioneScreen';
import TestInduttore from './TestInduttore';
import TestNome from './TestNome';
import TestPuntiDistonici from './TestPuntiDistonici';
import TestSigilliVincoli from './TestSigilliVincoli';

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

// FULL SCREEN WRAPPER (Defined Outside to prevent re-mounts)
const FullScreenWrapper: React.FC<{children: React.ReactNode, onExit: () => void}> = ({children, onExit}) => (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto flex flex-col">
        <div className="bg-indigo-600 p-4 text-white shadow-md flex justify-between items-center shrink-0">
            <h1 className="font-bold text-lg font-serif">Percorso Guidato</h1>
            <button onClick={onExit} className="text-xs bg-indigo-800 px-3 py-1 rounded hover:bg-indigo-700">
                Esci e Salva
            </button>
        </div>
        <div className="flex-grow p-4 sm:p-6 max-w-4xl mx-auto w-full">
            {children}
        </div>
    </div>
);

const PercorsoCompleto: React.FC<ScreenProps> = ({ setPage }) => {
    const { userData, setUserData } = useUser();
    const [step, setStep] = useState(1);
    const [hasResumed, setHasResumed] = useState(false);
    
    // Check Data on Mount
    useEffect(() => {
        if (!userData.nome || !userData.eta) {
            alert("Per favore, compila prima 'I tuoi dati' nella Home.");
            setPage(0);
        }
    }, [userData.nome, userData.eta, setPage]);

    // Resume Logic
    useEffect(() => {
        const savedStep = localStorage.getItem('wizardStep');
        if (savedStep && !hasResumed) {
            const stepNum = parseInt(savedStep, 10);
            if (stepNum > 1 && stepNum <= 6) {
                const timer = setTimeout(() => {
                    if (window.confirm(`Hai un percorso in sospeso allo Step ${stepNum}. Vuoi riprendere da dove eri rimasto?`)) {
                        setStep(stepNum);
                    } else {
                        localStorage.removeItem('wizardStep');
                    }
                    setHasResumed(true);
                }, 0);
                return () => clearTimeout(timer);
            }
            setTimeout(() => setHasResumed(true), 0);
        }
    }, [hasResumed, setStep]);

    // Save Progress Logic
    useEffect(() => {
        if (step > 1) {
            localStorage.setItem('wizardStep', step.toString());
        }
    }, [step]);

    const [investigationStatus, setInvestigationStatus] = useState<'INTRO' | 'SEARCHING_AGE' | 'CONFIRMING_AGE' | 'SEARCHING_DATE' | 'SEARCHING_WITNESS' | 'JUSTIFICATION' | 'DONE'>('INTRO');
    const [message, setMessage] = useState('Premi Avvia per iniziare la Grande Indagine.');
    const [isCameraReady, setIsCameraReady] = useState(false);
        
    const videoRef = useRef<HTMLVideoElement>(null);
    const voiceService = useMemo(() => new AdvancedVoiceService(), []);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => voiceService.cancel();
    }, [voiceService]);

    // MEMOIZED CALLBACK to prevent re-renders of child components
    const nextStep = useCallback(() => setStep(prev => prev + 1), []);

    const handleCameraReady = () => {
        if (videoRef.current) {
            voiceService.initializeDetector(videoRef.current);
            setIsCameraReady(true);
        }
    };

    const handleExit = () => {
        voiceService.cancel();
        localStorage.removeItem('wizardStep'); 
        setPage(0);
    };

      
      
    const handleRepeatGrandInvestigation = () => {
        voiceService.cancel();
                setInvestigationStatus('INTRO');
        setMessage('Premi Avvia per iniziare la Grande Indagine.');
    };

    // --- LOGICA GRANDE INDAGINE (ORA STEP 6) ---
    const startGrandInvestigation = async () => {
        setInvestigationStatus('SEARCHING_AGE');
                const etaAttualeNum = parseInt(userData.eta, 10);
        let confirmedAge = false;
        let foundAge = 0;
        
        try {
            // 1. INTRO & AGE SEARCH LOOP (Safety Net)
            while (!confirmedAge) {
                const introText = `Adesso ${userData.nome} andremo indietro nel tempo. Individueremo l'età che avevi, il giorno in cui accadde, da chi subisti il torto e come reagisti: giustificando o non giustificando il torto subito. Fai un bel respiro e segui la mia voce. Caro inconscio di ${userData.nome} quando accade quell'evento che se non si fosse verificato, oggi, non avresti il blocco ${userData.sigilloFinale} che non ti permette di sbloccare il punto distonico ${userData.puntoDistonicoFinale}?`;
                
                setMessage("Ricerca dell'età dell'evento...");
                // Only speak intro first time or short version on retry
                if (foundAge === 0) await voiceService.speak(introText);
                else await voiceService.speak("Ripetiamo la ricerca dell'età.");

                let lowerBound = 0;
                let upperBound = etaAttualeNum;

                // Binary Search for Age
                while (upperBound - lowerBound > 1) {
                    const midPoint = Math.floor(lowerBound + (upperBound - lowerBound) / 2);
                    if (midPoint === lowerBound && upperBound - lowerBound <= 1) break;

                    const question = `L'evento è accaduto prima dei ${midPoint} anni? Si o no? Attendo risposta.`;
                    setMessage(`Prima dei ${midPoint} anni?`);
                    const response = await voiceService.askQuestion(question);

                    if (response === 'SI') upperBound = midPoint;
                    else if (response === 'NO') lowerBound = midPoint;
                    else {
                        setMessage("Risposta non rilevata. Riprova.");
                        await voiceService.speak("Non ho capito. Riprova.");
                        // Stay in loop
                    }
                }
                foundAge = upperBound;

                // CONFIRMATION (Safety Net)
                setInvestigationStatus('CONFIRMING_AGE');
                setMessage(`Età rilevata: ${foundAge} anni. Confermi?`);
                const confirmResponse = await voiceService.askQuestion(`Ho rilevato ${foundAge} anni. Confermi che questa è l'età corretta? Si o No?`);
                
                if (confirmResponse === 'SI') {
                    confirmedAge = true;
                } else {
                    setMessage("Età non confermata. Riavvio ricerca...");
                    await voiceService.speak("Ok, ricominciamo la ricerca dell'età.");
                    // Loop continues
                }
            }
            
            // Calculate TimeLine Data
            const PU = etaAttualeNum / 2;
            const CDS = etaAttualeNum / 4;
            const isFatto = foundAge > PU;
            let PT, etaAntefatto, etaFatto;
            if (isFatto) {
                etaFatto = foundAge; PT = etaFatto - CDS; etaAntefatto = PT - CDS;
            } else {
                etaAntefatto = foundAge; PT = etaAntefatto + CDS; etaFatto = PT + CDS;
            }
            const CDT = Math.abs(PT - PU);
            let diagnosi: 'Libertà Vincolata' | 'Sogno Frustrato' | 'Equilibrio' = 'Equilibrio';
            if (PT < PU) diagnosi = 'Libertà Vincolata'; else if (PT > PU) diagnosi = 'Sogno Frustrato';

            // Save TimeLine
            setUserData(prev => ({
                ...prev,
                timeLine: { etaEventoCausa: foundAge.toString(), PU, CDS, PT, etaAntefatto: Math.round(etaAntefatto*10)/10, etaFatto: Math.round(etaFatto*10)/10, isFatto, CDT: Math.round(CDT*10)/10, diagnosi },
                completedTests: { ...prev.completedTests, timeLine: true }
            }));

            // 2. DATE SEARCH
            setInvestigationStatus('SEARCHING_DATE');
            const transitionText = `Fu un evento accaduto quando avevi ${foundAge} anni. Adesso, individueremo il giorno in cui accadde. Caro inconscio di ${userData.nome}, l'evento accadde...`;
            setMessage("Ricerca della data...");
            await voiceService.speak(transitionText);

            let foundSeason: SeasonKey | null = null;
            let foundMonth: string | null = null;

            for (const season of Object.keys(seasons) as SeasonKey[]) {
                setMessage(`Stagione: ${season}?`);
                if (await voiceService.askQuestion(`Era in ${season}? Si o no?`) === 'SI') { foundSeason = season; break; }
            }
            if (!foundSeason) { setMessage("Stagione non trovata."); await voiceService.speak("Non ho trovato la stagione. Procedo."); }

            if (foundSeason) {
                for (const month of seasons[foundSeason]) {
                    setMessage(`Mese: ${month}?`);
                    if (await voiceService.askQuestion(`Era nel mese di ${month}? Si o no?`) === 'SI') { foundMonth = month; break; }
                }
            }
            // Default to January if fail, to not break flow
            if (!foundMonth) foundMonth = 'Gennaio';

            // Binary Search Day
            let dLow = 1, dHigh = daysInMonth[foundMonth];
            while (dHigh > dLow) {
                const mid = Math.floor(dLow + (dHigh - dLow) / 2);
                setMessage(`Prima del ${mid+1} ${foundMonth}?`);
                const resp = await voiceService.askQuestion(`L'evento accadde prima del giorno ${mid + 1} di ${foundMonth}? Si o no?`);
                if (resp === 'SI') dHigh = mid; else if (resp === 'NO') dLow = mid + 1; else break;
            }
            const foundDay = dLow;
            const fullDate = `${foundDay} ${foundMonth}`;
            
            setUserData(prev => ({ ...prev, giornoEvento: fullDate, completedTests: { ...prev.completedTests, qualeGiorno: true } }));

            // 3. WITNESS SEARCH
            setInvestigationStatus('SEARCHING_WITNESS');
            const witnessText = `Bene, adesso che sappiamo quanti anni avevi e quale giorno accadde, ti chiedo: caro inconscio di ${userData.nome}, quel giorno, da chi subisti il torto?`;
            setMessage("Ricerca del testimone...");
            await voiceService.speak(witnessText);

            // Gender check
            const isMale = await voiceService.askQuestion("Era un uomo? Si o No?Attendo risposta.") === 'SI';
            
            const candidates = isMale 
                ? ["Tuo padre", "Tuo nonno", "Tuo zio", "Tuo fratello", "Tuo cugino", "Un amico", "Un insegnante"] 
                : ["Tua madre", "Tua nonna", "Tua zia", "Tua sorella", "Tua cugina", "Un'amica", "Un'insegnante"];
            
            const parentiAmbigui = ["Tuo nonno", "Tuo zio", "Tuo cugino", "Tua nonna", "Tua zia", "Tua cugina"];

            let foundWitness = "Non identificato";
            
            for (const c of candidates) {
                setMessage(`Era ${c}?`);
                if (await voiceService.askQuestion(`Era ${c}? Si o No?`) === 'SI') { 
                    foundWitness = c; 
                    
                    // Logic for Specification (Paterno/Materno)
                    if (parentiAmbigui.includes(c)) {
                        setMessage("Specificare: Da parte di papà? (Sì = Paterno, No = Materno)");
                        const specResponse = await voiceService.askQuestion(`Da parte di papà? Si o No?`);
                        if (specResponse === 'SI') {
                            foundWitness += " (Paterno)";
                        } else {
                            foundWitness += " (Materno)";
                        }
                    }
                    break; 
                }
            }
            
            setUserData(prev => ({ ...prev, testimoneChiave: foundWitness, completedTests: { ...prev.completedTests, testimone: true } }));

            // 4. JUSTIFICATION
            setInvestigationStatus('JUSTIFICATION');
            const justText = `Adesso cerchiamo di capire cosa accadde con ${foundWitness}. Caro inconscio, nell'evento accaduto a ${foundAge} anni, hai giustificato il torto ricevuto da ${foundWitness}? Si o no, attendo risposta.`;
            setMessage("Hai giustificato il torto? Attendo risposta.");
            await voiceService.speak(justText); 
            const justResponse = await voiceService.askQuestion("Hai giustificato il torto? Si o No?");
            
            setUserData(prev => ({ ...prev, giustificatoTorto: justResponse as any }));
            
            setMessage("Indagine Completata!");
            await voiceService.speak(`Indagine completata. Hai reagito: ${justResponse === 'SI' ? 'Giustificando' : 'Non Giustificando'}.`);
            
            localStorage.removeItem('wizardStep'); // Clear progress on completion
            setInvestigationStatus('DONE');

        } catch (e) {
            console.error(e);
            if (investigationStatus !== 'INTRO') setMessage("Errore durante l'indagine.");
        }
    };

    return (
        <FullScreenWrapper onExit={handleExit}>
            {step === 1 && <CalibrazioneScreen setPage={setPage} onNext={nextStep} isWizard={true} />}
            {step === 2 && <TestInduttore setPage={setPage} onNext={nextStep} isWizard={true} />}
            {step === 3 && <TestNome setPage={setPage} onNext={nextStep} isWizard={true} />}
            {step === 4 && <TestPuntiDistonici setPage={setPage} onNext={nextStep} isWizard={true} />}
            {step === 5 && <TestSigilliVincoli setPage={setPage} onNext={nextStep} isWizard={true} />}
            
            {step === 6 && (
                <div className="bg-white rounded-lg shadow-lg p-6 pb-24 relative">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Step Finale: La Grande Indagine</h2>
                        <p className="text-gray-600 text-sm">Fase finale: Età, Data, Testimone e Reazione.</p>
                    </div>

                    <InfoBox>
                        <p>Il sistema ti guiderà automaticamente. Segui le istruzioni vocali e i segnali visivi a schermo.</p>
                    </InfoBox>

                    <div className="my-6">
                        <CameraView videoRef={videoRef} onReady={handleCameraReady} />
                    </div>

                    <div className="text-center p-6 bg-indigo-50 rounded-xl border border-indigo-100 min-h-[120px] flex flex-col justify-center items-center">
                        <p className="font-serif text-xl font-bold text-indigo-900 mb-2 transition-all">{message}</p>
                        {investigationStatus !== 'INTRO' && investigationStatus !== 'DONE' && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                </span>
                                <span className="text-indigo-600 text-sm font-medium">Analisi in corso...</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-center">
                        {investigationStatus === 'INTRO' && (
                            <button 
                                onClick={startGrandInvestigation}
                                disabled={!isCameraReady}
                                className="bg-indigo-600 text-white font-bold py-4 px-10 rounded-full hover:bg-indigo-700 transition shadow-lg hover:scale-105 transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                AVVIA INDAGINE COMPLETA
                            </button>
                        )}
                        
                        {investigationStatus === 'DONE' && (
                            <div className="w-full">
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h3 className="font-bold text-green-800 mb-2">Risultato Finale:</h3>
                                    <ul className="text-sm space-y-1 text-green-900">
                                        <li>Età: <strong>{userData.timeLine.etaEventoCausa}</strong></li>
                                        <li>Data: <strong>{userData.giornoEvento}</strong></li>
                                        <li>Testimone: <strong>{userData.testimoneChiave}</strong></li>
                                        <li>Reazione: <strong>{userData.giustificatoTorto === 'SI' ? 'Giustificato' : 'Non Giustificato'}</strong></li>
                                    </ul>
                                </div>
                                <button 
                                    onClick={handleExit} 
                                    className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700"
                                >
                                    Vedi Risultati Finali e Concludi
                                </button>
                            </div>
                        )}
                    </div>

                    <TestControls 
                                                                                                onRepeat={handleRepeatGrandInvestigation}
                        onExit={handleExit}
                        showControls={investigationStatus !== 'INTRO' && investigationStatus !== 'DONE'}
                    />
                </div>
            )}
        </FullScreenWrapper>
    );
};

export default PercorsoCompleto;
