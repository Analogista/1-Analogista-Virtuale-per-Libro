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
  const isChiSeiMissingDetails = isChiSeiComplete && (!userData.genere || !userData.eta);
  const introSubPages = tests.filter(t => t.id === 'chiSono' || t.id === 'introduzione');
  const dataTest = tests.find(t => t.id === 'chiSei');
  const calibrazioneTest = tests.find(t => t.id === 'calibrazione');
  const isCalibrazioneDone = Boolean(userData.completedTests?.calibrazione);

  // Raggruppamento per categorie chiare (sezione secondaria test singoli)
  const coreAnalogicTests = tests.filter(t => ['tap', 'induttore', 'nome', 'puntiDistonici', 'sigilli'].includes(t.id));
  const timelineTests = tests.filter(t => ['indagineSingola', 'qualeGiorno', 'testimone'].includes(t.id));

  return (
    <div className="space-y-5 animate-fadeIn relative pb-12 overflow-x-hidden">

      {/* 1. IN CIMA: SCHEDA COMPATTA "COS'È L'ANALOGISTA VIRTUALE E COME USARLO CON IL LIBRO" */}
      <section className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm overflow-hidden transition-all">
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl sm:text-3xl flex-shrink-0" aria-hidden="true">🔮</span>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif font-black text-lg sm:text-xl text-slate-900 leading-snug">
                Cos’è l’Analogista Virtuale e come usarlo con il libro
              </h2>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                È una guida pratica che ti accompagna nella lettura di <em>Smettila di Soffrire</em> ascoltando le reazioni istintive del corpo attraverso la fotocamera.
              </p>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowIntroGuide(prev => !prev)}
              aria-expanded={showIntroGuide}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-sm border border-indigo-200 transition cursor-pointer"
            >
              <span>{showIntroGuide ? 'Chiudi la guida' : 'Leggi la guida'}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${showIntroGuide ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {showIntroGuide && (
          <div className="p-4 sm:p-5 border-t border-indigo-100 bg-slate-50/80 space-y-4 animate-fadeIn text-sm text-slate-700 leading-relaxed">
            <p>
              Basato sulle Discipline Analogiche di Stefano Benemeglio e ideato da Max Pisani, l’<strong>Analogista Virtuale</strong> rileva con la fotocamera le micro-oscillazioni involontarie del corpo mentre ascolti le domande guida: un movimento in <strong>avanti indica SÌ</strong>, un movimento <strong>indietro indica NO</strong>.
            </p>
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-1.5 text-sm">
              <p className="font-bold text-slate-900">Come seguire il percorso:</p>
              <p>1. Inserisci i tuoi dati qui sotto.</p>
              <p>2. Leggi come posizionarti ed esegui la calibrazione della fotocamera.</p>
              <p>3. Segui le tappe di <strong>«Il tuo percorso con il libro»</strong> (prima la Fase 1 con i 5 test iniziali, poi la Fase 2 per gli approfondimenti nel tempo; la Fase 3 è solo un’anteprima non ancora disponibile).</p>
            </div>
            <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-3">
              Strumento di esplorazione personale secondo il modello DAB: non fornisce diagnosi mediche o psicologiche, prove certe di una causa né garanzie di risoluzione o superamento delle distonie.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {introSubPages.map((test) => (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => { setAudioEnabled(false); setActiveTest(test.id); }}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 transition text-left shadow-2xs"
                >
                  <span className="text-2xl flex-shrink-0">{test.icon}</span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900">{test.title}</h4>
                    <p className="text-xs text-slate-600">{test.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 2. SUBITO DOPO: I TUOI DATI */}
      {dataTest && (
        <section>
          <button
            type="button"
            onClick={() => { setAudioEnabled(false); setActiveTest(dataTest.id); }}
            className={`w-full p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 border-2 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isChiSeiComplete && !isChiSeiMissingDetails
                ? 'bg-emerald-50/90 border-emerald-300 hover:bg-emerald-100/90 hover:shadow-md'
                : 'bg-white border-blue-400 hover:border-blue-600 hover:shadow-md'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className={`p-3 rounded-full flex-shrink-0 ${
                isChiSeiComplete && !isChiSeiMissingDetails
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                <span className="text-2xl">{dataTest.icon}</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-serif font-bold text-lg text-gray-900">
                  {dataTest.title}
                </h3>
                <p className="text-sm text-gray-700 mt-0.5 leading-snug">
                  {!isChiSeiComplete
                    ? 'Inizia da qui: inserisci nome, età, genere e il tema che vuoi esplorare per personalizzare voce e test.'
                    : isChiSeiMissingDetails
                    ? `Dati parziali (${userData.nome || ''}): completa età e genere per poter svolgere tutti i test.`
                    : `Dati salvati: ${userData.nome || ''} (${userData.eta || ''} anni). Tocca per rivedere o modificare.`}
                </p>
              </div>
            </div>
            {isChiSeiComplete && !isChiSeiMissingDetails ? (
              <span className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 whitespace-nowrap">
                ✓ Salvati
              </span>
            ) : (
              <span className="self-start sm:self-center text-xs font-bold uppercase tracking-wider text-white bg-blue-600 px-4 py-2 rounded-xl shadow-xs whitespace-nowrap">
                {isChiSeiComplete ? 'Completa i dati →' : 'Inserisci i dati →'}
              </span>
            )}
          </button>
        </section>
      )}

      {/* 3. PRIMA DEI TEST: COME POSIZIONARSI E CALIBRAZIONE (CON AVVERTENZE SEMPRE VISIBILI) */}
      <section className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border-2 border-slate-800 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl sm:text-3xl p-2 rounded-xl bg-slate-800 border border-slate-700 flex-shrink-0">🧍</span>
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-lg sm:text-xl text-cyan-300 leading-snug">
              Come posizionarsi e calibrazione
            </h3>
            <p className="text-sm text-slate-300 mt-0.5 leading-relaxed">
              Prima di avviare i test, leggi le avvertenze qui sotto, verifica la postura corretta e calibra la fotocamera.
            </p>
          </div>
        </div>

        {/* Avvertenze sempre visibili e ben leggibili */}
        <div className="bg-amber-50 text-amber-950 rounded-xl border-2 border-amber-300 p-4 space-y-2">
          <h4 className="font-bold text-sm sm:text-base flex items-center gap-2 text-amber-900">
            <span>⚠️</span> Avvertenze importanti prima di iniziare
          </h4>
          <ul className="list-disc list-inside text-xs sm:text-sm space-y-1.5 leading-relaxed">
            <li>Esegui i test <strong>in piedi</strong>, vicino a una <strong>parete</strong> o con una <strong>sedia alle spalle</strong> per maggiore appoggio e stabilità.</li>
            <li><strong>Non eseguire i test in caso di vertigini o problemi di equilibrio.</strong></li>
            <li>Esegui i test <strong>solo su di te</strong>, mai su altre persone.</li>
            <li>Puoi <strong>fermarti quando vuoi</strong> in qualsiasi momento.</li>
            <li><strong>Sintomi e malattie vanno sempre portati al medico</strong>; i test non sono una diagnosi né una terapia.</li>
          </ul>
        </div>

        {/* Azioni chiare per Postura e Calibrazione */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setAudioEnabled(false); setActiveTest('laTecnica'); }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            <span>🧍</span>
            <span>Leggi come posizionarsi</span>
          </button>

          {calibrazioneTest && (
            <button
              type="button"
              onClick={() => { setAudioEnabled(false); setActiveTest(calibrazioneTest.id); }}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl shadow transition text-sm flex items-center justify-center gap-2"
            >
              <span>🎯</span>
              <span>{isCalibrazioneDone ? '✓ Calibrazione fatta (Ricalibra)' : 'Apri calibrazione fotocamera'}</span>
            </button>
          )}
        </div>
      </section>

      {/* 4. SCHEDA CENTRALE E PIÙ EVIDENTE: IL TUO PERCORSO CON IL LIBRO */}
      <BookConsole
        onSelectTest={(id) => handleNavigation(id)}
        completedTests={userData.completedTests}
      />

      {/* 5. ACCESSO RAPIDO AI RISULTATI */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <span className="text-3xl flex-shrink-0">📋</span>
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-base sm:text-lg">Quadro Risultati &amp; Profilo</h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-snug">
              Consulta il riepilogo dei test completati e scarica il report in PDF.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/risultati')}
          className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-6 py-3 rounded-xl shadow transition text-sm whitespace-nowrap text-center"
        >
          Vedi Risultati →
        </button>
      </section>

      {/* 6. SEZIONE SECONDARIA APRIBILE IN BASSO: TUTTI I TEST SINGOLI */}
      <section className="bg-slate-50/80 rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowAllTests(prev => !prev)}
          aria-expanded={showAllTests}
          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-slate-100/70 transition cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl flex-shrink-0">
              📋
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-base text-slate-800 leading-tight">
                  Tutti i test singoli
                </h3>
                <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-300 px-2 py-0.5 rounded-md">
                  Sezione secondaria
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {showAllTests
                  ? 'Tocca per chiudere l’elenco dei singoli test'
                  : `Apri se vuoi avviare un singolo test in autonomia (${completedCount}/${totalCount} completati)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold text-blue-700 hidden sm:inline">
              {showAllTests ? 'Chiudi' : 'Apri elenco'}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-600 transition-transform duration-300 ${showAllTests ? 'rotate-180 bg-blue-50 text-blue-600' : ''}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {showAllTests && (
          <div className="p-4 sm:p-5 pt-3 border-t border-slate-200 space-y-5 bg-slate-50 animate-fadeIn">
            {/* Barra di avanzamento test singoli */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-800">
                Test singoli completati: {completedCount}/{totalCount} ({progressPercent}%)
              </div>
              <div className="w-full sm:w-48 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* SOTTO-BLOCCO: TEST ANALOGICI DI BASE & TIPOLOGIE (DAB) */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔺</span>
                  <h4 className="text-base font-serif font-bold text-gray-900">
                    Test di base (Fase 1)
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Tipologia T.A.P., Induttore, Nome, Punti Distonici e Sigilli/Vincoli.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {coreAnalogicTests.map(test => {
                  const isDone = userData.completedTests?.[test.id];
                  return (
                    <button
                      key={test.id}
                      type="button"
                      onClick={() => { setAudioEnabled(false); setActiveTest(test.id); }}
                      className={`p-4 rounded-xl text-left transition-all border-2 flex items-start space-x-3 group hover:shadow-sm ${
                        isDone
                          ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/70'
                          : 'bg-slate-50/80 border-slate-200 hover:border-blue-400 hover:bg-white'
                      }`}
                    >
                      <span className="text-2xl p-2 rounded-lg bg-white border border-slate-200 shadow-2xs flex-shrink-0">
                        {test.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-serif font-bold text-sm sm:text-base text-gray-900 leading-tight">
                            {test.title}
                          </h5>
                          {isDone && <span className="text-emerald-600 text-lg font-bold flex-shrink-0">✓</span>}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {test.description}
                        </p>
                        <span className="inline-block mt-2 text-xs font-bold text-blue-600 group-hover:underline">
                          {isDone ? 'Ripeti test →' : 'Avvia test →'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SOTTO-BLOCCO: LINEA DEL TEMPO & INDAGINE SULL'EVENTO CAUSA */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧭</span>
                  <h4 className="text-base font-serif font-bold text-gray-900">
                    Approfondimenti nel tempo (Fase 2)
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Indietro nel Tempo, Quale Giorno e Testimone &amp; Torto in autonomia.
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
                      type="button"
                      onClick={() => { setAudioEnabled(false); setActiveTest(test.id); }}
                      className={`p-4 rounded-xl text-left transition-all border-2 flex items-start space-x-3 group hover:shadow-sm ${
                        isDone
                          ? 'bg-blue-50/70 border-blue-300 hover:bg-blue-100/70'
                          : 'bg-slate-50/80 border-slate-200 hover:border-indigo-400 hover:bg-white'
                      }`}
                    >
                      <span className="text-2xl p-2 rounded-lg bg-white border border-slate-200 shadow-2xs flex-shrink-0">
                        {test.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h5 className="font-serif font-bold text-sm sm:text-base text-gray-900 leading-tight">
                            {test.title}
                          </h5>
                          {isFromGrandeIndagine ? (
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                              ✓ da Grande Indagine
                            </span>
                          ) : isDone ? (
                            <span className="text-blue-600 text-lg font-bold flex-shrink-0">✓</span>
                          ) : null}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {test.description}
                        </p>
                        <span className="inline-block mt-2 text-xs font-bold text-indigo-600 group-hover:underline">
                          {isDone ? 'Ripeti indagine →' : 'Avvia indagine →'}
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
