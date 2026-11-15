/* © 2026 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import TimeLineGraph from '../components/TimeLineGraph';
import { useNavigate } from 'react-router-dom';
import {
  generateAnalogicalAnalysis,
  NOT_AVAILABLE,
} from '../utils/AnalysisEngine';
import { buildResultsPdf, getPdfFilename } from '../utils/reportPdf';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { Save, Check, Loader2 } from 'lucide-react';

interface ScreenProps {
  setPage?: (page: number | string) => void; // Optional now with router
}

// ResultCard component
const ResultCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white shadow-md rounded-lg p-3.5 sm:p-4 mb-4 border border-gray-200 print:border print:shadow-none print:mb-2 min-w-0">
    <h4 className="text-base sm:text-lg font-bold text-gray-800 border-b pb-2 mb-3 print:text-base print:mb-1 break-words">
      {title}
    </h4>
    <div className="text-gray-700 space-y-1.5 text-sm print:text-xs break-words">{children}</div>
  </div>
);

// SVG Radar Chart Component
const SimpleRadarChart: React.FC<{ data: { subject: string; A: number; fullMark: number }[] }> = ({ data }) => {
  const width = 340;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 65;
  const angleStep = (Math.PI * 2) / data.length;

  const points = data
    .map((d, i) => {
      const value = d.A === 100 ? radius : radius * 0.2;
      const x = centerX + value * Math.cos(i * angleStep - Math.PI / 2);
      const y = centerY + value * Math.sin(i * angleStep - Math.PI / 2);
      return `${x},${y}`;
    })
    .join(' ');

  const axisPoints = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const labelRadius = radius + 16;
    const textX = centerX + labelRadius * Math.cos(angle);
    const sinVal = Math.sin(angle);
    const cosVal = Math.cos(angle);
    const textY = centerY + labelRadius * sinVal + (sinVal > 0.35 ? 10 : sinVal < -0.35 ? -4 : 4);
    const anchor: 'middle' | 'start' | 'end' =
      cosVal > 0.25 ? 'start' : cosVal < -0.25 ? 'end' : 'middle';

    return { x, y, label: d.subject.toUpperCase(), textX, textY, anchor };
  });

  return (
    <div className="flex justify-center my-4">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-white rounded-lg shadow-sm border border-gray-100 w-full h-auto max-w-[340px]"
      >
        <circle cx={centerX} cy={centerY} r={radius} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
        <circle cx={centerX} cy={centerY} r={radius * 0.6} fill="none" stroke="#e5e7eb" strokeDasharray="4 4" />
        <circle cx={centerX} cy={centerY} r={radius * 0.2} fill="white" stroke="#e5e7eb" />

        {axisPoints.map((p, i) => (
          <line key={i} x1={centerX} y1={centerY} x2={p.x} y2={p.y} stroke="#e5e7eb" />
        ))}

        <polygon
          points={points}
          fill="rgba(37, 99, 235, 0.4)"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {data.map((d, i) => {
          const value = d.A === 100 ? radius : radius * 0.2;
          const x = centerX + value * Math.cos(i * angleStep - Math.PI / 2);
          const y = centerY + value * Math.sin(i * angleStep - Math.PI / 2);
          return <circle key={i} cx={x} cy={y} r="3" fill="#2563eb" />;
        })}

        {axisPoints.map((p, i) => (
          <text key={i} x={p.textX} y={p.textY} textAnchor={p.anchor} className="text-[10px] fill-gray-800 font-bold tracking-wider">
            {p.label}
          </text>
        ))}

        <text x={centerX} y={height - 12} textAnchor="middle" className="text-[10px] fill-gray-400 italic">
          Forma ampia = Benessere / Forma contratta = Disagio
        </text>
      </svg>
    </div>
  );
};

const Risultati: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData } = useUser();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isReading, setIsReading] = useState(false);
  const [ttsStatus, setTtsStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const speechSessionRef = useRef(0);

  const isSpeechSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  useEffect(() => {
    const activeSessionRef = speechSessionRef;
    return () => {
      activeSessionRef.current += 1;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const crossAnalysis = useMemo(() => generateAnalogicalAnalysis(userData), [userData]);
  const { data: reportData } = crossAnalysis;

  const handleSaveSession = async () => {
    if (!user) return;

    setSaveStatus('saving');
    try {
      const sessionData = {
        userId: user.uid,
        userName: userData.nome || user.displayName || 'Utente',
        createdAt: serverTimestamp(),
        status: 'completed',
        data: {
          ...userData,
        },
      };

      await addDoc(collection(db, 'sessions'), sessionData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving session:', error);
      setSaveStatus('error');
      handleFirestoreError(error, OperationType.CREATE, 'sessions');
    }
  };

  const radarItems = [
    { key: 'famiglia', subject: 'Fam. Origine', raw: userData.puntiDistonici?.famiglia },
    { key: 'famigliaAcquisita', subject: 'Fam. Acquisita', raw: userData.puntiDistonici?.famigliaAcquisita },
    { key: 'sentimentali', subject: 'Sentimenti', raw: userData.puntiDistonici?.sentimentali },
    { key: 'sessuali', subject: 'Passioni', raw: userData.puntiDistonici?.sessuali },
    { key: 'autorealizzazione', subject: 'Lavoro', raw: userData.puntiDistonici?.autorealizzazione },
  ] as const;

  const validRadarItems = radarItems.filter(
    (item): item is (typeof radarItems)[number] & { raw: 'SI' | 'NO' } =>
      item.raw === 'SI' || item.raw === 'NO'
  );
  const missingRadarItems = radarItems.filter(
    (item) => item.raw !== 'SI' && item.raw !== 'NO'
  );

  const hasValidPuntiDistoniciData = validRadarItems.length > 0;
  const hasCompletePuntiDistoniciData = validRadarItems.length === radarItems.length;

  const radarData = radarItems.map((item) => ({
    subject: item.subject,
    A: item.raw === 'SI' ? 100 : 20,
    fullMark: 100,
  }));

  const splitSpeechChunks = (sections: string[]): string[] => {
    const chunks: string[] = [];
    for (const section of sections) {
      const normalized = section.replace(/\s+/g, ' ').trim();
      if (!normalized) continue;
      if (normalized.length <= 240) {
        chunks.push(normalized);
        continue;
      }
      const sentences = normalized.match(/[^.!?]+(?:[.!?]+|$)/g) || [normalized];
      let current = '';
      for (const rawSentence of sentences) {
        const sentence = rawSentence.trim();
        if (!sentence) continue;
        if (!current) {
          current = sentence;
        } else if (current.length + 1 + sentence.length <= 240) {
          current += ` ${sentence}`;
        } else {
          chunks.push(current);
          current = sentence;
        }
      }
      if (current) chunks.push(current);
    }
    return chunks;
  };

  const speakAnalysis = () => {
    if (!isSpeechSupported) {
      setIsReading(false);
      setTtsStatus({
        type: 'error',
        msg: 'La sintesi vocale del browser non è supportata su questo dispositivo.',
      });
      return;
    }

    if (isReading) {
      speechSessionRef.current += 1;
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
      setIsReading(false);
      setTtsStatus({ type: 'info', msg: 'Lettura interrotta.' });
      return;
    }

    const chunks = splitSpeechChunks(crossAnalysis.speechSections);
    if (chunks.length === 0) return;

    const sessionId = ++speechSessionRef.current;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }

    const voices = window.speechSynthesis.getVoices();
    const italianVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('it') && v.localService) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('it'));

    setIsReading(true);
    setTtsStatus({ type: 'info', msg: 'Lettura vocale del browser attiva...' });

    const speakChunk = (index: number) => {
      if (speechSessionRef.current !== sessionId) return;
      if (index >= chunks.length) {
        setIsReading(false);
        setTtsStatus({ type: 'success', msg: 'Lettura completata.' });
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = 'it-IT';
      if (italianVoice) {
        utterance.voice = italianVoice;
      }
      utterance.onend = () => {
        if (speechSessionRef.current !== sessionId) return;
        speakChunk(index + 1);
      };
      utterance.onerror = (event) => {
        if (speechSessionRef.current !== sessionId) return;
        if (event.error === 'canceled' || event.error === 'interrupted') {
          setIsReading(false);
          return;
        }
        setIsReading(false);
        setTtsStatus({
          type: 'error',
          msg: 'Sintesi vocale non disponibile o interrotta dal browser.',
        });
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        if (speechSessionRef.current === sessionId) {
          setIsReading(false);
          setTtsStatus({
            type: 'error',
            msg: 'Impossibile avviare la sintesi vocale su questo browser.',
          });
        }
      }
    };

    speakChunk(0);
  };

  const handleGeneratePDF = () => {
    const doc = buildResultsPdf(userData, crossAnalysis);
    doc.save(getPdfFilename(userData));
  };

  const parsedCurrentAge = parseInt(userData.eta || '', 10);
  const parsedEventAge = parseInt(userData.timeLine?.etaEventoCausa || '', 10);
  const canRenderTimelineGraph =
    Boolean(userData.timeLine?.PU) && Number.isFinite(parsedCurrentAge) && parsedCurrentAge > 0;

  const renderSummary = () => {
    if (!crossAnalysis.hasAnyTestData) {
      return (
        <div className="text-indigo-950 text-sm leading-relaxed space-y-3 break-words">
          <p className="whitespace-pre-line">{crossAnalysis.sintesiCompleta}</p>
        </div>
      );
    }

    return (
      <div className="text-indigo-900 text-sm space-y-4 leading-relaxed text-left break-words">
        <div className="p-3.5 bg-indigo-100/70 rounded-xl border border-indigo-200 shadow-sm">
          <p className="font-bold text-indigo-950 flex items-center gap-1.5 mb-1.5">
            <span>📌</span> Sintesi Esplorativa Integrata
          </p>
          <p className="text-indigo-900 whitespace-pre-line text-sm leading-relaxed">
            {crossAnalysis.sintesiCompleta}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm min-w-0">
            <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
              <span>🧭</span> Profilo T.A.P. (Tipologia e Polarità)
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">{crossAnalysis.profiloTAP}</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm min-w-0">
            <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
              <span>🎭</span> Fase &amp; Induttore
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">{crossAnalysis.faseInconscia}</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm min-w-0">
            <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
              <span>🆔</span> Test del Nome (Verifica Sì/No)
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">{crossAnalysis.calibrazioneNome}</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm min-w-0">
            <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
              <span>⚡</span> Area di Conflitto (Punti Distonici)
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">{crossAnalysis.areaConflitto}</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm min-w-0">
            <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
              <span>🛡️</span> Sigilli Difensivi
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">{crossAnalysis.sigilloDifesa}</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm min-w-0">
            <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
              <span>⏳</span> Time Line, Giorno &amp; Testimone
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">{crossAnalysis.imprintingTimeline}</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm md:col-span-2 min-w-0">
            <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
              <span>🔄</span> Reazione al Torto &amp; Tendenze
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">{crossAnalysis.meccanismoReattivo}</p>
          </div>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-950 shadow-sm">
          <p className="font-bold text-xs uppercase tracking-wide text-amber-800 mb-1 flex items-center gap-1">
            <span>💡</span> Indicazione Metodologica
          </p>
          <p className="text-xs text-amber-900 leading-relaxed">{crossAnalysis.consiglioAnalogico}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg shadow-lg p-3.5 sm:p-6 print:bg-white overflow-x-hidden">
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-gray-200 pb-4">
        <button
          onClick={() => {
            if (setPage) setPage(0);
            else navigate('/');
          }}
          className="text-xs sm:text-sm font-bold text-gray-700 hover:text-blue-600 border border-gray-300 px-3.5 py-2 rounded-xl transition shadow-2xs bg-white flex items-center gap-1.5"
        >
          &larr; Torna alla Home
        </button>
        <h2 className="text-xl sm:text-3xl font-bold text-gray-800 text-left sm:text-center flex-1">
          Riepilogo dei Risultati
        </h2>
        <div className="hidden sm:block w-32"></div>
      </div>

      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3.5 sm:p-5 mb-6 rounded-r shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200 pb-2.5 mb-3">
          <h3 className="font-bold text-indigo-900 text-lg">Analisi Logica Incrociata</h3>
          <div className="flex flex-col sm:items-end gap-1 print:hidden">
            {isSpeechSupported ? (
              <button
                type="button"
                onClick={speakAnalysis}
                data-keep-voice="true"
                className={`text-xs sm:text-sm px-3.5 py-2 rounded-xl font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                  isReading
                    ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                    : 'bg-white text-indigo-800 border border-indigo-300 hover:bg-indigo-100'
                }`}
              >
                {isReading ? '⏹️ Ferma lettura' : '🔊 Ascolta analisi'}
              </button>
            ) : (
              <span className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                Lettura vocale non supportata su questo browser.
              </span>
            )}
            {ttsStatus && (
              <span
                className={`text-xs ${
                  ttsStatus.type === 'success'
                    ? 'text-emerald-700 font-medium'
                    : ttsStatus.type === 'error'
                    ? 'text-red-700 font-semibold'
                    : 'text-indigo-700'
                }`}
              >
                {ttsStatus.msg}
              </span>
            )}
          </div>
        </div>
        {renderSummary()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultCard title="👤 I Tuoi Dati">
          <p>
            <strong>Nome:</strong> {reportData.nome}
          </p>
          <p>
            <strong>Età:</strong> {reportData.eta}
          </p>
          <p>
            <strong>Genere:</strong> {reportData.genere}
          </p>
          <p>
            <strong>Problema / Tema:</strong> {reportData.problema}
          </p>
        </ResultCard>

        <ResultCard title="🧭 Test T.A.P. (Tipologia e Polarità)">
          <p>
            <strong>Tipologia:</strong> {reportData.tap.tipologia}
          </p>
          <p>
            <strong>Polarità / Distonia:</strong> {reportData.tap.polarita}
            {reportData.tap.distonia !== NOT_AVAILABLE ? ` (${reportData.tap.distonia})` : ''}
          </p>
          <p className="text-xs text-gray-600">
            <strong>Archetipi:</strong> Cerchio {reportData.tap.rawResults.cerchio} · Asta{' '}
            {reportData.tap.rawResults.asta} · Triangolo {reportData.tap.rawResults.triangolo}
          </p>
          {reportData.tap.dinamica !== NOT_AVAILABLE && (
            <p className="text-xs text-gray-600 mt-1">{reportData.tap.dinamica}</p>
          )}
        </ResultCard>

        <ResultCard title="👋 Test Induttore">
          <p>
            <strong>Risultato:</strong> {reportData.induttore.risultatoLabel}
          </p>
          <p>
            <strong>Fase / Archetipo:</strong> {reportData.induttore.faseArchetipo}
          </p>
          <p>
            <strong>Tema:</strong> {reportData.induttore.tema}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Mano Destra: {reportData.induttore.manoDestra} · Mano Sinistra:{' '}
            {reportData.induttore.manoSinistra}
          </p>
        </ResultCard>

        <ResultCard title="🆔 Test del Nome (Verifica Sì/No)">
          <p>
            <strong>Nome vero:</strong> {reportData.testNome.nomeVero}
          </p>
          <p>
            <strong>Nome falso:</strong> {reportData.testNome.nomeFalso}
          </p>
          <p>
            <strong>Esito calibrazione:</strong> {reportData.testNome.statoCalibrazione}
          </p>
          <p className="text-xs text-gray-500 mt-1 italic">
            Verifica tecnica Sì/No del canale analogico; non descrive la personalità.
          </p>
        </ResultCard>

        <ResultCard title="🎯 Punti Distonici">
          <p className="font-semibold text-blue-700 mb-2">
            <span className="text-gray-700 font-bold">Punto prioritario: </span>
            {reportData.puntiDistonici.prioritario}
          </p>
          <div className="mb-2 pt-2 border-t border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Dettaglio delle 5 aree:
            </p>
            <ul className="space-y-1 text-xs text-gray-700">
              {reportData.puntiDistonici.dettaglio.map((area) => (
                <li key={area.key} className="flex flex-wrap justify-between gap-1 border-b border-gray-50 pb-0.5">
                  <span className="font-medium">{area.label}</span>
                  <span className={area.raw === 'NO' ? 'text-amber-700 font-bold' : 'text-gray-600'}>
                    {area.display}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {hasCompletePuntiDistoniciData ? (
            <SimpleRadarChart data={radarData} />
          ) : hasValidPuntiDistoniciData ? (
            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                <span className="font-bold text-slate-800">
                  {validRadarItems.length} su {radarItems.length} risposte disponibili
                </span>
              </div>
              <ul className="space-y-1.5 text-xs">
                {validRadarItems.map((item) => (
                  <li
                    key={item.key}
                    className="flex flex-wrap items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-slate-200"
                  >
                    <span className="font-semibold text-gray-800">{item.subject}</span>
                    <span className="font-bold text-slate-900">
                      {item.raw === 'SI' ? 'Sì' : 'No'}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Aree senza dati
                </p>
                <ul className="space-y-1 text-xs">
                  {missingRadarItems.map((item) => (
                    <li
                      key={item.key}
                      className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1 rounded bg-white/60 border border-slate-200/80"
                    >
                      <span className="text-slate-700">{item.subject}</span>
                      <span className="text-slate-500 italic">Non rilevato</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
                  Il grafico completo sarà disponibile quando tutte e 5 le aree avranno risposta Sì o No.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 text-center italic">
              Il grafico sarà disponibile dopo il Test dei Punti Distonici.
            </p>
          )}
        </ResultCard>

        <ResultCard title="🔐 Sigilli e Vincoli">
          <p className="font-semibold text-blue-700">
            <span className="text-gray-700 font-bold">Sigillo prioritario: </span>
            {reportData.sigilli.prioritario}
          </p>
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Tutti i sigilli emersi (risposta SÌ):
            </p>
            {reportData.sigilli.emersi.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5 text-gray-800">
                {reportData.sigilli.emersi.map((label, idx) => (
                  <li key={idx}>{label}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">
                {reportData.sigilli.prioritario === 'Nessun sigillo rilevato'
                  ? 'Nessun sigillo con risposta SÌ registrato.'
                  : NOT_AVAILABLE}
              </p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Stato dei 4 sigilli:
            </p>
            <ul className="space-y-1 text-xs text-gray-700">
              {reportData.sigilli.dettaglio.map((sig) => (
                <li key={sig.key} className="flex flex-wrap justify-between gap-1">
                  <span>{sig.label}</span>
                  <span className={sig.raw === 'SI' ? 'text-purple-700 font-bold' : 'text-gray-600'}>
                    {sig.display}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ResultCard>

        <div className="md:col-span-2 min-w-0">
          <ResultCard title="⏳ Time Line (Ipotesi Esplorativa)">
            <p>
              <strong>Età ipotizzata evento:</strong> {reportData.timeLine.etaEventoCausa}
            </p>
            <p>
              <strong>Lettura analogica del modello:</strong> {reportData.timeLine.diagnosi}
            </p>
            <p className="text-xs text-gray-600">
              <strong>Indicatori:</strong> PU: {reportData.timeLine.pu} · PT: {reportData.timeLine.pt} ·
              CDT: {reportData.timeLine.cdt}
            </p>
            {canRenderTimelineGraph && userData.timeLine?.PU ? (
              <TimeLineGraph
                age={parsedCurrentAge}
                PU={userData.timeLine.PU}
                PT={userData.timeLine.PT}
                eventAge={Number.isFinite(parsedEventAge) ? parsedEventAge : 0}
                diagnosis={userData.timeLine.diagnosi}
              />
            ) : (
              <p className="text-xs text-gray-500 italic mt-2">
                {userData.timeLine?.PU
                  ? 'Grafico non visualizzabile perché manca un’età anagrafica valida in «I Tuoi Dati».'
                  : 'Mappa grafica disponibile dopo il completamento della Time Line.'}
              </p>
            )}
          </ResultCard>
        </div>

        <div className="md:col-span-2 min-w-0">
          <ResultCard title="📅 Giorno, Testimone e Reazione al Torto (Ipotesi Esplorative)">
            <p>
              <strong>Giorno / Periodo rilevato:</strong> {reportData.passo5.giornoEventoDisplay}
            </p>
            <p>
              <strong>Testimone chiave ipotizzato:</strong> {reportData.passo5.testimoneDisplay}
            </p>
            <p className="mt-2">
              <strong>{reportData.passo5.domandaGiustificato}</strong>{' '}
              <span
                className={
                  reportData.passo5.rispostaGiustificatoRaw === 'SI'
                    ? 'text-orange-700 font-bold'
                    : reportData.passo5.rispostaGiustificatoRaw === 'NO'
                    ? 'text-red-700 font-bold'
                    : 'text-gray-600 font-semibold'
                }
              >
                {reportData.passo5.rispostaGiustificatoDisplay}
              </span>
            </p>
            {reportData.passo5.rispostaGiustificatoRaw && (
              <p className="text-xs text-gray-600 italic">
                {reportData.passo5.significatoReazione}
              </p>
            )}
            <p className="mt-2">
              <strong>{reportData.passo5.domandaAvrestiDovuto}</strong>{' '}
              <span className="font-semibold text-gray-800">
                {reportData.passo5.rispostaAvrestiDovutoDisplay}
              </span>
            </p>
            <div className="mt-2 p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800 font-medium">
              <strong>Confronto risposte:</strong> {reportData.passo5.confronto.label} —{' '}
              {reportData.passo5.confronto.explanation}
            </div>
          </ResultCard>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-stretch sm:items-center no-print">
        <button
          onClick={() => {
            if (setPage) setPage(0);
            else navigate('/');
          }}
          className="w-full sm:w-auto justify-center bg-slate-800 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-700 transition duration-300 shadow-md flex items-center gap-2 text-sm"
        >
          🏠 Torna alla Home
        </button>
        {user && (
          <button
            onClick={handleSaveSession}
            disabled={saveStatus !== 'idle'}
            className={`w-full sm:w-auto justify-center flex items-center gap-2 font-bold py-3 px-6 rounded-xl transition duration-300 shadow-md text-sm ${
              saveStatus === 'saved'
                ? 'bg-green-100 text-green-700'
                : saveStatus === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="animate-spin" size={18} />
            ) : saveStatus === 'saved' ? (
              <Check size={18} />
            ) : (
              <Save size={18} />
            )}
            {saveStatus === 'saving'
              ? 'Salvataggio...'
              : saveStatus === 'saved'
              ? 'Sessione Salvata!'
              : saveStatus === 'error'
              ? 'Errore Salvataggio'
              : 'Salva Sessione'}
          </button>
        )}
        <button
          onClick={handleGeneratePDF}
          className="w-full sm:w-auto justify-center bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 transition duration-300 flex items-center gap-2 shadow-md text-sm"
        >
          📄 Scarica PDF
        </button>
        <button
          onClick={() => navigate('/contatti')}
          className="w-full sm:w-auto justify-center bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition duration-300 shadow-md text-sm"
        >
          Contatta Max Pisani &rarr;
        </button>
      </div>
    </div>
  );
};

export default Risultati;
