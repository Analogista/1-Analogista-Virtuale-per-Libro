/* © 2027 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { AuthModal } from '../components/AuthModal';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseAuthError(err: { code?: string }): string {
  switch (err?.code) {
    case 'auth/popup-closed-by-user':
      return "L'accesso è stato annullato. Riprova se desideri accedere.";
    case 'auth/cancelled-by-user':
      return "Accesso annullato dall'utente.";
    case 'auth/operation-not-allowed':
      return 'Accesso con email e password non ancora abilitato nella Console Firebase.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email o password non corrette.';
    case 'auth/email-already-in-use':
      return 'Esiste già un account con questa email. Prova ad accedere.';
    case 'auth/weak-password':
      return 'La password deve contenere almeno 6 caratteri.';
    case 'auth/invalid-email':
      return 'Inserisci un indirizzo email valido.';
    case 'auth/too-many-requests':
      return 'Troppi tentativi. Riprova tra qualche minuto.';
    default:
      return "Errore durante l'accesso. Riprova più tardi.";
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === 'analogistabrindisi@gmail.com' && currentUser.emailVerified) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    try {
      // Forziamo la selezione dell'account per evitare loop o cache stale
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(mapFirebaseAuthError(err));
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthModalOpen(false);
      return true;
    } catch (err: any) {
      console.error('Email login failed:', err);
      setError(mapFirebaseAuthError(err));
      return false;
    }
  };

  const registerWithEmail = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (credential.user && !credential.user.emailVerified) {
        await sendEmailVerification(credential.user).catch((verErr) => {
          console.warn('Email verification send failed:', verErr);
        });
      }
      return true;
    } catch (err: any) {
      console.error('Email registration failed:', err);
      setError(mapFirebaseAuthError(err));
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(mapFirebaseAuthError(err));
      return false;
    }
  };

  const openAuthModal = () => {
    setError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setError(null);
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Errore durante il logout.');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        error,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        openAuthModal,
        closeAuthModal,
        logout,
        clearError,
      }}
    >
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        error={error}
        clearError={clearError}
        onGoogleLogin={loginWithGoogle}
        onEmailLogin={loginWithEmail}
        onEmailRegister={registerWithEmail}
        onResetPassword={resetPassword}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
