
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
        <p>Sono Massimo Pisani, un Analogista dal 2007, professionista nel ramo olistico, autore di manuali di auto miglioramento (che puoi trovare nella pagina "contatti") e ricercatore appassionato delle Discipline Analogiche ideate da Stefano Benemeglio, il mio Maestro. Questa App simula la tecnica che utilizza l'Analogista.</p>
        
        {/* Immagine inserita come richiesto */}
        <div className="flex justify-center my-6">
            <img 
                src="/assets/ioebenny.webp" 
                alt="Max Pisani Analogista" 
                className="w-full max-w-md rounded-xl shadow-lg border-4 border-white"
            />
        </div>

        <p>La mia missione è accompagnare le persone in un percorso di esplorazione interiore e ascolto delle proprie dinamiche emotive secondo le Discipline Analogiche.</p>
        
        <p>La tecnica analogica presentata in questa app nasce dagli studi di Stefano Benemeglio ed è lo strumento di autoconoscenza che applico anche nei miei percorsi individuali e nelle sessioni online per favorire consapevolezza emotiva e crescita personale.</p>
        
        <p>Sulla mia pagina ufficiale di facebook <strong>"PACommunication Brindisi"</strong>, troverai esperienze e testimonianze di chi ha scelto di intraprendere questo percorso.</p>
      </div>
      
      <InfoBox className="mt-6">
        <h3 className="font-bold mb-2">La mia filosofia</h3>
        <p>Credo che ogni persona possa imparare a leggere meglio il proprio linguaggio emotivo. Il mio ruolo è offrire una guida chiara per osservare le reazioni istintive e sviluppare maggiore consapevolezza delle proprie scelte.</p>
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