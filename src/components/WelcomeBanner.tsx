import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const WelcomeBanner: React.FC<Props> = ({ onClose }) => {
  const { setAudioEnabled } = useUser();
  const [playAudio, setPlayAudio] = useState(false);

  const handleAccept = () => {
    // Abilita l'audio globale (richiesto dai browser per far partire i suoni successivi)
    setAudioEnabled(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm overflow-y-auto" id="welcome-banner-overlay">
      {/* YouTube Audio Ambient - Caricato solo se l'utente clicca */}
      {playAudio && (
        <div className="fixed top-[-1000px] left-[-1000px] pointer-events-none opacity-0 invisible" id="youtube-audio-container">
          <iframe 
            width="100" 
            height="100" 
            src="https://www.youtube.com/embed/YjgI7FRy0HM?start=447&autoplay=1&loop=1&playlist=YjgI7FRy0HM&mute=0" 
            title="Stefano Benemeglio Audio" 
            allow="autoplay"
          ></iframe>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border-4 border-yellow-500 my-auto" id="welcome-banner-container">
         
         {/* Testata Gialla */}
         <div className="bg-yellow-500 p-5 text-center border-b-4 border-yellow-600" id="welcome-banner-header">
            <h1 className="h-[42px] text-[23px] leading-[35px] font-black text-white uppercase tracking-wider drop-shadow-md font-serif">
               ⚠️ ATTENZIONE ⚠️
            </h1>
         </div>

         {/* Contenuto Principale */}
         <div className="p-6 sm:p-8 space-y-8 text-center" id="welcome-banner-content">
            
            {/* Audio Toggle in Banner */}
            <div className="flex justify-center">
                <button 
                    onClick={() => setPlayAudio(!playAudio)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        playAudio 
                        ? 'bg-blue-600 text-white shadow-inner' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                >
                    {playAudio ? <Volume2 size={18} /> : <Play size={18} />}
                    {playAudio ? 'VOCE DI S.BENEMEGLIO' : 'Attiva Audio Sottofondo'}
                </button>
            </div>

            {/* Disclaimer Medico (Rosso) */}
            <div className="bg-red-50 p-6 rounded-xl border-l-8 border-red-600 shadow-sm" id="medical-disclaimer">
               <p className="text-lg sm:text-2xl font-black text-red-700 leading-tight uppercase font-sans">
                  Questa app non costituisce strumento di diagnosi o cura.
                  <br className="my-2" />
                  <span className="text-red-800 underline decoration-red-400">
                    È destinata esclusivamente a soggetti mentalmente stabili.
                  </span>
               </p>
            </div>

            <hr className="border-gray-200" />

            {/* Istruzione Fondamentale (Blu) */}
            <div className="bg-blue-50 p-6 rounded-xl border-l-8 border-blue-600 shadow-sm" id="core-instruction">
               <p className="text-lg sm:text-xl font-bold text-gray-800 leading-relaxed font-sans">
                  <span className="text-blue-600 font-black text-xl block mb-2">ISTRUZIONE FONDAMENTALE</span>
                  IMPORTANTE: per eseguire i Test correttamente (tranne che per il Test Calibrazione), durante i test
                  <span className="block text-[17px] font-black text-[#860707] uppercase my-4 bg-blue-100 p-4 rounded transform -rotate-1 shadow-sm border border-blue-200 leading-tight">
                     NON DOVRAI OSCILLARE VOLONTARIAMENTE.
                  </span>
                  L'oscillazione del tuo corpo deve avvenire <span className="italic font-black text-blue-700">spontaneamente</span> in risposta alle domande.
               </p>
            </div>

            {/* Pulsante di Accettazione */}
            <button
              id="welcome-banner-accept-button"
              onClick={handleAccept}
              className="w-full bg-slate-800 hover:bg-black text-white font-bold py-5 px-8 rounded-xl text-xl sm:text-2xl transition-all hover:scale-[1.02] shadow-xl border-b-4 border-slate-600 active:border-b-0 active:translate-y-1 uppercase tracking-wide"
            >
              Ho capito e Accetto
            </button>
         </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
