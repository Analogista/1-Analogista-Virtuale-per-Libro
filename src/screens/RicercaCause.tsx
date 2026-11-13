/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React from 'react';
import InfoBox from '../components/InfoBox';
import VideoAccordion from '../components/VideoAccordion';

interface ScreenProps {
  setPage: (page: number | string) => void;
  completedTests?: Record<string, boolean>;
}

const RicercaCause: React.FC<ScreenProps> = ({ setPage, completedTests = {} }) => {
  const items = [
    {
      id: 'indagineSingola',
      title: 'Grande Indagine (Indietro nel Tempo)',
      description: 'Ciclo completo: Età, Giorno esatto, Testimone e Torto.',
      icon: '⏳',
      details: 'Il percorso investigativo completo per trovare l\'origine del blocco emotivo.'
    },
    {
      id: 'qualeGiorno',
      title: 'Test Quale Giorno',
      description: 'Ricerca autonoma della stagione, mese e giorno dell\'evento.',
      icon: '📅',
      details: 'Utile quando hai già l\'età ma vuoi scendere nel dettaglio del momento esatto.'
    },
    {
      id: 'testimone',
      title: 'Testimone Chiave & Torto',
      description: 'Ricerca della figura di riferimento collegata all\'evento causa.',
      icon: '👤',
      details: 'Indaga su chi era presente e quale reazione emotiva hai avuto (Giustificato/Non Giustificato).'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-serif font-black text-slate-900">Ricerca Cause Profonde</h2>
          <p className="text-sm text-slate-600 mt-1">Strumenti investigativi per individuare l'evento causa nel tempo.</p>
        </div>
        <button
          onClick={() => setPage(0)}
          className="text-xs uppercase tracking-widest font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 px-3 py-1.5 rounded-lg transition bg-white shadow-sm"
        >
          &larr; Home
        </button>
      </div>

      <VideoAccordion videoId="JKC5t2boVK4" title="🎥 Video: Come indagare le Cause Profonde" />

      <InfoBox className="bg-indigo-50 border-indigo-200 text-indigo-950">
        <p className="text-sm">
          Questa sezione è dedicata alla <strong>Fase 2 (Approfondimenti)</strong> del tuo percorso. 
          Usa questi strumenti solo dopo aver completato la <em>Fotografia Iniziale</em> o quando senti il bisogno di indagare un evento specifico emerso durante la lettura del libro.
        </p>
      </InfoBox>

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => {
          const isDone = !!completedTests[item.id];
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full p-5 rounded-2xl text-left transition-all duration-300 border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:shadow-lg ${
                isDone 
                  ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400' 
                  : 'bg-white border-slate-200 hover:border-indigo-400'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border ${
                  isDone ? 'bg-emerald-100 border-emerald-200' : 'bg-slate-50 border-slate-100'
                } group-hover:scale-105 transition-transform`}>
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-slate-900">{item.title}</h3>
                    {isDone && <span className="text-emerald-600 font-bold">✓</span>}
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{item.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.details}</p>
                </div>
              </div>
              <div className="self-end sm:self-center">
                <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  isDone 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-indigo-600 text-white group-hover:bg-indigo-700'
                }`}>
                  {isDone ? 'Ripeti Indagine' : 'Inizia Ora'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 text-center">
        <p className="text-sm text-slate-600 italic">
          "Ogni emozione bloccata ha una radice nel passato che attende solo di essere riconosciuta."
        </p>
      </div>
    </div>
  );
};

export default RicercaCause;
