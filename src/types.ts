
// Fix: Import Dispatch and SetStateAction from react to correctly type setUserData
import type { Dispatch, SetStateAction } from 'react';

export interface UserData {
  nome: string;
  eta: string;
  genere: 'MASCHIO' | 'FEMMINA' | '';
  problema: string;
  testTAP?: {
    results: Record<'asta' | 'cerchio' | 'triangolo', 'SI' | 'NO' | 'NEUTRO' | 'NON_RILEVATO' | ''>;
    diagnosis: {
      isValid: boolean;
      tipologia: string;
      distonia: string;
      avanti: string;
      indietro: string;
      dinamica: string;
      profilo?: {
        famiglia: string;
        referente: string;
        origine: string;
        stile: string;
        relazioni: string;
        polarita: string;
        meccanismo: string;
        orientamento: string;
      };
    };
  };
  testInduttore: {
    manoDestra: 'Avanti' | 'Indietro' | '';
    manoSinistra: 'Avanti' | 'Indietro' | '';
  };
  induttoreResult: 'Destro' | 'Sinistro' | '';
  testNome: {
    nomeVero: 'SI' | 'NO' | 'NON_RILEVATO' | '';
    nomeFalso: 'SI' | 'NO' | 'NON_RILEVATO' | '';
  };
  puntiDistonici: {
    famiglia: 'SI' | 'NO' | 'NON_RILEVATO' | '';
    sentimentali: 'SI' | 'NO' | 'NON_RILEVATO' | '';
    sessuali: 'SI' | 'NO' | 'NON_RILEVATO' | '';
    autorealizzazione: 'SI' | 'NO' | 'NON_RILEVATO' | '';
  };
  puntoDistonicoFinale: string;
  sigilli: {
    colpa: 'SI' | 'NO' | 'NON_RILEVATO' | '';
    abbandono: 'SI' | 'NO' | 'NON_RILEVATO' | '';
    disistima: 'SI' | 'NO' | 'NON_RILEVATO' | '';
    giudizio: 'SI' | 'NO' | 'NON_RILEVATO' | '';
  };
  sigilloFinale: string;
  timeLine: {
    etaEventoCausa: string;
    PU?: number; // Punto Utopico
    CDS?: number; // Coefficiente Distorsione Spaziale
    PT?: number; // Punto Topico
    etaAntefatto?: number;
    etaFatto?: number;
    isFatto?: boolean;
    CDT?: number; // Coefficiente Temporale Distorsione
    diagnosi?: 'Libertà Vincolata' | 'Sogno Frustrato' | 'Equilibrio' | '';
  };
  testimoneChiave: string;
  giornoEvento: string;
  giustificatoTorto: 'SI' | 'NO' | 'NON_RILEVATO' | '';
  completedTests?: {
      [key: string]: boolean;
      chiSei?: boolean;
      calibrazione?: boolean;
      tap?: boolean;
      induttore?: boolean;
      nome?: boolean;
      puntiDistonici?: boolean;
      sigilli?: boolean;
      timeLine?: boolean;
      testimone?: boolean;
      qualeGiorno?: boolean;
      indagineSingola?: boolean;
  };
  aiSummary?: string;
  hasContactedMax?: boolean;
  liveChatHistory?: { user: string; model: string }[];
}

export interface UserContextType {
  userData: UserData;
  // Fix: Use the imported types instead of React.Dispatch and React.SetStateAction
  setUserData: Dispatch<SetStateAction<UserData>>;
  isAudioEnabled: boolean;
  setAudioEnabled: Dispatch<SetStateAction<boolean>>;
}
