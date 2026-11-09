
import React, { useState, useEffect, useRef } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { useUser } from '../contexts/UserContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useAuth } from '../contexts/AuthContext';
import TimeLineGraph from '../components/TimeLineGraph';
import { GoogleGenAI } from '@google/genai';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { ANALOGISTA_KNOWLEDGE } from '../utils/knowledgeBase';
import { generateAnalogicalAnalysis } from '../utils/AnalysisEngine';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { Save, Check, Loader2 } from 'lucide-react';

interface ScreenProps {
  setPage?: () => void; // Optional now with router
}

// ResultCard component
const ResultCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200 print:border print:shadow-none print:mb-2">
        <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3 print:text-base print:mb-1">{title}</h4>
        <div className="text-gray-700 space-y-1 text-sm print:text-xs">{children}</div>
    </div>
);

// SVG Radar Chart Component
const SimpleRadarChart: React.FC<{ data: { subject: string; A: number; fullMark: number }[] }> = ({ data }) => {
    const size = 300; 
    const center = size / 2;
    const radius = 65; 
    const angleStep = (Math.PI * 2) / data.length;

    const points = data.map((d, i) => {
        const value = d.A === 100 ? radius : radius * 0.2; 
        const x = center + value * Math.cos(i * angleStep - Math.PI / 2);
        const y = center + value * Math.sin(i * angleStep - Math.PI / 2);
        return `${x},${y}`;
    }).join(' ');

    const axisPoints = data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        
        let textX = x;
        let textY = y;
        let anchor: "middle" | "start" | "end" = "middle";
        const labelPadding = 20; 

        if (i === 0) { textY = y - labelPadding; anchor = "middle"; }
        else if (i === 1) { textX = x + labelPadding; textY = y + 5; anchor = "start"; }
        else if (i === 2) { textY = y + labelPadding + 5; anchor = "middle"; }
        else if (i === 3) { textX = x - labelPadding; textY = y + 5; anchor = "end"; }

        return { x, y, label: d.subject.toUpperCase(), textX, textY, anchor };
    });

    return (
        <div className="flex justify-center my-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white rounded-lg shadow-sm border border-gray-100">
                <circle cx={center} cy={center} r={radius} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
                <circle cx={center} cy={center} r={radius * 0.6} fill="none" stroke="#e5e7eb" strokeDasharray="4 4" />
                <circle cx={center} cy={center} r={radius * 0.2} fill="white" stroke="#e5e7eb" />
                
                {axisPoints.map((p, i) => (
                    <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" />
                ))}

                <polygon points={points} fill="rgba(37, 99, 235, 0.4)" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
                
                 {data.map((d, i) => {
                    const value = d.A === 100 ? radius : radius * 0.2;
                    const x = center + value * Math.cos(i * angleStep - Math.PI / 2);
                    const y = center + value * Math.sin(i * angleStep - Math.PI / 2);
                    return <circle key={i} cx={x} cy={y} r="3" fill="#2563eb" />
                })}

                {axisPoints.map((p, i) => (
                    <text key={i} x={p.textX} y={p.textY} textAnchor={p.anchor} className="text-[11px] fill-gray-800 font-bold tracking-wider">{p.label}</text>
                ))}
                
                <text x={center} y={size - 15} textAnchor="middle" className="text-[10px] fill-gray-400 italic">Forma ampia = Benessere / Forma contratta = Disagio</text>
            </svg>
        </div>
    );
};

const Risultati: React.FC<ScreenProps> = () => {
  const { userData } = useUser();
  const { setHeader } = useHeader();
  const { apiKey, setApiKey } = useApiKey();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aiMetaphor, setAiMetaphor] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [ttsStatus, setTtsStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Header managed centrally in App.tsx
  }, []);

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
          aiMetaphor: aiMetaphor
        }
      };
      
      await addDoc(collection(db, 'sessions'), sessionData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Error saving session:", error);
      setSaveStatus('error');
      handleFirestoreError(error, OperationType.CREATE, 'sessions');
    }
  };

  const radarData = [
    { subject: 'Famiglia', A: userData.puntiDistonici.famiglia === 'SI' ? 100 : 20, fullMark: 100 },
    { subject: 'Sentimenti', A: userData.puntiDistonici.sentimentali === 'SI' ? 100 : 20, fullMark: 100 },
    { subject: 'Sesso', A: userData.puntiDistonici.sessuali === 'SI' ? 100 : 20, fullMark: 100 },
    { subject: 'Lavoro', A: userData.puntiDistonici.autorealizzazione === 'SI' ? 100 : 20, fullMark: 100 },
  ];

  // Funzione avanzata per pulire il testo per la lettura vocale
  const stripMarkdown = (text: string) => {
    if (!text) return "";
    return text
        .replace(/#{1,6}\s?/g, '')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/([=*_-]){2,}/g, ' ')
        .replace(/^\s*[-*]\s+/gm, '')
        .replace(/[•●■◆]/g, '')
        .replace(/`/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[[\]{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
  };

  const speakAnalysis = async () => {
      // 1. Stop if reading
      if (isReading) {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
          window.speechSynthesis.cancel();
          setIsReading(false);
          return;
      }

      if (!aiMetaphor) return;
      
      const cleanText = stripMarkdown(aiMetaphor);
      
      setIsReading(true);
      setTtsStatus({ type: 'info', msg: 'Caricamento audio...' });

      // 2. Try Google Cloud TTS
      const keyToUse = tempApiKey || apiKey || localStorage.getItem('GOOGLE_API_KEY');
      let cloudTtsSuccess = false;

      if (keyToUse) {
          try {
              const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${keyToUse}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      input: { text: cleanText },
                      voice: { languageCode: 'it-IT', name: 'it-IT-Neural2-A' },
                      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 }
                  })
              });
              
              if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  const errMsg = errorData.error?.message || response.statusText;
                  throw new Error(`Cloud TTS Error (${response.status}): ${errMsg}`);
              }

              const data = await response.json();
              if (data.audioContent) {
                  const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
                  audioRef.current = audio;
                  
                  audio.onended = () => setIsReading(false);
                  audio.onerror = (e) => {
                      console.error("Audio playback error", e);
                      setIsReading(false); 
                  };
                  
                  await audio.play();
                  setTtsStatus({ type: 'success', msg: 'Voce: Google Cloud Neural2' });
                  cloudTtsSuccess = true;
                  return; 
              }
          } catch (e: any) {
              console.warn("Cloud TTS error, falling back to browser voice.", e);
              
              let msg = `Fallback locale. Errore API: ${e.message}`;
              let type: 'error' | 'info' = 'error';
              
              const errString = e.message || e.toString();

              // Gestione specifica per errore 403 (Forbidden) o Blocked
              // Questo accade se l'API "Cloud Text-to-Speech" non è abilitata in console
              if (errString.includes("403") || errString.includes("blocked")) {
                   msg = "Voce Premium non attiva. Uso voce standard.";
                   type = 'info'; 
              }

              setTtsStatus({ type, msg });
          }
      } else {
          setTtsStatus({ type: 'error', msg: "Fallback locale. API Key mancante." });
      }

      if (!cloudTtsSuccess) {
        // 3. Fallback to Browser SpeechSynthesis
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'it-IT';
        
        const voices = window.speechSynthesis.getVoices();
        const itVoice = voices.find(v => v.lang.includes('it') && !v.name.includes('Google')); 
        if (itVoice) utterance.voice = itVoice;

        utterance.onend = () => setIsReading(false);
        utterance.onerror = () => setIsReading(false);
        window.speechSynthesis.speak(utterance);
      }
  };

  const handleGenerateMetaphor = async () => {
      const keyToUse = tempApiKey || apiKey;
      
      if (!keyToUse) {
          setShowKeyInput(true);
          return;
      }
      
      if (tempApiKey && tempApiKey !== apiKey) {
          setApiKey(tempApiKey);
          setShowKeyInput(false);
          // Clean possible error state
          if (aiMetaphor.includes("⛔")) setAiMetaphor("");
      }

      setIsGeneratingAi(true);
      try {
          const ai = new GoogleGenAI({ apiKey: keyToUse });
          let chatContext = "";
          if (userData.liveChatHistory && userData.liveChatHistory.length > 0) {
              chatContext = "\nSTORICO CONVERSAZIONE VOCALE UTENTE:\n";
              userData.liveChatHistory.forEach(turn => {
                  chatContext += `- Utente: "${turn.user}"\n- AI: "${turn.model}"\n`;
              });
          }

          const prompt = `
            ${ANALOGISTA_KNOWLEDGE}
            --- FINE KNOWLEDGE BASE ---
            
            RUOLO: Sei un esperto Analogista Virtuale.
            
            IMPORTANTE:
            - NON CITARE MAI NOMI DI AUTORI.
            - NON INSERIRE SIMBOLI VISIVI.
            - Scrivi in modo discorsivo e fluido.
            
            DATI UTENTE:
            - Nome: ${userData.nome}
            - Induttore: ${userData.induttoreResult}
            - Sigillo Rilevato: ${userData.sigilloFinale}
            - Punto Distonico: ${userData.puntoDistonicoFinale}
            - Evento Causa: ${userData.timeLine.etaEventoCausa} anni (Testimone: ${userData.testimoneChiave}).
            - Reazione al Torto: ${userData.giustificatoTorto} (SI=Dissociazione, NO=Scissione).
            
            ${chatContext}
            
            COMPITO: Scrivi una "Analisi Analogica Incrociata" di circa 350 parole.
          `; 
          
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
          setAiMetaphor(response.text || "Errore generazione.");

      } catch (error: any) {
          console.error(error);
          let errorMsg = `⛔ ERRORE: Verificare la chiave API o la connessione.`;
          
          // Parsing specifico per errore Referer 403
          const errString = error.toString();
          if (errString.includes("Requests from referer") && errString.includes("blocked")) {
              const match = errString.match(/Requests from referer (.*?) are blocked/);
              const blockedUrl = match ? match[1] : window.location.origin;
              errorMsg = `⛔ BLOCCO SICUREZZA: La tua API Key non autorizza questo sito (${blockedUrl}).\n\nAggiungi "${blockedUrl}*" alle "Restrizioni siti web" su Google Cloud Console o rimuovi le restrizioni.`;
          } else if (errString.includes("403")) {
              errorMsg = `⛔ ERRORE 403: Chiave API non valida o permessi insufficienti.`;
          }

          setAiMetaphor(errorMsg);
          setShowKeyInput(true);
      } finally {
          setIsGeneratingAi(false);
      }
  };

  const getInduttoreDetails = () => {
      if (userData.induttoreResult === 'Destro') return "Induttore Destro: Fase Istituzionale (Grillo). Predilige le regole e la coerenza.";
      if (userData.induttoreResult === 'Sinistro') return "Induttore Sinistro: Fase Trasgressiva (Lucignolo). Predilige il piacere e l'istinto.";
      return "";
  }

  const getReazioneDetailedText = () => {
      if (userData.giustificatoTorto === 'SI') return "Hai GIUSTIFICATO (Sì). Meccanismo: DISSOCIAZIONE (Conflitto contro te stesso).";
      if (userData.giustificatoTorto === 'NO') return "NON hai GIUSTIFICATO (No). Meccanismo: SCISSIONE (Rabbia verso l'esterno).";
      return "Dato non rilevato.";
  };

  const handleGeneratePDF = () => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("ANALOGISTA VIRTUALE - Report Analisi", 10, 13);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Utente: ${userData.nome} - Data: ${new Date().toLocaleDateString()}`, 10, 30);
      
      let y = 45;
      const addLine = (text: string) => {
          if (y > pageHeight - 10) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(text, pageWidth - 20);
          doc.text(lines, 10, y);
          y += (lines.length * 6) + 4;
      };

      addLine(`INDUTTORE: ${userData.induttoreResult} (${userData.induttoreResult === 'Destro' ? 'Grillo/Istituzionale' : 'Lucignolo/Trasgressivo'})`);
      addLine(`PUNTO DISTONICO: ${userData.puntoDistonicoFinale}`);
      addLine(`SIGILLO: ${userData.sigilloFinale}`);
      addLine(`TIME LINE: Evento a ${userData.timeLine.etaEventoCausa} anni con ${userData.testimoneChiave}`);
      addLine(`REAZIONE: ${userData.giustificatoTorto} (${userData.giustificatoTorto === 'SI' ? 'Giustificato/Dissociazione' : 'Non Giustificato/Scissione'})`);
      
      if (aiMetaphor) {
          y += 5;
          doc.setFont(undefined, 'bold');
          addLine("ANALISI E METAFORA:");
          doc.setFont(undefined, 'normal');
          addLine(stripMarkdown(aiMetaphor));
      }
      
      // Copyright note on PDF
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("© 2026 Max Pisani - PACommunication. Tutti i diritti riservati.", 10, pageHeight - 8);

      doc.save(`Report_${userData.nome}.pdf`);
  };

  // --- LOGICA DI INCROCIO DATI (RIASSUMENDO CON ANALYSIS ENGINE) ---
  const renderSummary = () => {
         const { puntoDistonicoFinale, sigilloFinale } = userData;
         
         if (!puntoDistonicoFinale || !sigilloFinale) {
             return <p className="text-indigo-800 text-sm italic">Completa tutti i test precedenti (Punti Distonici e Sigilli) per visualizzare il riepilogo incrociato.</p>;
         }

         const analysis = generateAnalogicalAnalysis(userData);

         return (
            <div className="text-indigo-900 text-sm space-y-4 leading-relaxed text-justify">
                <div className="p-3.5 bg-indigo-100/70 rounded-xl border border-indigo-200 shadow-sm">
                  <p className="font-bold text-indigo-950 flex items-center gap-1.5 mb-1">
                    <span>📌</span> Sintesi Inconscia Integrata
                  </p>
                  <p className="text-indigo-900 whitespace-pre-line text-sm leading-relaxed">{analysis.sintesiCompleta}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                    <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
                      <span>🎭</span> Fase & Induttore
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">{analysis.faseInconscia}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                    <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
                      <span>⚡</span> Area di Conflitto
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">{analysis.areaConflitto}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                    <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
                      <span>🛡️</span> Sigillo Difensivo
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">{analysis.sigilloDifesa}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                    <p className="font-bold text-xs uppercase tracking-wide text-indigo-700 mb-1 flex items-center gap-1">
                      <span>🔄</span> Reazione & Meccanismo
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">{analysis.meccanismoReattivo}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-950 shadow-sm">
                  <p className="font-bold text-xs uppercase tracking-wide text-amber-800 mb-1 flex items-center gap-1">
                    <span>💡</span> Consiglio Analogico Riconciliativo (Gratuito)
                  </p>
                  <p className="text-xs text-amber-900 leading-relaxed">{analysis.consiglioAnalogico}</p>
                </div>
            </div>
         );
  };

  // Logica Visibilità Box Warning
  const shouldShowKeyInput = showKeyInput || !apiKey || aiMetaphor.includes("⛔ ERRORE") || aiMetaphor.includes("⛔ BLOCCO");

  return (
    <div className="bg-gray-50 rounded-lg shadow-lg p-4 sm:p-6 print:bg-white">
      <div className="print:hidden">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Riepilogo dei Risultati</h2>
      </div>

      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 mb-6 rounded-r shadow-sm">
            <h3 className="font-bold text-indigo-900 text-lg mb-3 border-b border-indigo-200 pb-2">RIASSUMENDO: Analisi Logica Incrociata</h3>
            {renderSummary()}
      </div>

       <div className="bg-purple-50 p-5 mb-6 rounded-lg border border-purple-200 no-print">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full">
                    <h3 className="font-bold text-purple-900 text-lg">🧠 Analisi Generativa & Metafora Terapeutica</h3>
                    <p className="text-purple-700 text-sm mb-2">L'Intelligenza Artificiale può approfondire questi dati e generare una metafora risolutiva personalizzata.</p>
                    
                    {/* --- BOX AVVISO PREMIUM API KEY --- */}
                    {shouldShowKeyInput && (
                        <div className="mt-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-5 shadow-md relative overflow-hidden">
                             {/* Effetto luce background */}
                             <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-200 rounded-full blur-2xl opacity-50"></div>
                             
                            <div className="flex items-start mb-3 relative z-10">
                                <span className="text-3xl mr-3 animate-pulse">⚠️</span>
                                <div>
                                    <h4 className="font-black text-yellow-800 text-base uppercase tracking-wide">Funzionalità Premium Richiesta</h4>
                                    <p className="text-sm text-yellow-800 mt-1 font-medium leading-relaxed">
                                        Per generare l'analisi con l'AI e ascoltare la voce neurale, <strong>è necessario inserire la tua Google Cloud API Key personale</strong>.
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1 opacity-80">
                                        I test fisici sono gratuiti, ma l'elaborazione generativa ha un costo di servizio esterno.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="relative z-10">
                                <label className="text-xs text-yellow-900 font-bold block mb-1 ml-1">INCOLLA QUI LA TUA API KEY (AIzaSy...)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        value={tempApiKey} 
                                        onChange={(e) => setTempApiKey(e.target.value)} 
                                        placeholder="AIzaSy..." 
                                        className="flex-1 p-3 border-2 border-yellow-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none shadow-inner bg-white" 
                                    />
                                    {tempApiKey && (
                                        <button 
                                            onClick={() => {
                                                setApiKey(tempApiKey);
                                                setShowKeyInput(false);
                                                if (aiMetaphor.includes("⛔")) setAiMetaphor("");
                                            }}
                                            className="bg-yellow-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-yellow-700 transition shadow-sm"
                                        >
                                            Salva
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 italic ml-1">La chiave viene salvata localmente nel tuo browser.</p>
                            </div>
                        </div>
                    )}
                    
                    {!shouldShowKeyInput && apiKey && !aiMetaphor.includes("⛔") && (
                         <button 
                            onClick={() => setShowKeyInput(true)}
                            className="text-xs text-purple-500 underline mt-1 hover:text-purple-700"
                         >
                            Modifica API Key
                         </button>
                    )}
                </div>
                <button 
                    onClick={handleGenerateMetaphor} 
                    disabled={isGeneratingAi || (!apiKey && !tempApiKey)} 
                    className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2 sm:mt-0 flex-shrink-0 shadow-lg"
                >
                    {isGeneratingAi ? 'Generazione in corso...' : '✨ Genera Analisi AI'}
                </button>
            </div>
            {aiMetaphor && !aiMetaphor.includes("⛔") && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-purple-100 shadow-inner">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-purple-800">L'Analisi dell'Analogista Virtuale:</h4>
                        <div className="flex flex-col items-end">
                            <button 
                                onClick={speakAnalysis} 
                                className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 transition-all ${isReading ? 'bg-red-100 text-red-600 animate-pulse border border-red-200' : 'bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-200'}`}
                            >
                                {isReading ? '⏹️ Stop Lettura' : '🔊 Ascolta (Voce AI)'}
                            </button>
                            {ttsStatus && (
                                <span className={`text-[10px] mt-1 ${
                                    ttsStatus.type === 'success' ? 'text-green-600' : 
                                    ttsStatus.type === 'error' ? 'text-red-600 font-bold' : 'text-blue-600'
                                }`}>
                                    {ttsStatus.msg}
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{aiMetaphor}</p>
                </div>
            )}
       </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultCard title="👤 I Tuoi Dati">
            <p><strong>Nome:</strong> {userData.nome}</p>
            <p><strong>Età:</strong> {userData.eta}</p>
            <p><strong>Problema:</strong> {userData.problema}</p>
        </ResultCard>

        <ResultCard title="👋 Test Induttore">
            <p><strong>Risultato:</strong> {userData.induttoreResult}</p>
            <p className="text-xs text-gray-500 mt-1">{getInduttoreDetails()}</p>
        </ResultCard>

        <ResultCard title="🎯 Punto Distonico">
            <p className="text-center font-semibold text-blue-700 mb-2">{userData.puntoDistonicoFinale}</p>
            <SimpleRadarChart data={radarData} />
        </ResultCard>

        <ResultCard title="🔐 Sigillo-Vincolo">
            <p className="font-semibold text-blue-700">{userData.sigilloFinale}</p>
        </ResultCard>

        <div className="md:col-span-2">
            <ResultCard title="⏳ Time Line">
                <p><strong>Diagnosi:</strong> {userData.timeLine.diagnosi}</p>
                {userData.timeLine.PU && (
                     <TimeLineGraph 
                        age={parseInt(userData.eta)} 
                        PU={userData.timeLine.PU} 
                        PT={userData.timeLine.PT} 
                        eventAge={parseInt(userData.timeLine.etaEventoCausa || '0')}
                        diagnosis={userData.timeLine.diagnosi}
                    />
                )}
            </ResultCard>
        </div>

        <div className="md:col-span-2">
            <ResultCard title="📅 Giorno e Reazione">
                 <p><strong>Testimone:</strong> {userData.testimoneChiave}</p>
                 <p className="mt-1"><strong>Reazione:</strong> <span className={userData.giustificatoTorto === 'SI' ? 'text-orange-600 font-bold' : 'text-red-600 font-bold'}>{userData.giustificatoTorto === 'SI' ? 'GIUSTIFICATO' : 'NON GIUSTIFICATO'}</span></p>
                 <p className="text-xs text-gray-500 mt-2 mb-2 italic">"{getReazioneDetailedText()}"</p>
            </ResultCard>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center no-print">
          {user && (
            <button 
                onClick={handleSaveSession} 
                disabled={saveStatus !== 'idle'}
                className={`flex items-center gap-2 font-bold py-2 px-6 rounded-lg transition duration-300 shadow-lg ${
                    saveStatus === 'saved' ? 'bg-green-100 text-green-700' : 
                    saveStatus === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
                {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={18} /> : 
                 saveStatus === 'saved' ? <Check size={18} /> : <Save size={18} />}
                {saveStatus === 'saving' ? 'Salvataggio...' : 
                 saveStatus === 'saved' ? 'Sessione Salvata!' : 
                 saveStatus === 'error' ? 'Errore Salvataggio' : 'Salva Sessione'}
            </button>
          )}
          <button onClick={handleGeneratePDF} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition duration-300 flex items-center gap-2 shadow-lg">
            📄 Scarica PDF
          </button>
          <button onClick={() => navigate('/contatti')} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300 shadow-lg">
            Contatta Max Pisani &rarr;
          </button>
      </div>
    </div>
  );
};

export default Risultati;
