
/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { HeaderProvider, useHeader } from './contexts/HeaderContext';
import { ApiKeyProvider } from './contexts/ApiKeyContext';
import { AuthProvider } from './contexts/AuthContext';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './screens/Dashboard';
import Risultati from './screens/Risultati';
import Contatti from './screens/Contatti';
import VideoCorso from './screens/LiveChat';
import History from './screens/History';
import WelcomeBanner from './components/WelcomeBanner';

import { AuthGate } from './components/AuthGate';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ApiKeyProvider>
        <UserProvider>
          <HeaderProvider>
            <AuthGate>
              <AppContent />
            </AuthGate>
            <Toaster position="top-center" />
          </HeaderProvider>
        </UserProvider>
      </ApiKeyProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const { isProMode, setHeader, setProMode } = useHeader();
  const location = useLocation();
  
  // Gestione centralizzata degli header per evitare stati inconsistenti tra le rotte
  React.useEffect(() => {
    const path = location.pathname;
    
    // Non aggiorniamo l'header se siamo in Pro Mode (test attivo) perché lo gestisce il test stesso
    if (isProMode) return;

    switch (path) {
      case '/':
        setHeader('Analogista Virtuale di Max Pisani', '© 2026 Max Pisani - PACommunication. Tutti i diritti riservati.');
        setProMode(false);
        break;
      case '/risultati':
        setHeader('Risultati Analisi', 'Il tuo profilo analogico completo');
        break;
      case '/chat':
        setHeader('Video Corso', 'Approfondimenti sulle Discipline Analogiche');
        break;
      case '/history':
        setHeader('Storico Sessioni', 'Le tue analisi salvate');
        break;
      case '/contatti':
        setHeader('Contatti', 'Richiedi una consulenza professionale');
        break;
      default:
        break;
    }
  }, [location.pathname, isProMode, setHeader, setProMode]);
  
  return (
    <>
      {/* Banner Iniziale Importante */}
      {showWelcome && !isProMode && <WelcomeBanner onClose={() => setShowWelcome(false)} />}

      {/* Wrapper Esterno: Gradiente standard o Dark Mode Pro */}
      <div className={`min-h-screen font-sans transition-colors duration-500 ease-in-out ${
        isProMode ? 'bg-[#0a0a0c] text-white' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-800'
      }`}>
        
        {/* Contenitore Principale App */}
        <div className={`max-w-4xl mx-auto min-h-screen relative z-10 flex flex-col transition-all duration-500 ${
          isProMode ? 'bg-[#0a0a0c]' : 'shadow-2xl border-x border-white/50 bg-white/90 backdrop-blur-sm'
        }`}>
          {!isProMode && <Header />}
          {!isProMode && <BottomNav />}
          
          {/* Content Area */}
          <main className={`flex-1 ${isProMode ? 'p-0' : 'p-3 sm:p-6'} transition-all duration-300 ease-in-out`}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/risultati" element={<Risultati />} />
              <Route path="/chat" element={<VideoCorso />} />
              <Route path="/history" element={<History />} />
              <Route path="/contatti" element={<Contatti />} />
            </Routes>
          </main>

          {/* Legal Copyright Footer */}
          {!isProMode && (
            <footer className="py-4 text-center text-xs text-gray-500 border-t border-gray-200/80 bg-slate-50/80 px-4">
              <p>© 2026 Max Pisani - PACommunication. Tutti i diritti riservati.</p>
            </footer>
          )}
        </div>
      </div>
    </>
  );
};

export default App;