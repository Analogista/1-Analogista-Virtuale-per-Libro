
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem: React.FC<{
  Icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ Icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center flex-1 py-3 transition-colors duration-300 group hover:bg-gray-50 border-b-2 ${
        isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-500'
    }`}
  >
    <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
      {Icon}
    </div>
    <span className={`text-xs sm:text-sm font-bold mt-1 ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
        {label}
    </span>
  </button>
);

const HomeIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M2.25 12v8.25a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V12m-18 0l-1.372-1.372a1.5 1.5 0 010-2.122l1.372-1.372M21.75 12l1.372-1.372a1.5 1.5 0 000-2.122l-1.372-1.372" />
    </svg>
);
const ResultsIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
    </svg>
);
const VideoIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
);
const ContactIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
);
const HistoryIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.25c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
    </svg>
);

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="sticky top-0 z-50 flex flex-row items-center justify-between w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm overflow-x-auto no-scrollbar">
      <NavItem Icon={<HomeIcon isActive={currentPath === '/'} />} label="Home" isActive={currentPath === '/'} onClick={() => navigate('/')} />
      <div className="w-px h-8 bg-gray-200 flex-shrink-0"></div>
      <NavItem Icon={<ResultsIcon isActive={currentPath === '/risultati'} />} label="Risultati" isActive={currentPath === '/risultati'} onClick={() => navigate('/risultati')} />
      <div className="w-px h-8 bg-gray-200 flex-shrink-0"></div>
      <NavItem Icon={<VideoIcon isActive={currentPath === '/chat'} />} label="Video Corso" isActive={currentPath === '/chat'} onClick={() => navigate('/chat')} />
      <div className="w-px h-8 bg-gray-200 flex-shrink-0"></div>
      <NavItem Icon={<HistoryIcon isActive={currentPath === '/history'} />} label="Storico" isActive={currentPath === '/history'} onClick={() => navigate('/history')} />
      <div className="w-px h-8 bg-gray-200 flex-shrink-0"></div>
      <NavItem Icon={<ContactIcon isActive={currentPath === '/contatti'} />} label="Contatti" isActive={currentPath === '/contatti'} onClick={() => navigate('/contatti')} />
    </nav>
  );
};

export default BottomNav;
    