
import React from 'react';
import InfoBox from '../components/InfoBox';
import VideoAccordion from '../components/VideoAccordion';

interface ScreenProps {
  setPage: (page: number | string) => void;
}

const ChiSono: React.FC<ScreenProps> = ({ setPage }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">1) Chi sono</h2>
          <h3 className="text-lg font-semibold text-gray-600">Max Pisani Analogista</h3>
        </div>
        <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
      </div>

      {/* VIDEO PRESENTAZIONE */}
      <VideoAccordion videoId="_f5Gzqt1_G8" title="🎥 Video: Chi sono e cosa faccio" />

      <div className="space-y-4 text-gray-700">
        <p>Sono Massimo Pisani, un Analogista dal 2007, professionista nel ramo olistico, autore di manuali di auto miglioramento (che puoi trovare nella pagina "contatti") e ricercatore appassionato delle Discipline Analogiche ideate da Stefano Benemeglio, il mio Maestro, alla cui memoria dedico questa App che simula la tecnica che utilizza l'Analogista.</p>
        
        {/* Immagine inserita come richiesto */}
        <div className="flex justify-center my-6">
            <img 
                src="/assets/ioebenny.webp" 
                alt="Max Pisani Analogista" 
                className="w-full max-w-md rounded-xl shadow-lg border-4 border-white"
            />
        </div>

        <p>La mia missione è guidare le persone in un viaggio di scoperta interiore, aiutandole a dialogare con il proprio inconscio, o istanza emotiva, per svelare e superare i blocchi emotivi che limitano il benessere e la felicità.</p>
        
        <p>Devi sapere che la tecnica che sperimenterai è la stessa che tanti anni fa mi ha salvato dal baratro grazie al Dott. S.Benemeglio. Da allora l'ho appresa e la utilizzo per aiutare chi si rivolge a me, anche in videocall. E' una tecnica che non ha controindicazioni e risolve velocemente.</p>
        
        <p>Sulla mia pagina ufficiale di facebook <strong>"PACommunication Brindisi"</strong>, troverai tante testimonianze/recensioni di chi si è rivolto a me.</p>
      </div>
      
      <InfoBox className="mt-6">
        <h3 className="font-bold mb-2">La mia filosofia</h3>
        <p>Credo fermamente che ogni individuo possieda le risorse interiori per risolvere i propri disagi. Il mio ruolo è quello di essere un "traduttore" del linguaggio emotivo, fornendo gli strumenti per accedere a queste risorse e promuovere un cambiamento profondo e duraturo.</p>
      </InfoBox>

      <div className="mt-8 text-right">
        <button
          onClick={() => setPage('introduzione')}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Prosegui
        </button>
      </div>
    </div>
  );
};
export default ChiSono;