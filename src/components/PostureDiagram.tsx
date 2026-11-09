
import React from 'react';

const PostureDiagram: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[400px] bg-white rounded-xl shadow-inner border border-gray-100"
      >
        {/* Sfondo Uomo Silhouette (Stilizzato) */}
        <g opacity="0.9">
            {/* Testa */}
            <path d="M250 140C250 140 260 140 270 150C280 160 280 180 270 190C265 195 260 200 250 200L240 200V220" stroke="#374151" strokeWidth="2" fill="#F3F4F6"/>
            <path d="M260 160L265 165" stroke="#374151" strokeWidth="2"/> {/* Naso */}
            
            {/* Collo e Camicia */}
            <path d="M240 200L240 220L270 240" stroke="#374151" strokeWidth="2" fill="white"/>
            
            {/* Giacca/Corpo */}
            <path d="M240 220L200 240V450H300V240L270 220" stroke="#1F2937" strokeWidth="3" fill="#1F2937"/>
            <path d="M200 240L200 350L240 380" stroke="#374151" strokeWidth="2"/> {/* Braccio sx */}
            
            {/* Cravatta (Blu) */}
            <path d="M245 220L250 250L255 220" fill="#60A5FA"/>
        </g>

        {/* Cerchio Blu Spalla (Target) */}
        <circle cx="220" cy="270" r="15" stroke="#06B6D4" strokeWidth="4" fill="none" />

        {/* Linee Rosse Verticali */}
        <line x1="160" y1="50" x2="160" y2="450" stroke="#DC2626" strokeWidth="4" />
        <line x1="340" y1="50" x2="340" y2="450" stroke="#DC2626" strokeWidth="4" />

        {/* Freccia SINISTRA (RETRO) */}
        <g transform="translate(40, 150)">
            <text x="40" y="-10" textAnchor="middle" className="font-sans font-bold text-xl fill-black">RETRO</text>
            <path d="M70 20 L20 20 L20 0 L0 35 L20 70 L20 50 L70 50 Z" fill="white" stroke="black" strokeWidth="3"/>
        </g>

        {/* Freccia DESTRA (FRONTE) */}
        <g transform="translate(380, 150)">
            <text x="40" y="-10" textAnchor="middle" className="font-sans font-bold text-xl fill-black">FRONTE</text>
            <path d="M10 20 L60 20 L60 0 L80 35 L60 70 L60 50 L10 50 Z" fill="white" stroke="black" strokeWidth="3"/>
        </g>

        {/* Legenda opzionale in basso */}
        <text x="250" y="480" textAnchor="middle" className="font-sans text-xs fill-gray-500 italic">
            Posizione corretta di fronte alla webcam
        </text>
      </svg>
    </div>
  );
};

export default PostureDiagram;
