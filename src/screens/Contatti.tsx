import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

interface ScreenProps {
  setPage?: (page: number) => void;
}

const Contatti: React.FC<ScreenProps> = ({ setPage }) => {
  const { setUserData, resetUserData } = useUser();
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleGoHome = () => {
    if (setPage) {
      setPage(0);
    } else {
      navigate('/');
    }
  };

  const handleWhatsAppContact = () => {
    setUserData(prev => ({ ...prev, hasContactedMax: true }));
    const message = encodeURIComponent("Ciao Max, ho completato il test sull'app Analogista Virtuale e vorrei richiedere la consulenza gratuita.");
    window.open(`https://wa.me/393313688666?text=${message}`, '_blank');
  };

  const confirmResetData = () => {
    resetUserData();
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={handleGoHome}
            className="self-start text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 border border-gray-300 px-3.5 py-2 rounded-xl transition bg-white shadow-2xs"
          >
            &larr; Torna alla Home
          </button>
          <h2 className="text-2xl font-serif font-bold text-gray-900 text-left sm:text-center flex-1">
            Contatta Max Pisani
          </h2>
          <div className="hidden sm:block w-32"></div>
        </div>

        {/* Immagine Profilo */}
        <div className="flex justify-center">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663028268770/LWvcVyoodRZhsySQ.jpg"
            alt="Max Pisani"
            className="w-full max-w-[260px] sm:max-w-xs h-auto rounded-xl shadow-md border-4 border-white object-cover"
          />
        </div>

        {/* Consulenza gratuita */}
        <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl text-center space-y-3">
          <h3 className="text-lg sm:text-xl font-bold text-blue-900">
            Incontro gratuito in videochiamata con Max Pisani
          </h3>
          <p className="text-sm text-blue-800 leading-relaxed max-w-xl mx-auto">
            Hai completato i test e desideri chiarimenti sui risultati? Scrivimi su WhatsApp per fissare un incontro conoscitivo gratuito.
          </p>
          <button
            type="button"
            onClick={handleWhatsAppContact}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-7 rounded-full transition duration-300 inline-flex items-center justify-center text-base shadow-md"
          >
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.388 1.88 6.161l-1.36 4.945 5.064-1.327z"/></svg>
            <span>Contatta su WhatsApp</span>
          </button>
        </div>

        {/* Libri */}
        <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-xl text-center space-y-3">
          <p className="text-sm sm:text-base text-gray-700 font-medium">
            Vuoi approfondire le Discipline Analogiche con i libri di Max Pisani?
          </p>
          <a
            href="https://www.amazon.it/stores/Massimo-Pisani/author/B01MYDKZEP"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-7 rounded-xl transition duration-300 text-sm sm:text-base shadow-sm"
          >
            Vedi i libri su Amazon &rarr;
          </a>
        </div>

        {/* Recapiti */}
        <div className="text-sm text-gray-600 border-t border-slate-100 pt-4 space-y-1">
          <h4 className="font-bold text-gray-800 mb-2">Informazioni di contatto</h4>
          <p><strong>Analogista:</strong> Massimo Pisani</p>
          <p className="break-all"><strong>Email:</strong> analogistabrindisi@gmail.com</p>
          <p><strong>Telefono:</strong> +39 331 368 8666</p>
          <p><strong>Orari:</strong> Lunedì-Venerdì, 9:00-18:00</p>
          <p className="mt-3 text-xs text-gray-500 font-semibold border-t border-slate-100 pt-2">
            © 2026 Max Pisani - PACommunication. Tutti i diritti riservati.
          </p>
        </div>
      </div>

      {/* AREA SEPARATA: CANCELLA DATI E NUOVA ANALISI */}
      <section className="bg-red-50/60 border-2 border-red-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div>
          <h3 className="font-bold text-base text-red-900">Gestione dati sul dispositivo</h3>
          <p className="text-xs sm:text-sm text-red-800 mt-0.5 leading-relaxed">
            Se vuoi azzerare i dati inseriti e ripetere tutto il percorso dall’inizio, puoi cancellare i dati salvati in questo browser.
          </p>
        </div>

        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="w-full sm:w-auto text-red-700 border border-red-300 bg-white hover:bg-red-100 font-bold py-2.5 px-5 rounded-xl transition text-sm inline-flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Cancella dati e nuova analisi</span>
          </button>
        ) : (
          <div className="bg-white border border-red-300 rounded-xl p-4 space-y-3 animate-fadeIn">
            <p className="text-sm font-semibold text-red-900 leading-snug">
              Confermi di voler cancellare tutti i dati e i test attuali? Ripartirai da zero.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={confirmResetData}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl transition text-sm"
              >
                Sì, cancella e ricomincia
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-5 rounded-xl transition text-sm"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Contatti;
