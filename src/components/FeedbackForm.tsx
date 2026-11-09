import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Send, Loader2, Star } from 'lucide-react';

const StarRating = ({ rating, setRating, label }: { rating: number, setRating: (val: number) => void, label: string }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export const FeedbackForm: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingOscillation, setRatingOscillation] = useState<number>(0);
  const [ratingQuestions, setRatingQuestions] = useState<number>(0);
  const [ratingFunctions, setRatingFunctions] = useState<number>(0);
  const [ratingMethod, setRatingMethod] = useState<number>(0);
  const [deviceType, setDeviceType] = useState('');
  const [os, setOs] = useState('');
  const [browser, setBrowser] = useState('');
  const [openFeedback, setOpenFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!ratingOscillation || !ratingQuestions || !ratingFunctions || !ratingMethod) {
      toast.error('Per favore, compila tutti i campi di valutazione con le stelle prima di inviare.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        userEmail: user.email,
        ratingOscillation,
        ratingQuestions,
        ratingFunctions,
        ratingMethod,
        deviceType,
        os,
        browser,
        openFeedback,
        createdAt: serverTimestamp(),
      });
      
      toast.success('Feedback inviato con successo! Grazie per il tuo contributo.');
      
      // Reset form
      setRatingOscillation(0);
      setRatingQuestions(0);
      setRatingFunctions(0);
      setRatingMethod(0);
      setDeviceType('');
      setOs('');
      setBrowser('');
      setOpenFeedback('');
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error('Si è verificato un errore. Riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800">Lascia un Feedback (Fase Beta)</h3>
        <p className="text-sm text-gray-500 mt-1">
          Aiutaci a migliorare l'Analogista Virtuale. Valuta le funzioni principali e il metodo, e lascia un commento.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <StarRating 
            label="Rilevazione dell'Oscillazione (Fotocamera)" 
            rating={ratingOscillation} 
            setRating={setRatingOscillation} 
          />
          <StarRating 
            label="Domande e svolgimento dei Test" 
            rating={ratingQuestions} 
            setRating={setRatingQuestions} 
          />
          <StarRating 
            label="Funzionalità generali dell'App" 
            rating={ratingFunctions} 
            setRating={setRatingFunctions} 
          />
          <StarRating 
            label="Validità del Metodo proposto" 
            rating={ratingMethod} 
            setRating={setRatingMethod} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dispositivo</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            >
              <option value="">Seleziona...</option>
              <option value="PC/Mac">PC / Mac</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Tablet">Tablet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sistema Operativo</label>
            <select
              value={os}
              onChange={(e) => setOs(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            >
              <option value="">Seleziona...</option>
              <option value="Windows">Windows</option>
              <option value="macOS">macOS</option>
              <option value="iOS">iOS (iPhone/iPad)</option>
              <option value="Android">Android</option>
              <option value="Linux">Linux</option>
              <option value="Altro">Altro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Browser</label>
            <select
              value={browser}
              onChange={(e) => setBrowser(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            >
              <option value="">Seleziona...</option>
              <option value="Chrome">Chrome</option>
              <option value="Safari">Safari</option>
              <option value="Firefox">Firefox</option>
              <option value="Edge">Edge</option>
              <option value="Samsung Internet">Samsung Internet</option>
              <option value="Altro">Altro</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Suggerimenti, problemi riscontrati o commenti liberi (opzionale)
          </label>
          <textarea
            value={openFeedback}
            onChange={(e) => setOpenFeedback(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow resize-y"
            placeholder="Scrivi qui i tuoi consigli..."
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Invia Feedback
          </button>
        </div>
      </form>
    </div>
  );
};
