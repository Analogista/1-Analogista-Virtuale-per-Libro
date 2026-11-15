import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { Calendar, User, Clock, ChevronRight, FileText, ShieldAlert, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface SavedSession {
  id: string;
  userId: string;
  userName: string;
  createdAt: Timestamp;
  status: string;
  data: any;
}

const History: React.FC = () => {
  const { user, isAdmin, loginWithGoogle } = useAuth();
  const { setUserData } = useUser();
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let q;
        if (isAdmin) {
          // Admin sees EVERYTHING
          q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'));
        } else {
          // Normal user sees only theirs
          q = query(
            collection(db, 'sessions'), 
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
        }

        const querySnapshot = await getDocs(q);
        const fetchedSessions: SavedSession[] = [];
        querySnapshot.forEach((doc) => {
          fetchedSessions.push({ id: doc.id, ...(doc.data() as any) } as SavedSession);
        });
        setSessions(fetchedSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        handleFirestoreError(error, OperationType.LIST, 'sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user, isAdmin]);

  const loadSession = (session: SavedSession) => {
    setUserData(session.data);
    navigate('/risultati');
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-8">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 border border-gray-300 px-3.5 py-2 rounded-xl transition bg-white shadow-2xs"
          >
            &larr; Torna alla Home
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <ShieldAlert className="text-blue-600 w-10 h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Accesso richiesto</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md leading-relaxed">
            Accedi con il tuo account Google per vedere le analisi salvate in precedenza.
          </p>
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow transition text-sm sm:text-base"
          >
            <LogIn size={18} />
            <span>Accedi</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 overflow-x-hidden">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 border border-gray-300 px-3.5 py-2 rounded-xl transition bg-white shadow-2xs"
        >
          &larr; Torna alla Home
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Storico Sessioni</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {isAdmin ? "Pannello Amministratore • Tutte le sessioni" : "Le tue analisi salvate"}
          </p>
        </div>
        {isAdmin && (
           <div className="self-start sm:self-center bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100 flex items-center gap-1">
             <ShieldAlert size={12} /> ADMIN MODE
           </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Nessuna sessione trovata</h3>
          <p className="text-gray-500 mt-2">Le sessioni salvate appariranno qui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => loadSession(session)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h4 className="font-bold text-gray-900">
                         {session.userName || "Paziente Anonimo"}
                       </h4>
                       {isAdmin && (
                         <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                           UID: {session.userId.substring(0, 5)}...
                         </span>
                       )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        {session.createdAt?.toDate().toLocaleString('it-IT')}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User size={12} />
                        {session.data.sigilloFinale || "N/D"}
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="mt-12 p-6 bg-slate-900 text-white rounded-2xl shadow-xl">
           <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
             <ShieldAlert className="text-red-500" /> Pannello Riservato
           </h3>
           <p className="text-slate-400 text-sm mb-4">
             Solo <span className="text-white underline">analogistabrindisi@gmail.com</span> può visualizzare questo pannello.
             Qui vengono archiviati tutti i test effettuati dagli utenti per analisi professionale.
           </p>
           <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-4">
             Analogista Pro Dashboard • Riservato ad uso professionale
           </div>
        </div>
      )}
    </div>
  );
};

export default History;
