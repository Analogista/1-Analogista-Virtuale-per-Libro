
import React from 'react';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

const LaTecnica: React.FC<ScreenProps> = ({ setPage }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">3) Come Posizionarsi</h2>
          <h3 className="text-sm font-semibold text-blue-700">Postura, inquadratura corretta e avvertenze di sicurezza</h3>
        </div>
        <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
      </div>

      {/* AVVERTENZE DI SICUREZZA */}
      <div className="mb-6 p-4 sm:p-5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-sm space-y-2">
        <h4 className="font-bold text-base flex items-center gap-2 text-amber-900">
          <span>⚠️</span> Avvertenze di sicurezza prima di iniziare
        </h4>
        <ul className="list-disc list-inside text-sm space-y-1.5 text-amber-950">
          <li>Esegui i test <strong>in piedi</strong>, vicino a una <strong>parete</strong> o con una <strong>sedia alle spalle</strong> per maggiore appoggio e stabilità.</li>
          <li><strong>Non eseguire i test in caso di vertigini o problemi di equilibrio.</strong></li>
          <li>Esegui i test <strong>solo su di te</strong>, mai su altre persone.</li>
          <li>Puoi <strong>fermarti quando vuoi</strong> in qualsiasi momento della sessione.</li>
          <li><strong>Sintomi e malattie vanno sempre portati al medico</strong>; il test <strong>non è una diagnosi</strong>.</li>
        </ul>
      </div>

      <div className="space-y-4 text-gray-700">
        <p className="text-justify">Il nostro inconscio è la "scatola nera" della nostra vita. Come un Hard-Disk registra ogni emozione e ogni evento significativo, come file di un PC, soprattutto quelli che la mente conscia ha dimenticato o rimosso. Attraverso il dialogo analogico, interroghiamo il corpo per ottenere risposte dirette e sincere. Questa tecnica sfrutta il linguaggio del corpo che, è risaputo, è il linguaggio dell'inconscio. Oscillare col corpo in avanti o indietro, piuttosto che fare un passo in avanti o indietro significa: SI/MI PIACE/E' VERO (Avanti), NO/NON MI PIACE/NON E' VERO (indietro).</p>
        
        <p className="p-2 rounded-lg bg-[#57bfbf] text-[#0f4bec] text-center">Useremo una telecamera per rilevare le tue oscillazioni corporee involontarie. Un movimento in avanti indica un "SÌ" emotivo, mentre un movimento all'indietro indica un "NO". Se la prima volta ti sembrerà di non oscillare affatto, con un pò di pratica ed esercizio andrà meglio.</p>
        
        <div className="flex justify-center my-6">
            <img 
                src="/assets/1esempioposizione.webp" 
                alt="Esempio posizione" 
                className="w-full max-w-md rounded-xl shadow-lg border-4 border-white"
            />
        </div>

        {/* Immagine Posizione */}
        <div className="flex justify-center my-6">
            <img 
                src="/assets/1posizioneschermo.webp" 
                alt="Esempio posizione e oscillazione" 
                className="w-full max-w-md rounded-xl shadow-lg border-4 border-white"
            />
        </div>

        <p className="p-4 rounded-xl text-[#cd1736] bg-[#98c4ed] text-center">
          <span className="font-black block mb-1 uppercase tracking-widest text-center">IMPORTANTE</span>
          Nei vari test non dovrai sforzarti a ricordare le domande che ti porrà la voce guida, lasciati cullare dal tuo inconscio. In base al tuo grado di "oscillazione", più o meno marcato, potrai regolare l'intensità della rilevazione ad ogni "calibrazione" dei vari test. Con un pò di pratica oscillerai sempre più marcatamente.
        </p>
      </div>

      <div className="my-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-2 text-center">PER IL TEST INDUTTORE</h4>
        <div className="relative w-full overflow-hidden rounded-lg shadow-lg" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/qeS_LeG--jA"
            title="Per il test induttore"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
        <p className="text-sm text-[#dc0f0f] mt-3 text-center font-medium">Guarda questo video per capire come posizionarti per il test induttore.</p>
      </div>

      <div className="my-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-2 text-center">Video Esempio</h4>
        <div className="relative w-full overflow-hidden rounded-lg shadow-lg" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/KYCnANJJxZQ"
            title="Esempio risposta inconscio"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
        <p className="text-sm text-[#dc0f0f] mt-3 text-center font-medium">Guarda questo video per vedere un esempio di come l'inconscio risponde alle mie domande.</p>
      </div>
      

      <div className="mt-8 text-right">
        <button
          onClick={() => setPage('chiSei')}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Prosegui
        </button>
      </div>
    </div>
  );
};

export default LaTecnica;
