/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useHeader } from '../contexts/HeaderContext';

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
import QualeGiorno from './QualeGiorno';
import TestimoneChiave from './TestimoneChiave';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

interface TestItem {
  id: string;
  title: string;
  category?: string;
  description: string;
  component: React.FC<ScreenProps>;
  icon: string;
  isInfo?: boolean;
}

const tests: TestItem[] = [
  // Conoscenza e Metodo (Informativi)
  { id: 'chiSono', title: '1) Chi sono', description: 'Max Pisani', component: ChiSono, icon: '👨‍💼', isInfo: true },
  { id: 'introduzione', title: '2) Introduzione alla App', description: 'Cos\'è l\'Analogista Virtuale', component: Introduzione, icon: '📖', isInfo: true },
  { id: 'laTecnica', title: '3) Come Posizionarsi', description: 'Postura e inquadratura corretta', component: LaTecnica, icon: '🧍', isInfo: true },

  // Dati Anagrafici
  { id: 'chiSei', title: 'I Tuoi Dati', description: 'Nome, età, genere e problema attuale', component: ChiSei, icon: '📝' },

  // Preparazione
  { id: 'calibrazione', title: 'Calibrazione', description: 'Zero assoluto e sensibilità oscillazione', component: CalibrazioneScreen, icon: '🎯' },

  // Test Analogici di Base (DAB) & Tipologie
  { id: 'tap', title: 'Test T.A.P. (Asta, Cerchio, Triangolo)', description: 'Tipologia Analogica della Personalità e distonia di base', component: TestTAP, icon: '🔺' },
  { id: 'induttore', title: 'Test Induttore', description: 'Mano destra e sinistra: Libertà vs Sogno', component: TestInduttore, icon: '👋' },
  { id: 'nome', title: 'Test del Nome', description: 'Verifica del riconoscimento dell\'identità da parte dell\'inconscio', component: TestNome, icon: '🆔' },
  { id: 'puntiDistonici', title: 'Test Punti Distonici', description: 'Indagine sulle 4 aree: famiglia, affetti, passioni, realizzazione', component: TestPuntiDistonici, icon: '🎯' },
  { id: 'sigilli', title: 'Test Sigilli e Vincoli', description: 'Colpa, abbandono, disistima, giudizio degli altri', component: TestSigilliVincoli, icon: '🔐' },

  // Linea del Tempo & Indagini nel Tempo
  { id: 'indagineSingola', title: 'Indietro nel Tempo (Grande Indagine)', description: 'Ciclo completo: Età, Giorno esatto, Testimone e Torto', component: IndagineSingola, icon: '⏳' },
  { id: 'qualeGiorno', title: 'Test Quale Giorno', description: 'Ricerca autonoma della stagione, mese e giorno dell\'evento', component: QualeGiorno, icon: '📅' },
  { id: 'testimone', title: 'Testimone Chiave', description: 'Ricerca della figura di riferimento collegata all\'evento causa', component: TestimoneChiave, icon: '👤' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userData, setAudioEnabled } = useUser();
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const { setHeader, setProMode } = useHeader();

  useEffect(() => {
    AdvancedVoiceService.stopAll();
    if (activeTest) {
      const test = tests.find(t => t.id === activeTest);
      if (test) {
        setHeader(test.title, test.description);
        setProMode(true);
      }
    } else {
      setProMode(false);
    }
    return () => {
      AdvancedVoiceService.stopAll();
    };
  }, [activeTest, setHeader, setProMode]);

  const handleNavigation = useCallback((destination: number | string) => {
    AdvancedVoiceService.stopAll();
    setAudioEnabled(false);
    if (typeof destination === 'string') {
      if (destination === '/risultati') {
        navigate('/risultati');
        return;
      }
      setActiveTest(destination);
      return;
    }
    if (destination === 0 || destination === 1) { 
      setActiveTest(null); 
      return;
    }
  }, [setAudioEnabled, navigate]);

  // Calcolo progressi test completati
  const actionableTests = tests.filter(t => !t.isInfo && t.id !== 'chiSei');
  const completedCount = actionableTests.reduce((acc, t) => {
    return userData.completedTests?.[t.id] ? acc + 1 : acc;
  }, 0) + (userData.completedTests?.chiSei ? 1 : 0);
  const totalCount = actionableTests.length + 1;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  if (activeTest) {
    const current = tests.find(t => t.id === activeTest);
    if (!current) return null;
    const TestComponent = current.component;
    return <TestComponent setPage={handleNavigation} />;
  }

  const isChiSeiComplete = !!userData.completedTests?.chiSei || !!userData.nome;
  const infoTests = tests.filter(t => t.isInfo);
  const dataTest = tests.find(t => t.id === 'chiSei');
  
  // Raggruppamento per categorie chiare
  const coreAnalogicTests = tests.filter(t => ['tap', 'induttore', 'nome', 'puntiDistonici', 'sigilli'].includes(t.id));
  const timelineTests = tests.filter(t => ['indagineSingola', 'qualeGiorno', 'testimone'].includes(t.id));
  const prepTests = tests.filter(t => t.id === 'calibrazione');

  return (
    <div className="space-y-6 animate-fadeIn relative pb-12">
      
      {/* BANNER AUSILIO LIBRO */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl flex-shrink-0">📖</span>
          <div>
            <h3 className="font-serif font-black text-sm sm:text-base text-amber-950 tracking-tight">
              Ausilio gratuito per lettori di Smettila di Soffrire
            </h3>
            <p className="text-xs text-amber-800 font-medium mt-0.5">
              Guida pratica interattiva e test analogici a supporto della lettura del libro di Max Pisani
            </p>
          </div>
        </div>
        <span className="self-end sm:self-center px-3 py-1 bg-amber-200/90 text-amber-900 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-amber-400/50 flex-shrink-0">
          Supporto al Libro
        </span>
      </div>

      {/* HEADER: Progress Bar & Status */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 backdrop-blur rounded-2xl p-4 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-white/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-serif font-bold leading-tight">I Tuoi Test Analogici</h2>
          </div>
          <p className="text-blue-100 text-xs mt-1">
            Ogni test è <strong>indipendente</strong>: scegli liberamente da quale iniziare in base a ciò che desideri esplorare.
          </p>
        </div>
        <div className="flex flex-col items-end w-full sm:w-1/3">
          <div className="flex items-center justify-between w-full text-xs font-bold text-blue-200">
            <span>Completati: {completedCount}/{totalCount}</span>
            <span className="text-xl font-bold text-white">{progressPercent}%</span>
          </div>
          <div className="w-full bg-blue-950/60 rounded-full h-2 mt-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* QUICK LINK AL REPORT FINALE */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📋</span>
          <div>
            <h4 className="font-serif font-bold text-base">Quadro Risultati & Profilo</h4>
            <p className="text-xs text-emerald-100">Consulta il report riassuntivo dei test svolti, analisi interpretativa ed esportazione PDF.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/risultati')}
          className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-6 py-2.5 rounded-xl shadow transition text-xs uppercase tracking-wider whitespace-nowrap"
        >
          Vedi Risultati →
        </button>
      </div>

      {/* BLOCCO 1: DATI ANAGRAFICI (Sempre accessibile) */}
      {dataTest && (
        <section>
          <button
            onClick={() => { setAudioEnabled(false); setActiveTest(dataTest.id); }}
            className={`w-full p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 border-2 shadow-sm flex items-center justify-between ${
              isChiSeiComplete 
                ? 'bg-emerald-50/90 border-emerald-300 hover:bg-emerald-100/90 hover:shadow-md' 
                : 'bg-white border-blue-300 hover:border-blue-500 hover:shadow-md'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${isChiSeiComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                <span className="text-2xl">{dataTest.icon}</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-gray-900">
                  {dataTest.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {isChiSeiComplete
                    ? `Dati inseriti: ${userData.nome || ''} (${userData.eta || ''} anni). Clicca per modificare.`
                    : 'Inserisci il tuo nome, età e problema da risolvere per personalizzare la voce.'}
                </p>
              </div>
            </div>
            {isChiSeiComplete ? (
              <span className="text-emerald-600 text-2xl font-bold ml-2">✓</span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                Compila
              </span>
            )}
          </button>
        </section>
      )}

      {/* BLOCCO 2: TEST ANALOGICI DI BASE & TIPOLOGIE (DAB) */}
      <section className="bg-white/90 backdrop-blur rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔺</span>
            <h3 className="text-base sm:text-lg font-serif font-black text-gray-900">
              Test Tipologie & Dinamiche Emotive (DAB)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Test comportamentali per scoprire tipologia di personalità (Asta, Cerchio, Triangolo), induttori, riconoscimento dell'identità e blocchi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {coreAnalogicTests.map(test => {
            const isDone = userData.completedTests?.[test.id];
            return (
              <button
                key={test.id}
                onClick={() => { setAudioEnabled(false); setActiveTest(test.id); }}
                className={`p-4 rounded-xl text-left transition-all border-2 flex items-start space-x-3.5 group hover:shadow-md ${
                  isDone 
                    ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/70' 
                    : 'bg-slate-50/80 border-slate-200 hover:border-blue-400 hover:bg-white'
                }`}
              >
                <span className="text-2xl p-2 rounded-lg bg-white border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
                  {test.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm sm:text-base text-gray-900 leading-tight">
                      {test.title}
                    </h4>
                    {isDone && <span className="text-emerald-600 text-lg font-bold ml-2">✓</span>}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {test.description}
                  </p>
                  <span className="inline-block mt-2 text-[11px] font-bold text-blue-600 group-hover:underline">
                    {isDone ? 'Ripeti Test →' : 'Avvia Test →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* BLOCCO 3: LINEA DEL TEMPO & INDAGINE SULL'EVENTO CAUSA */}
      <section className="bg-white/90 backdrop-blur rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧭</span>
            <h3 className="text-base sm:text-lg font-serif font-black text-gray-900">
              Linea del Tempo & Ricerca dell'Evento Causa
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Calcola la Time Line, individua l'età dell'evento causa, la data esatta e il testimone chiave in autonomia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {timelineTests.map(test => {
            const isDone = userData.completedTests?.[test.id];
            return (
              <button
                key={test.id}
                onClick={() => { setAudioEnabled(false); setActiveTest(test.id); }}
                className={`p-4 rounded-xl text-left transition-all border-2 flex items-start space-x-3.5 group hover:shadow-md ${
                  isDone 
                    ? 'bg-blue-50/70 border-blue-300 hover:bg-blue-100/70' 
                    : 'bg-slate-50/80 border-slate-200 hover:border-indigo-400 hover:bg-white'
                }`}
              >
                <span className="text-2xl p-2 rounded-lg bg-white border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
                  {test.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm sm:text-base text-gray-900 leading-tight">
                      {test.title}
                    </h4>
                    {isDone && <span className="text-blue-600 text-lg font-bold ml-2">✓</span>}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {test.description}
                  </p>
                  <span className="inline-block mt-2 text-[11px] font-bold text-indigo-600 group-hover:underline">
                    {isDone ? 'Ripeti Indagine →' : 'Avvia Indagine →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* BLOCCO 4: CALIBRAZIONE CORPOREA */}
      <section className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        {prepTests.map(test => {
          const isDone = userData.completedTests?.[test.id];
          return (
            <div key={test.id} className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-xl bg-slate-800 border border-slate-700">🎯</span>
                <div>
                  <h4 className="font-serif font-bold text-base text-cyan-400">{test.title}</h4>
                  <p className="text-xs text-slate-300">{test.description}</p>
                </div>
              </div>
              <button
                onClick={() => { setAudioEnabled(false); setActiveTest(test.id); }}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-2.5 rounded-xl shadow transition text-xs uppercase tracking-wider whitespace-nowrap"
              >
                {isDone ? 'Ricalibra Posizione' : 'Apri Calibrazione'}
              </button>
            </div>
          );
        })}
      </section>

      {/* BLOCCO 5: CONOSCENZA E METODO */}
      <section className="bg-orange-50/90 backdrop-blur rounded-2xl p-4 border border-orange-200 shadow-sm">
        <h3 className="text-sm font-serif font-bold text-gray-900 mb-3 text-center sm:text-left flex items-center gap-2">
          <span>📚</span> Conoscenza e Metodo (Guida Introduttiva)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {infoTests.map((test) => (
            <button
              key={test.id}
              onClick={() => { setAudioEnabled(false); setActiveTest(test.id); }}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-orange-200 bg-white hover:bg-orange-100/50 transition-all text-center h-full shadow-sm"
            >
              <span className="text-xl mb-1">{test.icon}</span>
              <h4 className="font-bold text-sm text-gray-900 mb-0.5">{test.title}</h4>
              <p className="text-xs text-gray-600">{test.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
