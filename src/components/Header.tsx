
import React, { useEffect } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { LogIn, LogOut, User, X } from 'lucide-react';

const Header: React.FC = () => {
  const { title, subtitle } = useHeader();
  const { user, loginWithGoogle, logout, error, clearError } = useAuth();
  const { resetUserData } = useUser();
  const navigate = useNavigate();
  const isDashboard = title === 'Analogista Virtuale di Max Pisani' || !title;

  const handleLogout = async () => {
    try {
      await logout();
      resetUserData();
      navigate('/');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <header className="bg-blue-600 text-white p-4 rounded-t-lg shadow-lg relative">
      {/* Auth Error Notification */}
      {error && (
        <div className="absolute top-[-50px] left-0 right-0 z-50 flex justify-center animate-bounce">
          <div className="bg-red-500 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <span>{error}</span>
            <button onClick={clearError}><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Auth Button */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-50">
        {user ? (
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
               {user.photoURL ? (
                 <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-white/20 shadow-sm" referrerPolicy="no-referrer" />
               ) : (
                 <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                   <User size={16} />
                 </div>
               )}
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-transform active:scale-95 shadow-[0_4px_10px_rgba(220,38,38,0.4)] border border-red-500 w-full sm:w-auto"
              title="Logout"
            >
              <LogOut size={16} />
              <span>LOGOUT</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={loginWithGoogle}
            className="flex items-center gap-2 text-xs bg-white text-blue-600 font-bold px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-md"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">Accedi</span>
          </button>
        )}
      </div>

      <div className="flex flex-col items-center text-center">
          {/* Riga Superiore: Logo + Titolo */}
          <div className="flex items-center justify-center gap-3 w-[313.962px] mr-[40px]">
              <div className="bg-[#2d64d4] text-white rounded-full shadow-md h-[54px] w-[53px] flex items-center justify-center">
                <Logo className="w-10 h-10" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight text-white">
                  {title === 'Analogista Virtuale di Max Pisani' ? (
                      <>
                          <span className="block uppercase tracking-wider text-[19px]">ANALOGISTA VIRTUALE</span>
                          <span className="block text-sm sm:text-base italic font-light opacity-90 mt-0.5">di Max Pisani</span>
                      </>
                  ) : title}
              </h1>
          </div>
          
          {/* Sottotitolo (Descrizione / Ausilio libro su Home, Descrizione su altre pagine) */}
          {subtitle && (
              <div className="mt-1.5 flex justify-center max-w-md px-2">
                {isDashboard ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-700/80 border border-blue-400/40 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide shadow-sm text-center">
                    <span>📖</span>
                    <span>{subtitle}</span>
                  </span>
                ) : (
                  <p className="text-xs text-[#f3b900] font-medium text-center">
                    {subtitle}
                  </p>
                )}
              </div>
          )}
      </div>
    </header>
  );
};

export default Header;
