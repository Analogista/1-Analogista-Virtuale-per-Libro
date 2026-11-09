
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface HeaderContextType {
  title: string;
  subtitle: string | null;
  isProMode: boolean;
  setHeader: (title: string, subtitle?: string | null) => void;
  setProMode: (active: boolean) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [title, setTitle] = useState('Analogista Virtuale di Max Pisani');
  const [subtitle, setSubtitle] = useState<string | null>('© 2026 Max Pisani - PACommunication. Tutti i diritti riservati.');
  const [isProMode, setIsProMode] = useState(false);

  const setHeader = (newTitle: string, newSubtitle: string | null = null) => {
    setTitle(newTitle);
    setSubtitle(newSubtitle);
  };

  const setProMode = (active: boolean) => {
    setIsProMode(active);
  };

  return (
    <HeaderContext.Provider value={{ title, subtitle, isProMode, setHeader, setProMode }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = (): HeaderContextType => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};
