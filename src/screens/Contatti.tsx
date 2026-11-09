
import React from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

interface ScreenProps {
  setPage?: (page: number) => void;
}

const Contatti: React.FC<ScreenProps> = ({ setPage }) => {
  const { setUserData, resetUserData } = useUser();
  const { setHeader } = useHeader();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Header managed centrally in App.tsx
  }, []);

  const handleWhatsAppContact = () => {
    setUserData(prev => ({ ...prev, hasContactedMax: true }));
    const message = encodeURIComponent("Ciao Max, ho completato il test sull'app Analogista Virtuale e vorrei richiedere la consulenza gratuita.");
    window.open(`https://wa.me/393313688666?text=${message}`, '_blank');
  };
  
  const handleNewAnalysis = () => {
      if (window.confirm("Sei sicuro? Questo cancellerà tutti i tuoi dati attuali e ripartirai da zero.")) {
          resetUserData();
          navigate('/'); // Ritorna alla dashboard
          window.location.reload(); // Forza reload per pulire stati locali
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Contatta Max Pisani</h2>
      
      {/* Immagine Profilo Aggiunta - Ingrandita */}
      <div className="flex justify-center mb-6">
        <img 
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663028268770/LWvcVyoodRZhsySQ.jpg" 
            alt="Max Pisani" 
            className="w-72 h-auto rounded-xl shadow-lg border-4 border-white object-cover"
        />
      </div>

      <div className="text-center mb-8">
          <p className="text-lg text-gray-600 mb-4">Acquista i libri di Max Pisani per approfondire le Discipline Analogiche.</p>
          <a href="https://www.amazon.it/stores/Massimo-Pisani/author/B01MYDKZEP" target="_blank" rel="noopener noreferrer" className="inline-block bg-yellow-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-yellow-600 transition duration-300 text-lg shadow-md">
            Disponibili su Amazon &rarr;
          </a>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
        <h4 className="text-xl font-bold text-blue-800">Richiedi subito l'incontro GRATUITO in video call con Max Pisani</h4>
        <p className="text-blue-700 my-3">Hai completato i test e desideri un supporto professionale per approfondire i risultati? Contatta direttamente Max Pisani per una consulenza personalizzata gratuita.</p>
        <button
          onClick={handleWhatsAppContact}
          className="bg-green-500 text-white font-bold py-3 px-8 rounded-full hover:bg-green-600 transition duration-300 inline-flex items-center text-lg shadow-lg"
        >
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.388 1.88 6.161l-1.36 4.945 5.064-1.327z"/></svg>
          Contatta su WhatsApp
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-center font-bold text-gray-700 mb-4">Altre Opzioni</h4>
          <div className="flex justify-center">
              <button 
                onClick={handleNewAnalysis}
                className="text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 font-bold py-2 px-6 rounded-lg transition duration-300 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Cancella Dati e Nuova Analisi
              </button>
          </div>
      </div>

      <div className="mt-8 text-sm text-gray-600 border-t pt-4">
        <h4 className="font-bold text-gray-800 mb-2">Informazioni di contatto & Copyright</h4>
        <p><strong>Analogista:</strong> Massimo Pisani</p>
        <p><strong>Email:</strong> analogistabrindisi@gmail.com</p>
        <p><strong>Telefono:</strong> +39 331 368 8666</p>
        <p><strong>Orari:</strong> Lunedì-Venerdì, 9:00-18:00</p>
        <p className="mt-3 text-xs text-gray-500 font-semibold border-t pt-2">© 2026 Max Pisani - PACommunication. Tutti i diritti riservati.</p>
      </div>
    </div>
  );
};

export default Contatti;
