/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React from 'react';
import { useUser } from '../contexts/UserContext';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

const ApprofondimentiScreen: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData } = useUser();

  const sections = [
    {
      id: 'indagineSingola',
      title: '1. Indietro nel Tempo',
      description: 'Grande Indagine completa per individuare l\'evento causa.',
      icon: '⏳'
    },
    {
      id: 'qualeGiorno',
      title: '2. Test Quale Giorno',
      description: 'Ricerca la stagione, il mese e la data esatta dell\'evento.',
      icon: '📅'
    },
    {
      id: 'testimone',
      title: '3. Testimone & Torto',
      description: 'Identifica la figura di riferimento e la tua reazione emotiva.',
      icon: '👤'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-100 animate-fadeIn">
      <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 mb-1">
            Fase 2 del Percorso
          </span>
          <h2 className="text-2xl font-serif font-black text-gray-900 leading-tight">Approfondimenti sull'Evento</h2>
          <p className="text-sm text-slate-600 mt-1">Esplora le radici del tuo blocco emotivo attraverso indagini specifiche.</p>
        </div>
        <button
          onClick={() => setPage(0)}
          className="text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          &larr; Home
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {sections.map((s) => {
          const isDone = !!userData.completedTests?.[s.id];
          return (
            <button
              key={s.id}
              onClick={() => setPage(s.id)}
              className={`p-5 rounded-2xl text-left border-2 transition-all group hover:shadow-lg flex flex-col h-full ${
                isDone 
                  ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50' 
                  : 'bg-white border-slate-200 hover:border-indigo-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl p-2.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform">
                  {s.icon}
                </span>
                {isDone && <span className="text-emerald-600 font-bold text-xl">✓</span>}
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-2 leading-tight">{s.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-grow">{s.description}</p>
              <div className="mt-4 flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                {isDone ? 'Ripeti Indagine' : 'Inizia Ora'} &rarr;
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
          <span>📖</span> Consiglio di lettura
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          Questi test sono pensati per essere eseguiti quando la lettura del libro richiama un particolare evento del passato. 
          Assicurati di aver completato la <strong>Fotografia Iniziale (Fase 1)</strong> per avere un quadro chiaro delle tue dinamiche emotive prima di procedere.
        </p>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
         <button
          onClick={() => setPage(0)}
          className="bg-slate-900 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-slate-800 transition shadow-md uppercase tracking-widest text-xs"
        >
          Torna alla Home
        </button>
      </div>
    </div>
  );
};

export default ApprofondimentiScreen;
