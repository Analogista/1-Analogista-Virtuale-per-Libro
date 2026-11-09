import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ArrowLeft, Loader2, Star, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useHeader } from '../contexts/HeaderContext';

interface AdminFeedbackProps {
  setPage: (page: number | string) => void;
}

interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  ratingOscillation: number;
  ratingQuestions: number;
  ratingFunctions: number;
  ratingMethod: number;
  deviceType: string;
  os: string;
  browser: string;
  openFeedback: string;
  createdAt: any;
}

const AdminFeedback: React.FC<AdminFeedbackProps> = ({ setPage }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { setHeader } = useHeader();

  useEffect(() => {
    setHeader('Feedback degli Utenti', 'Area Riservata');
  }, [setHeader]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fbData: Feedback[] = [];
        querySnapshot.forEach((doc) => {
          fbData.push({ id: doc.id, ...doc.data() } as Feedback);
        });
        setFeedbacks(fbData);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const getDeviceIcon = (device: string) => {
    if (device === 'Smartphone') return <Smartphone size={16} className="text-gray-500" />;
    if (device === 'Tablet') return <Tablet size={16} className="text-gray-500" />;
    return <Monitor size={16} className="text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[500px]">
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={() => setPage('dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium text-sm"
        >
          <ArrowLeft size={16} />
          Torna alla Dashboard
        </button>
        <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
          {feedbacks.length} Feedback Ricevuti
        </span>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>Caricamento feedback in corso...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">Nessun feedback ricevuto finora.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between mb-4 pb-4 border-b border-gray-200 gap-4">
                  <div>
                    <h4 className="font-bold text-gray-800">{fb.userEmail || 'Utente Anonimo'}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {fb.createdAt?.toDate ? fb.createdAt.toDate().toLocaleString('it-IT') : 'Data non disponibile'}
                    </p>
                  </div>
                  
                  {(fb.deviceType || fb.os || fb.browser) && (
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm text-xs text-gray-600">
                      {fb.deviceType && (
                        <div className="flex items-center gap-1.5" title="Dispositivo">
                          {getDeviceIcon(fb.deviceType)}
                          <span className="font-medium">{fb.deviceType}</span>
                        </div>
                      )}
                      {fb.os && (
                        <>
                          <div className="w-px h-4 bg-gray-200"></div>
                          <span title="Sistema Operativo">{fb.os}</span>
                        </>
                      )}
                      {fb.browser && (
                        <>
                          <div className="w-px h-4 bg-gray-200"></div>
                          <span title="Browser">{fb.browser}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  <div className="bg-white p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Oscillazione</span>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <span className="text-lg font-bold text-gray-800 mr-1">{fb.ratingOscillation}</span>
                      <Star size={14} className="fill-current" />
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Domande/Test</span>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <span className="text-lg font-bold text-gray-800 mr-1">{fb.ratingQuestions}</span>
                      <Star size={14} className="fill-current" />
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Funzionalità</span>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <span className="text-lg font-bold text-gray-800 mr-1">{fb.ratingFunctions}</span>
                      <Star size={14} className="fill-current" />
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Metodo</span>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <span className="text-lg font-bold text-gray-800 mr-1">{fb.ratingMethod}</span>
                      <Star size={14} className="fill-current" />
                    </div>
                  </div>
                </div>

                {fb.openFeedback && (
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Commento dell'utente</span>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap italic">"{fb.openFeedback}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
