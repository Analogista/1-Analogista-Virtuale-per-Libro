
import React from 'react';

interface TestControlsProps {
    onRepeat: () => void;
    onExit?: () => void; // New prop for Exit action
    showControls: boolean; // Hide if test hasn't started
}

const TestControls: React.FC<TestControlsProps> = ({ onRepeat, onExit, showControls }) => {
    if (!showControls) return null;

    return (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
            <div className="bg-gray-900/80 backdrop-blur-xl shadow-2xl border border-white/10 rounded-3xl px-4 py-3 pointer-events-auto flex items-center gap-4 transition-all animate-in slide-in-from-bottom-5 duration-500">
                
                {/* PULSANTE RIPETI */}
                <button 
                    onClick={() => {
                        if(window.confirm("Vuoi davvero ricominciare il test?")) {
                            onRepeat();
                        }
                    }}
                    className="flex flex-col items-center justify-center w-20 py-2.5 bg-gray-800/50 hover:bg-red-900/40 text-gray-300 hover:text-red-400 rounded-2xl transition-all border border-white/5"
                    title="RIPETI"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">RIPETI</span>
                </button>

                {onExit && (
                    <>
                        <div className="w-px h-12 bg-white/10 mx-1"></div>
                        <button 
                            onClick={onExit}
                            className="flex flex-col items-center justify-center w-24 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10"
                            title="Esci"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">ESCI</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TestControls;
