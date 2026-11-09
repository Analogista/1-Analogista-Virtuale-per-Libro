
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// ==================================================================================
// ⚠️ CONFIGURAZIONE API KEY (MODALITÀ "BRING YOUR OWN KEY" FORZATA)
// ==================================================================================
// Per obbligare OGNI utente (incluso te sul sito pubblico) ad inserire la propria chiave,
// abbiamo disabilitato il caricamento automatico dalle variabili d'ambiente.
// ==================================================================================

const HARDCODED_API_KEY = ""; 

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  hasApiKey: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    // 1. Controllo Local Storage (Se l'utente l'ha già inserita in passato sul suo browser, la manteniamo)
    const stored = localStorage.getItem('GOOGLE_API_KEY');
    if (stored) return stored;

    // 2. Controllo integrazione Google AI Studio (Utile solo mentre sviluppi nell'editor, non in produzione)
    const win = window as any;
    if (win.aistudio && win.aistudio.selectedApiKey) {
         return win.aistudio.selectedApiKey;
    }

    // 3. DISABILITATO: Controllo Variabili d'Ambiente
    // Abbiamo commentato queste righe per evitare che il server inietti automaticamente 
    // la TUA chiave nel deploy pubblico. Ora l'app partirà sempre "vuota".
    
    // if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
    // if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    // if (process.env.API_KEY) return process.env.API_KEY;
    
    // 4. Fallback: Chiave Hardcodata (Vuota)
    if (HARDCODED_API_KEY) return HARDCODED_API_KEY;

    return '';
  });

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (key) {
        localStorage.setItem('GOOGLE_API_KEY', key);
    }
  };

  useEffect(() => {
    // Se abbiamo una chiave attiva, assicuriamoci che sia nel localStorage per i servizi non-React
    if (apiKey) {
        localStorage.setItem('GOOGLE_API_KEY', apiKey);
    }
  }, [apiKey]);

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, hasApiKey: !!apiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
