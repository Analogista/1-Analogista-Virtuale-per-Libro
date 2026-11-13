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
import RicercaCause from './RicercaCause';
import { BookConsole } from '../components/BookConsole';
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
  { id: 'puntiDistonici', title: 'Test Punti Distonici', description: 'Indagine sulle 5 aree: famiglia d\'origine, famiglia acquisita, relazioni sentimentali e affettive, relazioni passionali e sessuali, autorealizzazione, hobby e lavoro', component: TestPuntiDistonici, icon: '🎯' },
  { id: 'sigilli', title: 'Test Sigilli e Vincoli', description: 'Sensi di colpa, paura dell\'abbandono, timore del giudizio, mancanza di autostima', component: TestSigilliVincoli, icon: '🔐' },

  // Linea del Tempo & Indagini nel Tempo
  { id: 'indagineSingola', title: 'Indietro nel Tempo (Grande Indagine)', description: 'Ciclo completo: Età, Giorno esatto, Testimone e Torto', component: IndagineSingola, icon: '⏳' },
  { id: 'qualeGiorno', title: 'Test Quale Giorno', description: 'Ricerca autonoma della stagione, mese e giorno dell\'evento', component: QualeGiorno, icon: '📅' },
  { id: 'testimone', title: 'Testimone & Torto', description: 'Ricerca del ruolo di riferimento e delle due domande sulla reazione al torto', component: TestimoneChiave, icon: '👤' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userData, setAudioEnabled } = useUser();
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [showIntroGuide, setShowIntroGuide] = useState(false);
  const [showAllTests, setShowAllTests] = useState(false);
  const { setHeader, setProMode } = useHeader();

  useEffect(() => {
    const handleGoHome = () => {
      AdvancedVoiceService.stopAll();
      setAudioEnabled(false);
      setActiveTest(null);
    };
    window.addEventListener('analogista:goHome', handleGoHome);
    return () => window.removeEventListener('analogista:goHome', handleGoHome);
  }, [setAudioEnabled]);

  useEffect(() => {
    AdvancedVoiceService.stopAll();
    if (activeTest === 'ricercaCause') {
      setHeader('Ricerca Cause Profonde', 'Fase 2 — Approfondimenti sulle cause nel tempo');
      setProMode(false);
    } else if (activeTest) {
      const test = tests.find(t => t.id === activeTest);
      if (test) {
        setHeader(test.title, test.description);
        setProMode(true);
      } else {
        setHeader('Analogista Virtuale di Max Pisani', 'Ausilio gratuito per lettori di Smettila di Soffrire');
        setProMode(false);
      }
    } else {
      setHeader('Analogista Virtuale di Max Pisani', 'Ausilio gratuito per lettori di Smettila di Soffrire');
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
      if (destination === 'ricercaCause' || tests.some(t => t.id === destination)) {
        setActiveTest(destination);
        return;
      }
      setActiveTest(null);
      return;
    }
    if (destination === 0 || destination === 1) { 
      setActiveTest(null); 
      return;
    }
  }, [setAudioEnabled, navigate]);

  // Calcolo progressi test singoli (esclusi informativi, I Tuoi Dati e Calibrazione preparatoria)
  const actionableTests = tests.filter(t => !t.isInfo && t.id !== 'chiSei' && t.id !== 'calibrazione');
  const completedCount = actionableTests.reduce((acc, t) => {
    return userData.completedTests?.[t.id] ? acc + 1 : acc;
  }, 0);
  const totalCount = actionableTests.length;
  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  if (activeTest === 'ricercaCause') {
    return <RicercaCause setPage={handleNavigation} completedTests={userData.completedTests} />;
  }

  if (activeTest) {
    const current = tests.find(t => t.id === activeTest);
    if (current) {
      const TestComponent = current.component;
      return <TestComponent setPage={handleNavigation} />;
    }
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

      {/* GUIDA INTRODUTTIVA (Chiusa di default, primo elemento visibile) */}
      <section className="bg-orange-50/90 rounded-2xl border-2 border-orange-200 shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowIntroGuide(prev => !prev)}
          aria-expanded={showIntroGuide}
          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-orange-100/50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
              📚
            </div>
            <div className="min-w-0">
              <h2 className="font-serif font-black text-base sm:text-lg text-slate-900 leading-tight">
                📖 Guida introduttiva
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Chi è Max Pisani, cos’è l’app e come posizionarsi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold text-orange-700 hidden sm:inline">
              {showIntroGuide ? 'Chiudi guida' : 'Apri guida'}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-orange-200 text-orange-700 transition-transform duration-300 ${showIntroGuide ? 'rotate-180 bg-orange-100' : ''}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {showIntroGuide && (
          <div className="p-4 sm:p-5 pt-3 border-t border-orange-200 bg-orange-50/50 animate-fadeIn">
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
          </div>
        )}
      </section>

      {/* INTRODUZIONE ALL'ANALOGISTA VIRTUALE */}
      <div className="bg-white rounded-2xl border-2 border-indigo-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl flex-shrink-0">🔮</span>
            <div>
              <h2 className="font-serif font-black text-base sm:text-xl text-slate-900 tracking-tight">
                Cos'è l'Analogista Virtuale e come usarlo con il libro
              </h2>
              <p className="text-xs sm:text-sm text-indigo-900 font-semibold mt-0.5">
                Guida interattiva per ascoltare l'inconscio e identificare i blocchi emotivi
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex-shrink-0 hidden sm:inline-block">
            Autoconoscenza
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          L’<strong>Analogista Virtuale</strong> è un assistente pratico basato sulle Discipline Analogiche di Stefano Benemeglio e sviluppato da Max Pisani per il libro <em>Smettila di Soffrire</em>. Rileva attraverso la camera le micro-oscillazioni corpore istintive del soggetto (oscillazione avanti per il SÌ / indietro per il NO) per guidare l'ascolto profondo dell'inconscio in sicurezza.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 text-xs text-slate-600 leading-relaxed space-y-1.5">
          <p>
            <strong>Come usarlo con il libro:</strong> Segui la lettura ed esegui i test della Consolle qui sotto. La prima sezione raccoglie i 5 test di base; gli Approfondimenti permettono di esplorare gli eventi nel tempo. La fase di Check-in è attualmente in anteprima non attiva.
          </p>
          <p className="text-[11px] text-slate-500 italic">
            Strumento di esplorazione personale secondo il modello DAB: non fornisce diagnosi, prove certe di una causa né garanzie di risoluzione o superamento delle distonie.
          </p>
        </div>
      </div>

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

      {/* CONSOLLE: IL TUO PERCORSO CON IL LIBRO */}
      <BookConsole
        onSelectTest={(id) => handleNavigation(id)}
        completedTests={userData.completedTests}
      />

      {/* HEADER: Progress Bar & Status (Test singoli indipendenti) */}
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
            <span>Test singoli: {completedCount}/{totalCount}</span>
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

      {/* BLOCCO CALIBRAZIONE CORPOREA (Sempre accessibile) */}
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

      {/* SEZIONE: TUTTI I TEST SINGOLI (Chiusa di default, ad accesso libero) */}
      <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowAllTests(prev => !prev)}
          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl flex-shrink-0">
              📋
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 leading-tight">
                  Tutti i test singoli
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                  Accesso libero
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {showAllTests 
                  ? 'Fai clic per comprimere l\'elenco completo' 
                  : 'Apri l\'elenco per eseguire liberamente qualsiasi test in autonomia'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold text-blue-600 hidden sm:inline">
              {showAllTests ? 'Comprimi elenco' : 'Espandi elenco'}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600 transition-transform duration-300 ${showAllTests ? 'rotate-180 bg-blue-50 text-blue-600' : ''}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {showAllTests && (
          <div className="p-4 sm:p-6 pt-2 border-t border-slate-200 space-y-6 bg-slate-50/50 animate-fadeIn">
            {/* SOTTO-BLOCCO: TEST ANALOGICI DI BASE & TIPOLOGIE (DAB) */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
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
            </div>

            {/* SOTTO-BLOCCO: LINEA DEL TEMPO & INDAGINE SULL'EVENTO CAUSA */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
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
                  const isFromGrandeIndagine = Boolean(
                    isDone && userData.completedTests?.[`${test.id}FromGrandeIndagine`]
                  );
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
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="font-serif font-bold text-sm sm:text-base text-gray-900 leading-tight">
                            {test.title}
                          </h4>
                          {isFromGrandeIndagine ? (
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                              ✓ da Grande Indagine
                            </span>
                          ) : isDone ? (
                            <span className="text-blue-600 text-lg font-bold ml-2">✓</span>
                          ) : null}
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
            </div>

          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
