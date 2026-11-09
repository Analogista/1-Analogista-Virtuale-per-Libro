
import React, { useEffect } from 'react';
import { useHeader } from '../contexts/HeaderContext';

const VideoCorso: React.FC = () => {
    const { setHeader } = useHeader();

    useEffect(() => {
        // Header managed centrally in App.tsx
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 flex flex-col h-[calc(100vh-150px)] relative overflow-hidden">
            
            {/* Background Image - Keeping the one from Voice Assistant */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://a.lovart.ai/artifacts/agent/78T6QG4NkBoZQxll.png?v=3" 
                    alt="Background" 
                    className="w-full h-full object-cover object-top opacity-100"
                />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col h-full">
                <div className="text-center mb-4 bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-white/50">
                    <h2 className="text-2xl font-bold text-gray-800">Approfondimenti Video</h2>
                    <p className="text-gray-600 font-medium text-sm mt-1">Guarda le lezioni del video corso completo.</p>
                </div>

                <div className="flex-grow bg-black/20 backdrop-blur-[2px] rounded-xl overflow-hidden shadow-2xl border border-white/30 relative">
                    <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src="https://www.youtube.com/embed/videoseries?list=PL2CcbIMie1l6FeO2lnkuDzN4NlTanzNVu&rel=0&hl=it"
                        title="Video Corso Playlist"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                </div>

                <div className="mt-4 bg-blue-600/90 backdrop-blur-md text-white p-4 rounded-xl shadow-lg border border-white/20">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-xs sm:text-sm font-medium">
                            Questa playlist contiene tutti gli approfondimenti necessari per padroneggiare le tecniche analogiche.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCorso;
