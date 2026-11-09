
import React from 'react';
import InfoBox from '../components/InfoBox';
import VideoAccordion from '../components/VideoAccordion';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

const Introduzione: React.FC<ScreenProps> = ({ setPage }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">2) Introduzione</h2>
          <h3 className="text-lg font-semibold text-gray-600">Le Discipline Analogiche di Stefano Benemeglio. Raccontate da Lui stesso.</h3>
        </div>
        <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
      </div>

      {/* VIDEO INTRODUZIONE YOUTUBE */}
      <VideoAccordion videoId="-cye06MYXBc" title="🎥 Video: Introduzione alle Discipline Analogiche" />

      <p className="text-gray-700 mb-4">Benvenuto! Questa app è un "Analogista Virtuale". Il suo scopo è aiutarti a scoprire le cause profonde dei tuoi disagi attraverso un dialogo diretto con il tuo inconscio.</p>

      <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3">Ecco il percorso che faremo insieme:</h3>
      <p className="text-gray-700 mb-4">L'app ti guiderà in un dialogo strutturato con la tua parte più profonda. Segui le istruzioni vocali e lascia che il tuo corpo risponda istintivamente. Il nostro viaggio si dividerà in quattro fasi fondamentali:</p>

      <div className="space-y-4 text-gray-700">
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-gray-800">Fase 1: Conoscenza e Calibrazione</h4>
            <p className="text-sm mt-1">Stabiliremo un canale di comunicazione chiaro. Inserirai i tuoi dati e, con test semplici come il <strong>Test Induttore</strong>, insegneremo all'app a riconoscere il "SÌ" e il "NO" del tuo inconscio. È come accordare uno strumento prima di suonare.</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-gray-800">Fase 2: Identificazione del Nodo Emotivo</h4>
            <p className="text-sm mt-1">Andremo al cuore del problema. Con il <strong>Test dei Punti Distonici</strong>, identificheremo l'area della tua vita che genera disagio (famiglia, autorealizzazione, etc.). Subito dopo, con il <strong>Test dei Sigilli</strong>, scopriremo la paura specifica (<em>Senso di colpa</em>, <em>Disistima</em>, etc.) legata a quel disagio.</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-gray-800">Fase 3: Viaggio nel Tempo alla Radice del Problema</h4>
            <p className="text-sm mt-1">Questa è la fase investigativa. Scoperto il blocco, viaggeremo indietro nel tempo per trovarne la causa, scoprendo:</p>
            <ul className="list-disc list-inside ml-4 mt-2 text-sm space-y-1">
                <li><strong>QUANDO</strong> è accaduto l'evento scatenante (l'età esatta).</li>
                <li><strong>CHI</strong> era il "testimone chiave" coinvolto.</li>
                <li><strong>IL GIORNO ESATTO</strong> in cui tutto è iniziato.</li>
            </ul>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-gray-800">Fase 4: La Chiave della Tua Reazione</h4>
            <p className="text-sm mt-1">Faremo la domanda più importante: scopriremo <strong>COME</strong> hai reagito a quell'evento passato, ovvero se hai "giustificato" o "non giustificato" il torto subito. Questa risposta svela la natura profonda del tuo blocco attuale.</p>
        </div>
      </div>
      
      <p className="text-gray-700 mt-4 font-semibold">Al termine, avrai una mappa completa delle dinamiche emotive che ti condizionano, pronta per essere analizzata e risolta.</p>
      
      <InfoBox className="mt-6 border-indigo-500 bg-indigo-50 text-indigo-900">
        <h3 className="font-bold flex items-center gap-2">
            {/* Icona Video identica a BottomNav */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Video Corso di Approfondimento
        </h3>
        <p className="text-sm mt-1">
            Ricorda che puoi usare la funzione <strong>"Video Corso"</strong> (nel menu in alto) per accedere a tutti gli approfondimenti video sulle Discipline Analogiche. 
            È una risorsa fondamentale per comprendere meglio ogni passaggio del tuo percorso.
        </p>
      </InfoBox>

      <InfoBox variant="warning" className="!my-0 mt-6">
        <h3 className="font-bold">Attenzione:</h3>
        <p className="text-sm">Questa applicazione è uno strumento di auto-esplorazione e non sostituisce in alcun modo il parere di un medico o di un professionista della salute mentale. I risultati sono da intendersi come spunti di riflessione personale.</p>
      </InfoBox>

      <div className="mt-8 text-right">
        <button
          onClick={() => setPage('laTecnica')}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Prosegui
        </button>
      </div>
    </div>
  );
};
export default Introduzione;
