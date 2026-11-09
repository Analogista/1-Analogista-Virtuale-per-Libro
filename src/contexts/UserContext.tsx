
import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { UserData, UserContextType } from '../types';

const initialUserData: UserData = {
  nome: '',
  eta: '',
  genere: '',
  problema: '',
  testInduttore: { manoDestra: '', manoSinistra: '' },
  induttoreResult: '',
  testNome: { nomeVero: '', nomeFalso: '' },
  puntiDistonici: {
    famiglia: '',
    sentimentali: '',
    sessuali: '',
    autorealizzazione: '',
  },
  puntoDistonicoFinale: '',
  sigilli: {
    colpa: '',
    abbandono: '',
    disistima: '',
    giudizio: '',
  },
  sigilloFinale: '',
  timeLine: {
    etaEventoCausa: '',
  },
  testimoneChiave: '',
  giornoEvento: '',
  giustificatoTorto: '',
  completedTests: {},
  aiSummary: '',
  hasContactedMax: false,
  liveChatHistory: [],
};

// Estendiamo l'interfaccia context per includere resetUserData
export interface ExtendedUserContextType extends UserContextType {
    resetUserData: () => void;
}

export const UserContext = createContext<ExtendedUserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(() => {
    try {
      const savedData = localStorage.getItem('userData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return { ...initialUserData, ...parsedData };
      }
    } catch (error) {
      console.error("Failed to parse userData from localStorage", error);
    }
    return initialUserData;
  });

  const [isAudioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save userData to localStorage", error);
    }
  }, [userData]);

  const resetUserData = () => {
      setUserData(initialUserData);
      localStorage.removeItem('userData');
      localStorage.removeItem('wizardStep');
      setAudioEnabled(false);
  };

  // FIX CRUCIALE: useMemo impedisce la ricreazione dell'oggetto context ad ogni render (es. digitazione)
  const contextValue = useMemo(() => ({ 
      userData, 
      setUserData, 
      resetUserData,
      isAudioEnabled,
      setAudioEnabled
  }), [userData, isAudioEnabled]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): ExtendedUserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
