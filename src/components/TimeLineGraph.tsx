import React from 'react';

interface TimeLineGraphProps {
    age: number;
    PU: number;
    PT?: number;
    eventAge?: number;
    diagnosis?: string;
}

const TimeLineGraph: React.FC<TimeLineGraphProps> = ({ age, PU, PT, eventAge, diagnosis }) => {
    if (!age || !PU) return null;

    const totalWidth = 100; // Using percentage for SVG width
    const maxAgeScale = age * 1.1; // Add 10% buffer to the right

    // Helper to map age to percentage X coordinate
    const getX = (val: number) => (val / maxAgeScale) * 100;

    const xBirth = getX(0);
    const xPU = getX(PU);
    const xNow = getX(age);
    const xPT = PT ? getX(PT) : null;
    const xEvent = eventAge ? getX(eventAge) : null;

    const diagnosisColor = diagnosis === 'Libertà Vincolata' ? '#dc2626' : (diagnosis === 'Sogno Frustrato' ? '#2563eb' : '#059669');

    return (
        <div className="w-full my-6 font-sans select-none print:my-2">
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-2 tracking-wider text-center print:text-left">Mappa della Time-Line</h4>
            <div className="relative w-full h-24 bg-gray-50 rounded border border-gray-200 print:border-0">
                <svg width="100%" height="100%" className="overflow-visible">
                    {/* Main Time Line */}
                    <line x1="2%" y1="50%" x2="98%" y2="50%" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />

                    {/* Birth (0) */}
                    <circle cx={`${xBirth + 2}%`} cy="50%" r="4" fill="#4b5563" />
                    <text x={`${xBirth + 2}%`} y="75%" textAnchor="start" fontSize="10" fill="#4b5563" className="font-semibold">0 (Nascita)</text>

                    {/* Current Age */}
                    <circle cx={`${xNow + 2}%`} cy="50%" r="4" fill="#4b5563" />
                    <text x={`${xNow + 2}%`} y="30%" textAnchor="end" fontSize="10" fill="#4b5563" className="font-bold">Oggi ({age} anni)</text>

                    {/* PU (Utopic Point) - Fixed marker */}
                    <line x1={`${xPU + 2}%`} y1="20%" x2={`${xPU + 2}%`} y2="80%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" />
                    <text x={`${xPU + 2}%`} y="15%" textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="bold">PU ({PU.toFixed(1)})</text>

                    {/* PT (Topic Point) - Dynamic Marker */}
                    {xPT && (
                        <>
                            <line x1={`${xPT + 2}%`} y1="20%" x2={`${xPT + 2}%`} y2="80%" stroke={diagnosisColor} strokeWidth="3" />
                            <text x={`${xPT + 2}%`} y="95%" textAnchor="middle" fontSize="11" fill={diagnosisColor} fontWeight="bold">PT ({PT?.toFixed(1)})</text>
                            
                            {/* Range indicator (Finestra Energetica) */}
                            <rect x={`${Math.min(xPT, xPU) + 2}%`} y="48%" width={`${Math.abs(xPT - xPU)}%`} height="4%" fill={diagnosisColor} opacity="0.3" />
                        </>
                    )}

                    {/* Event Age (Antefatto/Fatto) */}
                    {xEvent && (
                        <>
                             <circle cx={`${xEvent + 2}%`} cy="50%" r="5" fill="#ef4444" stroke="white" strokeWidth="2" />
                             <text x={`${xEvent + 2}%`} y="35%" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="bold">Evento ({eventAge})</text>
                        </>
                    )}
                </svg>
            </div>
            {diagnosis && (
                 <div className="text-center mt-2">
                     <span className="text-xs font-medium text-gray-500">Diagnosi: </span>
                     <span className="text-sm font-bold" style={{ color: diagnosisColor }}>{diagnosis}</span>
                 </div>
            )}
        </div>
    );
};

export default TimeLineGraph;