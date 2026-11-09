
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { useHeader } from '../contexts/HeaderContext';
import { useAuth } from '../contexts/AuthContext';

import ChiSono from './ChiSono';
import Introduzione from './Introduzione';
import LaTecnica from './LaTecnica';
import ChiSei from './ChiSei';
import CalibrazioneScreen from './CalibrazioneScreen';
import TestTAP from './TestTAP';
import TestInduttore from './TestInduttore';
import TestNome from './TestNome';
import TestPuntiDistonici from './TestPuntiDistonici';
import TestSigilliVincoli from './TestSigilliVincoli';
import IndagineSingola from './IndagineSingola';
import PercorsoCompleto from './PercorsoCompleto';
import { FeedbackForm } from '../components/FeedbackForm';

import AdminFeedback from './AdminFeedback';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

interface TestItem {
  id: string;
  title: string;
  description: string;
  component: React.FC<ScreenProps>;
  icon: string;
  isInfo?: boolean;
  isSpecial?: boolean;
}

const adminFeedbackItem: TestItem = { id: 'adminFeedback', title: 'Feedback Utenti', description: 'Area Riservata Amministratore', component: AdminFeedback, icon: '🛡️', isSpecial: true };
const tests: TestItem[] = [
  // Special Wizard
  { id: 'percorsoCompleto', title: 'PERCORSO COMPLETO', description: 'Lasciati guidare in un unico flusso continuo (Consigliato)', component: PercorsoCompleto, icon: '🚀', isSpecial: true },
  
  // Info Section - Icons removed as requested
  { id: 'chiSono', title: '1) Chi sono', description: 'Max Pisani', component: ChiSono, icon: '', isInfo: true },
  { id: 'introduzione', title: '2) Introduzione alla App', description: 'A cosa serve e cos\'è', component: Introduzione, icon: '', isInfo: true },
  { id: 'laTecnica', title: '3) Come Posizionarsi per i Test', description: 'Come funziona?', component: LaTecnica, icon: '', isInfo: true },
  
  // Data Entry (Special Handling)
  { id: 'chiSei', title: 'Scrivi i tuoi dati per iniziare', description: 'Dati completati. Puoi procedere.', component: ChiSei, icon: '📝' },

  // Preparation Section
  { id: 'calibrazione', title: '4) Calibrazione', description: 'Prepara il sistema al test.', component: CalibrazioneScreen, icon: '🎯' },
  { id: 'tap', title: '5) Test T.A.P. (Asta, Cerchio, Triangolo)', description: 'Tipologia Analogica della Personalità', component: TestTAP, icon: '🔺' },
  
  // Investigation Section
  { id: 'induttore', title: '6) Test Induttore', description: 'Istituzionale o Trasgressivo?', component: TestInduttore, icon: '👋' },
  { id: 'nome', title: '7) Test Nome', description: 'Il tuo inconscio ti riconosce?', component: TestNome, icon: '🆔' },
  { id: 'puntiDistonici', title: '8) Punti Distonici', description: 'Identifica le aree di disagio.', component: TestPuntiDistonici, icon: '🎯' },
  { id: 'sigilli', title: '9) Sigilli-Vincoli', description: 'Scopri i blocchi emotivi.', component: TestSigilliVincoli, icon: '🔐' },
  { id: 'indagineSingola', title: '10) Indietro nel tempo', description: 'Età, giorno, testimone e reazione in un unico ciclo.', component: IndagineSingola, icon: '🧭' },
];

const Dashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const { userData, isAudioEnabled, setAudioEnabled } = useUser();
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [showManualTools, setShowManualTools] = useState(false);
  const { setHeader, setProMode } = useHeader();

  useEffect(() => {
    if (activeTest) {
      const test = tests.find(t => t.id === activeTest);
      if (test) {
        setHeader(test.title, test.description);
        setProMode(true);
      }
    } else {
      // In Dashboard home, we let AppContent manage the header via location
      setProMode(false);
    }
  }, [activeTest, setHeader, setProMode]);

  const handleNavigation = useCallback((destination: number | string) => {
    setAudioEnabled(false); // Mute audio on any navigation/interaction
    if (typeof destination === 'string') {
        setActiveTest(destination);
        return;
    }
    if (destination === 0 || destination === 1) { 
      setActiveTest(null); 
      return;
    }
  }, [setAudioEnabled]);
  
  // Progress Calculation
  const standardTests = tests.filter(t => !t.isSpecial && !t.isInfo && t.id !== 'chiSei');
  const totalSteps = standardTests.length + 2; // +1 Contact Max, +1 ChiSei
  const completedCount = standardTests.reduce((acc, test) => {
      return userData.completedTests?.[test.id] ? acc + 1 : acc;
  }, 0) + (userData.hasContactedMax ? 1 : 0) + (userData.completedTests?.chiSei ? 1 : 0);
  
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  if (activeTest) {
    if (activeTest === 'adminFeedback') {
      return <AdminFeedback setPage={handleNavigation} />;
    }
    const test = tests.find(t => t.id === activeTest);
    if (!test) return null;
    const TestComponent = test.component;
    return <TestComponent setPage={handleNavigation} />;
  }
  
  const isChiSeiComplete = userData.completedTests?.chiSei;

  // Grouping Tests Logic
  const infoTests = tests.filter(t => t.isInfo);
  const wizardTest = tests.find(t => t.isSpecial);
  const dataTest = tests.find(t => t.id === 'chiSei');
  
  // Prep tests excluding ChiSei
  const prepTests = tests.filter(t => t.id === 'calibrazione');
  
  const investigationTests = tests.filter(t => 
      !t.isInfo && 
      !t.isSpecial && 
      t.id !== 'chiSei' &&
      t.id !== 'calibrazione'
  );

  return (
    // Rimosso bg-white/90 e shadow per lasciare che lo sfondo di App.tsx sia visibile
    <div className="space-y-6 animate-fadeIn relative">
      
      {/* HEADER: Progress Bar */}
      <div className="bg-gradient-to-r from-blue-700/90 to-indigo-800/90 backdrop-blur rounded-xl p-3 text-white shadow-md relative overflow-hidden flex justify-between items-center border border-white/20">
         <div>
            <h2 className="text-base font-serif font-bold leading-tight">I Tuoi Progressi</h2>
            {progressPercent >= 90 && !userData.hasContactedMax ? (
                <p className="text-yellow-300 text-[10px] font-bold animate-pulse mt-1">Contatta Max per il 100% finale.</p>
            ) : (
                <p className="text-blue-200 text-[10px] mt-1">Completa il percorso.</p>
            )}
         </div>
         <div className="flex flex-col items-end w-1/3">
            <span className="text-2xl font-bold">{progressPercent}%</span>
            <div className="w-full bg-blue-900/40 rounded-full h-1.5 mt-1">
                <div 
                    className="bg-white h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
         </div>
      </div>

      {/* BLOCCO 1: INFO (Sfondo Arancio Chiaro) */}
      <section className="bg-orange-50/90 backdrop-blur rounded-2xl p-4 border border-orange-100 shadow-sm">
        <h3 className="text-base font-serif font-bold text-gray-800 mb-4 text-center flex flex-col items-center justify-center sm:flex-row sm:gap-2">
            Conoscenza e Metodo
            <span className="text-xs font-sans font-normal text-gray-600 uppercase tracking-wide">
                (Leggi, prima di iniziare i Test)
            </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {infoTests.map((test, index) => {
            const styles = [
                {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    title: 'text-blue-900',
                    desc: 'text-blue-700',
                    hover: 'hover:bg-blue-100 hover:border-blue-300'
                },
                {
                    bg: 'bg-purple-50',
                    border: 'border-purple-200',
                    title: 'text-purple-900',
                    desc: 'text-purple-700',
                    hover: 'hover:bg-purple-100 hover:border-purple-300'
                },
                {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    title: 'text-emerald-900',
                    desc: 'text-emerald-700',
                    hover: 'hover:bg-emerald-100 hover:border-emerald-300'
                }
            ];
            
            const style = styles[index % styles.length];

            return (
                <button
                key={test.id}
                onClick={() => { setAudioEnabled(false); setActiveTest(test.id); }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center h-full shadow-sm ${style.bg} ${style.border} ${style.hover}`}
                >
                    <div className="w-full">
                        <h4 className={`font-bold text-base sm:text-lg mb-1 ${style.title}`}>{test.title}</h4>
                        <p className={`text-xs sm:text-sm font-medium leading-tight ${style.desc}`}>{test.description}</p>
                    </div>
                </button>
            );
          })}
        </div>
      </section>

      {/* BLOCCO DATI: SCRIVI I TUOI DATI (VERDE) */}
      {dataTest && (
        <section>
            <button
              onClick={() => { setAudioEnabled(false); setActiveTest(dataTest.id); }}
              className={`w-full p-5 rounded-2xl text-left transition-all duration-300 border-2 shadow-sm flex items-center space-x-4 backdrop-blur-sm ${
                  isChiSeiComplete 
                  ? 'bg-green-50/90 border-green-300 hover:shadow-md hover:bg-green-100' 
                  : 'bg-green-50/90 border-green-300 hover:shadow-md hover:bg-green-100' 
              }`}
            >
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <span className="text-2xl">{dataTest.icon}</span>
                </div>
                <div>
                    <h3 className="font-serif font-bold text-lg text-green-800">
                        {dataTest.title}
                    </h3>
                    <p className="text-sm text-green-700">
                        {isChiSeiComplete ? 'Dati completati. Puoi procedere.' : 'Compila col tuo nome, età e sesso per cominciare.'}
                    </p>
                </div>
                {isChiSeiComplete && <span className="ml-auto text-green-600 text-3xl font-bold">✓</span>}
            </button>
        </section>
      )}

      {/* BLOCCO 2: WIZARD (Sfondo Indaco/Hero) */}
      {wizardTest && (
        <section className={!isChiSeiComplete ? 'opacity-50 pointer-events-none grayscale' : ''}>
           <button
              onClick={() => { setAudioEnabled(false); setActiveTest(wizardTest.id); }}
              disabled={!isChiSeiComplete}
              className="w-full group relative p-6 rounded-2xl text-left transition-all duration-300 flex flex-col sm:flex-row items-center sm:space-x-6 border-2 border-indigo-500 bg-gradient-to-br from-indigo-50/95 to-white/95 backdrop-blur hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
            >
                <div className="bg-indigo-600 text-white p-4 rounded-full shadow-md z-10 mb-3 sm:mb-0 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{wizardTest.icon}</span>
                </div>
                
                <div className="flex-1 z-10 text-center sm:text-left">
                    <h3 className="font-serif font-bold text-xl text-indigo-900 mb-1">{wizardTest.title}</h3>
                    <p className="text-indigo-700 text-sm mb-3 sm:mb-0">{wizardTest.description}</p>
                </div>
                
                <div className="z-10">
                  <span className="inline-block bg-indigo-600 text-white text-sm font-bold py-2 px-6 rounded-full shadow-lg group-hover:bg-indigo-700 transition-colors">
                    AVVIA
                  </span>
                </div>
            </button>
        </section>
      )}

      {/* BLOCCO 3: TEST SINGOLI (Sfondo Arancione Chiaro) */}
      <section className={`bg-orange-50/90 backdrop-blur rounded-2xl p-1 border-2 border-orange-100 ${!isChiSeiComplete ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        <button
            onClick={() => { setAudioEnabled(false); setShowManualTools(!showManualTools); }}
            disabled={!isChiSeiComplete}
            className="w-full p-4 rounded-xl flex items-center justify-between hover:bg-orange-100/50 transition-colors"
        >
            <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2.5 rounded-lg text-orange-600 shadow-sm border border-orange-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                </div>
                <div className="text-left">
                    <h3 className="font-serif font-bold text-lg text-orange-900">TEST SINGOLI</h3>
                    <p className="text-xs text-orange-700">Seleziona i test singolarmente</p>
                </div>
            </div>
            <div className={`transform transition-transform duration-300 bg-white p-2 rounded-full shadow-sm ${showManualTools ? 'rotate-180' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </button>

        {showManualTools && (
            <div className="p-4 pt-0 space-y-6 animate-fadeIn mt-4 border-t border-orange-200/50">
                {/* Preparazione (Senza ChiSei) */}
                <div>
                    <h4 className="font-bold text-orange-800 text-xs uppercase tracking-wider mb-3 mt-2 text-center">Preparazione</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prepTests.map(test => {
                        const isCompleted = userData.completedTests?.[test.id];
                        return (
                        <button
                            key={test.id}
                            onClick={() => { setAudioEnabled(false); setActiveTest(test.id); }}
                            className={`p-3 rounded-lg text-left transition-all border flex items-center space-x-3 ${
                            isCompleted 
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200 hover:border-orange-400'
                            }`}
                        >
                            <span className="text-xl">{test.icon}</span>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 text-sm">{test.title}</h3>
                            </div>
                            {isCompleted && <span className="text-green-500">✓</span>}
                        </button>
                        )
                    })}
                    </div>
                </div>

                {/* Indagine */}
                <div>
                    <h4 className="font-bold text-orange-800 text-xs uppercase tracking-wider mb-3 text-center">Strumenti di Indagine</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {investigationTests.map(test => {
                        const isCompleted = userData.completedTests?.[test.id];
                        
                        return (
                        <button
                            key={test.id}
                            onClick={() => { setAudioEnabled(false); setActiveTest(test.id); }}
                            className={`p-3 rounded-lg text-left transition-all border flex items-center space-x-3 ${
                            isCompleted 
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200 hover:border-orange-400'
                            }`}
                        >
                            <span className="text-xl">{test.icon}</span>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 text-sm">{test.title}</h3>
                            </div>
                            {isCompleted && <span className="text-green-500">✓</span>}
                        </button>
                        );
                    })}
                    </div>
                </div>
            </div>
        )}
      </section>
      
      {/* Feedback Amministratore */}
      {isAdmin && (
        <section className="mt-8">
            <button
              onClick={() => { setActiveTest('adminFeedback'); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg border border-blue-500 transition-all flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🛡️</span>
                    <div className="text-left">
                        <h3 className="text-lg font-bold">Feedback Utenti</h3>
                        <p className="text-xs text-blue-100">Area Riservata Amministratore</p>
                    </div>
                </div>
            </button>
        </section>
      )}

      {!activeTest && <FeedbackForm />}
      
      <div className="h-8"></div>
    </div>
  );
};

export default Dashboard;
