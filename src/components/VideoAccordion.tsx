
import React, { useState } from 'react';

interface VideoAccordionProps {
  videoId: string;
  title?: string;
}

export const VideoAccordion: React.FC<VideoAccordionProps> = ({ videoId, title = "Guarda la video spiegazione" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6 border border-blue-100 rounded-xl overflow-hidden shadow-sm bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-colors duration-200 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white p-1.5 rounded-full shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-bold text-blue-900 text-sm sm:text-base">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-blue-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-4 bg-slate-50 border-t border-blue-100 animate-fadeIn">
          <div className="relative w-full overflow-hidden rounded-lg shadow-inner bg-black" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Video Spiegazione"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAccordion;
