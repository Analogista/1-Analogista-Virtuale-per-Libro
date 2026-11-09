import React, { useEffect, useState, useRef } from 'react';
import { playFeedbackSound, playCountdownSound } from '../utils/sound';
import { MotionDetectionService } from '../services/MotionDetectionService';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onReady?: () => void;
  onServiceId?: (serviceId: string) => void;
  showSilhouette?: boolean;
  onError?: (error: string) => void;
  onCalibrated?: () => void;
  sensitivity?: number;
  onVoiceGuide?: () => void;
}

export interface CameraViewRef {
  startCalibration: () => void;
}

const CameraView = React.forwardRef<CameraViewRef, CameraViewProps>(({ videoRef, onReady, onServiceId, showSilhouette = true, onError, onCalibrated, sensitivity = 75, onVoiceGuide }, ref) => {
  const [error, setError] = useState<string | null>(null);
  const [detectedResult, setDetectedResult] = useState<'SI' | 'NO' | null>(null);
  const [depthInfo, setDepthInfo] = useState({ delta: 0, threshold: 0.05 });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const motionService = useRef<MotionDetectionService>(new MotionDetectionService());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isReady && motionService.current) {
        motionService.current.setSensitivity(sensitivity);
    }
  }, [sensitivity, isReady]);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("La fotocamera non è supportata. Usa Chrome o Safari.");
        }
        
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
          });
        } catch (_e) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          
          const handleMetadata = async () => {
            try {
              if (video.readyState >= 2) {
                await video.play();
                if (canvasRef.current) {
                  canvasRef.current.width = video.videoWidth;
                  canvasRef.current.height = video.videoHeight;
                }
                
                const initialized = await motionService.current.initialize(video);
                if (!initialized) {
                  throw new Error('Il motore di rilevazione non è disponibile su questo dispositivo.');
                }
                motionService.current.setSensitivity(sensitivity);
                motionService.current.startDetection();
                setIsReady(true);
                
                if (onReady) onReady();
              }
            } catch (playOrModelError) {
              const message = playOrModelError instanceof Error
                ? playOrModelError.message
                : "Impossibile avviare il motore di rilevazione.";
              setError(message);
              if (onError) onError(message);
            }
          };

          if (video.readyState >= 2) {
            handleMetadata();
          } else {
            video.onloadedmetadata = handleMetadata;
          }
        }
      } catch (err: any) {
        const errMsg = err.name === 'NotAllowedError' ? "Permesso negato. Controlla le impostazioni del browser." : "Errore hardware fotocamera.";
        setError(errMsg);
        if (onError) onError(errMsg);
      }
    };

    initialize();

    const serviceId = motionService.current.id;
    onServiceId?.(serviceId);

    const handleMovement = (event: any) => {
        if (event.detail.serviceId !== serviceId) return;
        const { direction } = event.detail;
        if (direction === 'forward') {
            setDetectedResult('SI');
            playFeedbackSound('positive');
        } else if (direction === 'backward') {
            setDetectedResult('NO');
            playFeedbackSound('negative');
        }
        setTimeout(() => setDetectedResult(null), 1200);
    };

    const handleDepth = (event: any) => {
        if (event.detail.serviceId !== serviceId) return;
        setDepthInfo({ delta: event.detail.delta, threshold: event.detail.threshold });
    };

    const handleLandmarks = (event: any) => {
        if (event.detail.serviceId !== serviceId) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const landmarks = event.detail.landmarks;
        if (!landmarks || landmarks.length < 13) return;

        const nose = landmarks[0];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
        const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(midShoulderX * canvas.width, midShoulderY * canvas.height);
        ctx.lineTo(nose.x * canvas.width, nose.y * canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#00e5ff';
        [0, 11, 12].forEach(idx => {
          const lm = landmarks[idx];
          ctx.beginPath();
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 6, 0, 2 * Math.PI);
          ctx.fill();
        });
    };

    window.addEventListener('movementDetected', handleMovement);
    window.addEventListener('depthUpdate', handleDepth);
    window.addEventListener('landmarksProcessed', handleLandmarks);

    return () => {
      const ms = motionService.current;
      ms?.stopDetection();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('movementDetected', handleMovement);
      window.removeEventListener('depthUpdate', handleDepth);
      window.removeEventListener('landmarksProcessed', handleLandmarks);
    };
  }, [onReady, onServiceId, onError, sensitivity, videoRef]);

  const handleCalibrate = () => {
    if (isCalibrating || !isReady) return;
    setIsCalibrating(true);
    motionService.current?.stopDetection();
    setCountdown(5);
    playCountdownSound(); 
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(async () => {
            const calibrated = await motionService.current?.calibrateFromSamples(1500);
            setIsCalibrating(false);
            if (!calibrated) {
              setError('Non ho rilevato abbastanza punti del corpo. Resta fermo, migliora la luce e riprova.');
              return;
            }
            playFeedbackSound('positive');
            if (onCalibrated) onCalibrated();
          }, 500);
          return 0;
        }
        playCountdownSound();
        return prev - 1;
      });
    }, 1000);
  };

  React.useImperativeHandle(ref, () => ({
    startCalibration: handleCalibrate
  }));

  const offsetPercent = (depthInfo.delta / (depthInfo.threshold * 2)) * 100;
  const clampedOffset = Math.max(-100, Math.min(100, offsetPercent));

  return (
    <div className="relative w-full max-w-4xl h-[550px] mx-auto bg-[#0a0a0c] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col justify-between">
      <div className="absolute inset-0 w-full h-full">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100 grayscale-[20%] brightness-110" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20 transform -scale-x-100" />
        {showSilhouette && <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <img src="/assets/sagoma-removebg-preview.webp" alt="Guida Silhouette" className="h-[95%] w-auto object-contain opacity-80 grayscale brightness-125"
            onError={(e) => {
              const parent = e.currentTarget.parentElement;
              if (parent) {
                e.currentTarget.style.display = 'none';
                const svgFallback = document.getElementById('silhouette-fallback');
                if (svgFallback) svgFallback.style.display = 'block';
              }
            }}
          />
          <svg id="silhouette-fallback" viewBox="0 0 200 300" className="h-[90%] w-auto hidden opacity-30">
            <path d="M100,50 C80,50 70,70 70,90 C70,110 80,130 100,130 C120,130 130,110 130,90 C130,70 120,50 100,50 M70,140 C40,140 20,180 20,220 L20,300 L180,300 L180,220 C180,180 160,140 130,140 L70,140" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
          </svg>
        </div>}
      </div>

      <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0a0c]/80 border border-white/10 backdrop-blur-md">
          <div className={`w-2 h-2 rounded-full ${isCalibrating ? 'bg-amber-400 animate-pulse' : isReady ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold text-white/80 font-mono uppercase tracking-wider">
            {isCalibrating ? `CALIBRAZIONE (${countdown}s)` : isReady ? 'PRONTO' : 'ATTESA'}
          </span>
        </div>
      </div>

      {detectedResult && (
        <div className="absolute top-6 right-6 z-40 pointer-events-none transition-all duration-300">
          <div className={`px-6 py-2.5 rounded-2xl backdrop-blur-xl border-2 flex items-center justify-center min-w-[100px] shadow-2xl ${
            detectedResult === 'SI' ? 'bg-[#4ade80]/20 border-[#4ade80]' : 'bg-rose-500/20 border-rose-500'
          }`}>
            <span className={`text-3xl font-black italic tracking-tighter ${detectedResult === 'SI' ? 'text-[#4ade80]' : 'text-rose-500'}`}>
              {detectedResult}
            </span>
          </div>
        </div>
      )}

      {isCalibrating && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="text-cyan-400 text-xs font-black tracking-[0.5em] mb-8 uppercase animate-pulse">Rimani Immobile</div>
          <div className="text-white text-[15rem] font-black leading-none drop-shadow-[0_0_50px_rgba(0,229,255,0.4)]">{countdown}</div>
        </div>
      )}

      <div className="absolute bottom-6 inset-x-6 z-30 flex flex-col gap-4">
        {isReady && !isCalibrating && (
          <div className="w-full max-w-md mx-auto bg-[#0a0a0c]/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex flex-col gap-1">
            <div className="flex justify-between text-[8px] font-mono text-white/40 uppercase tracking-wider">
              <span>NO (Indietro)</span>
              <span className="text-[#00e5ff]">Centro</span>
              <span>SI (Avanti)</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full relative overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/30 z-10" />
              <div className={`absolute inset-y-0 rounded-full transition-all duration-75 ${clampedOffset >= 0 ? 'bg-[#00e5ff] left-1/2' : 'bg-rose-500 right-1/2'}`}
                style={{ width: `${Math.min(Math.abs(clampedOffset) / 2, 50)}%` }} />
            </div>
          </div>
        )}

        {/* DESIGN RIMODULATO: Entrambi i bottoni visibili */}
        <div className="flex justify-center gap-3 flex-wrap">
          <button 
            onClick={handleCalibrate}
            disabled={isCalibrating || !isReady}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 disabled:opacity-30 text-white font-mono font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all active:scale-95"
          >
            {isCalibrating ? 'Calibrazione...' : '▶ AVVIA CALIBRAZIONE'}
          </button>

          {onVoiceGuide && (
            <button 
              onClick={onVoiceGuide}
              disabled={!isReady || isCalibrating}
              className="px-6 py-2.5 bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-400/40 disabled:opacity-30 text-white font-mono font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all active:scale-95 shadow-lg flex items-center gap-2"
            >
              🔊 ASCOLTA VOCE GUIDA
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="absolute inset-0 bg-[#0a0a0c]/90 z-50 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-rose-400 font-mono text-xs max-w-xs mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold font-mono tracking-widest uppercase text-white border border-white/10">
            Ricarica App
          </button>
        </div>
      )}
    </div>
  );
});

export default CameraView;
