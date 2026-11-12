import { MotionDetectionService } from './MotionDetectionService';
import { playFeedbackSound } from '../utils/sound';

export type AutomatedResponse = 'SI' | 'NO' | 'NON_RILEVATO';
export type VoiceStepStatus = 'COMPLETED' | 'CANCELLED' | 'VOICE_ERROR';

export interface AskQuestionResult {
    status: VoiceStepStatus;
    response: AutomatedResponse | null;
    attempts: number;
}

export class SessionGuard {
    private cancelled = false;
    constructor(private onCancel?: () => void) {}
    public isCancelled(): boolean { return this.cancelled; }
    public cancel(): void {
        this.cancelled = true;
        if (this.onCancel) this.onCancel();
    }
    public async delay(ms: number): Promise<boolean> {
        if (this.cancelled) return false;
        await new Promise(r => setTimeout(r, ms));
        return !this.cancelled;
    }
}

const INTERNAL_FALLBACK_KEY = "";

export class AdvancedVoiceService {
    private static activeInstances = new Set<AdvancedVoiceService>();

    public static isAnySpeaking(): boolean {
        if (typeof window !== 'undefined' && window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
            return true;
        }
        for (const inst of AdvancedVoiceService.activeInstances) {
            if (inst.isSpeaking()) return true;
        }
        return false;
    }

    public static stopAll(): void {
        for (const inst of AdvancedVoiceService.activeInstances) {
            try { inst.cancel(); } catch { /* ignore */ }
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
        }
    }

    private synthesis: SpeechSynthesis;
    private motionDetector: MotionDetectionService;
    private isWaitingForResponse = false;
    private responseTimeout: number | null = null;
    private movementHandler: ((event: any) => void) | null = null;
    private currentAudio: HTMLAudioElement | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private isPaused = false;
    private recognition: any = null;
    private dynamicApiKey: string | null = null;
    private activeSettlers: (() => void)[] = [];
    private epoch = 0;
    private isCancelledState = false;

    constructor() {
        AdvancedVoiceService.activeInstances.add(this);
        this.synthesis = window.speechSynthesis;
        this.motionDetector = new MotionDetectionService();
        try { this.synthesis.getVoices(); } catch { /* ignore */ }
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'it-IT';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
        }
    }

    private isPackaged() { return !!(window as any).Capacitor; }
    public setApiKey(key: string) { this.dynamicApiKey = key; }
    async initializeDetector(videoElement: HTMLVideoElement) { await this.motionDetector.initialize(videoElement); }
    public startManualDetection() { if (this.isPaused) return; this.motionDetector.startDetection(); this.dispatchStatus('listening', 'Rilevamento manuale attivo'); }
    public stopManualDetection() { this.motionDetector.stopDetection(); this.dispatchStatus('idle', ''); }
    public updateSensitivity(value: number) { this.motionDetector.setSensitivity(value); }

    public pause() {
        this.isPaused = true;
        if (this.currentAudio && !this.currentAudio.paused) this.currentAudio.pause();
        if (this.synthesis.speaking) this.synthesis.pause();
        if (this.isWaitingForResponse || this.motionDetector['isDetecting']) this.motionDetector.stopDetection();
        if (this.recognition) { try { this.recognition.stop(); } catch { /* ignore */ } }
        if (this.responseTimeout) { clearTimeout(this.responseTimeout); this.responseTimeout = null; }
        this.dispatchStatus('idle', '⏸️ TEST IN PAUSA');
    }

    public resume() {
        this.isPaused = false;
        this.dispatchStatus('idle', 'Ripresa in corso...');
        if (this.currentAudio && this.currentAudio.paused) {
            this.currentAudio.play().catch(e => console.error("Resume audio failed", e));
            this.dispatchStatus('speaking', 'Ripresa audio...');
        } else if (this.synthesis.paused) {
            this.synthesis.resume();
            this.dispatchStatus('speaking', 'Ripresa audio...');
        }
        if (this.isWaitingForResponse) {
            this.dispatchStatus('listening', 'Attendo una risposta (Oscilla SI/NO)...');
            this.motionDetector.startDetection();
            this.responseTimeout = window.setTimeout(async () => {
                if (this.isWaitingForResponse && !this.isPaused) {
                    this.stopResponseDetection();
                    await this.speak("Tempo scaduto. Non ho rilevato nessun movimento.");
                }
            }, 12000);
        }
    }

    public cancel() {
        this.epoch++;
        const settlers = this.activeSettlers;
        this.activeSettlers = [];
        this.isPaused = false;
        this.isWaitingForResponse = false;
        if (this.currentAudio) {
            try {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                this.currentAudio.src = "";
            } catch { /* ignore */ }
            this.currentAudio = null;
        }
        if (this.synthesis) {
            try {
                this.synthesis.cancel();
            } catch { /* ignore */ }
        }
        this.currentUtterance = null;
        this.motionDetector.stopDetection();
        this.stopListening();
        if (this.responseTimeout) {
            clearTimeout(this.responseTimeout);
            this.responseTimeout = null;
        }
        if (this.movementHandler) {
            window.removeEventListener('movementDetected', this.movementHandler);
            this.movementHandler = null;
        }
        this.dispatchStatus('idle', '');
        settlers.forEach(s => {
            try { s(); } catch { /* ignore */ }
        });
    }

    public isSpeaking(): boolean {
        const hasAudio = !!(this.currentAudio && !this.currentAudio.paused);
        const hasSynth = !!(this.synthesis && (this.synthesis.speaking || this.synthesis.pending));
        return hasAudio || hasSynth || this.isWaitingForResponse;
    }

    public destroy() {
        this.cancel();
        AdvancedVoiceService.activeInstances.delete(this);
    }

    public listenForCommand(command: string, callback: () => void) {
        if (!this.recognition || this.isPaused) return;
        this.dispatchStatus('listening', `Dì "${command}" per iniziare...`);
        setTimeout(() => { try { if (!this.isPaused) this.recognition.start(); } catch { /* ignore */ } }, 500);
        this.recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            if (transcript.includes(command.toLowerCase()) || transcript.includes('via') || transcript.includes('parti') || transcript.includes('start')) {
                this.dispatchStatus('speaking', 'Comando ricevuto.');
                playFeedbackSound('positive');
                callback();
            } else {
                setTimeout(() => { try { if (!this.isPaused) this.recognition.start(); } catch { /* ignore */ } }, 500);
            }
        };
        this.recognition.onerror = (event: any) => {
            if (event.error !== 'aborted' && !this.isPaused) {
                setTimeout(() => { try { if (!this.isPaused) this.recognition.start(); } catch { /* ignore */ } }, 1000);
            }
        };
    }

    public stopListening() { if (this.recognition) this.recognition.stop(); }

    private dispatchStatus(status: 'speaking' | 'listening' | 'idle', text: string) {
        window.dispatchEvent(new CustomEvent('voiceStatusUpdate', { detail: { status, text } }));
    }

    async askQuestionWithSingleRetry(question: string, userName = ''): Promise<AskQuestionResult> {
        const attempt1 = await this.askQuestion(question, userName);
        if (attempt1 !== 'NON_RILEVATO') return { status: 'COMPLETED', response: attempt1, attempts: 1 };
        
        const attempt2 = await this.askQuestion(question, userName);
        return { 
            status: 'COMPLETED', 
            response: attempt2, 
            attempts: 2 
        };
    }

    askQuestion(question: string, userName = ''): Promise<AutomatedResponse> {
        return new Promise((resolve) => {
            let done = false;
            const settle = (v: AutomatedResponse) => {
                if (done) return;
                done = true;
                this.activeSettlers = this.activeSettlers.filter(s => s !== wrapper);
                resolve(v);
            };
            const wrapper = () => settle('NON_RILEVATO');
            this.activeSettlers.push(wrapper);
            const myEpoch = this.epoch;
            const execute = async () => {
                if (this.isPaused || myEpoch !== this.epoch) { settle('NON_RILEVATO'); return; }
                this.isWaitingForResponse = true;
                const questionText = question.replace(/\(nome\)/g, userName);
                
                try {
                    await this.speak(questionText);
                } catch (e) {
                    this.stopResponseDetection();
                    settle('NON_RILEVATO');
                    return;
                }
                
                if (this.isPaused || myEpoch !== this.epoch) return;
                setTimeout(() => { if (!this.isPaused && myEpoch === this.epoch) this.startResponseDetection(settle); }, 500);
            };
            execute();
        });
    }

    private startResponseDetection(settle: (v: AutomatedResponse) => void) {
        this.motionDetector.startDetection();
        this.dispatchStatus('listening', 'Attendo una risposta (Oscilla SI/NO)...');
        if (this.movementHandler) window.removeEventListener('movementDetected', this.movementHandler);
        this.movementHandler = async (event: CustomEvent) => {
            if (this.isWaitingForResponse && !this.isPaused) {
                const direction = event.detail.direction;
                this.stopResponseDetection();
                let response: AutomatedResponse;
                if (direction === 'forward') response = 'SI';
                else if (direction === 'backward') response = 'NO';
                else response = 'NON_RILEVATO';
                
                // Keep the feedback text
                const feedbackText = response === 'SI' ? "Ho rilevato un SÌ." : response === 'NO' ? "Ho rilevato un NO." : "Non ho capito.";
                try { await this.speak(feedbackText); } catch { /* ignore */ }
                settle(response);
            }
        };
        window.addEventListener('movementDetected', this.movementHandler);
        if (this.responseTimeout) clearTimeout(this.responseTimeout);
        this.responseTimeout = window.setTimeout(async () => {
            if (this.isWaitingForResponse && !this.isPaused) {
                this.stopResponseDetection();
                try { await this.speak("Non ho rilevato nessun movimento."); } catch { /* ignore */ }
                settle('NON_RILEVATO');
            }
        }, 12000);
    }

    private stopResponseDetection() {
        this.isWaitingForResponse = false;
        this.motionDetector.stopDetection();
        this.dispatchStatus('idle', '');
        if (this.movementHandler) { window.removeEventListener('movementDetected', this.movementHandler); this.movementHandler = null; }
        if (this.responseTimeout) { clearTimeout(this.responseTimeout); this.responseTimeout = null; }
    }

    public stopSpeaking() { this.cancel(); }
    public calibrateDetector() { this.motionDetector.calibrate(); }
    public startDetection() { this.motionDetector.startDetection(); }
    public stopDetection() { this.motionDetector.stopDetection(); }

    private async nativeSpeak(text: string, myEpoch: number): Promise<boolean> {
        if (!this.isPackaged()) return false;
        try {
            const cap = (window as any).Capacitor;
            const pkgName = '@capacitor-community/text-to-speech';
            const mod: any = cap?.Plugins?.TextToSpeech ? { TextToSpeech: cap.Plugins.TextToSpeech } : await import(/* @vite-ignore */ pkgName).catch(() => null);
            if (!mod?.TextToSpeech) return false;
            if (myEpoch !== this.epoch) return false;
            const watchdog = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_MOTORE_4s')), 4000));
            await Promise.race([
                mod.TextToSpeech.speak({ text, lang: 'it-IT', rate: 0.95, pitch: 1.0, volume: 1.0, category: 'playback' }),
                watchdog
            ]);
            return true;
        } catch (e: any) {
            try {
                const cap = (window as any).Capacitor;
                const pkgName = '@capacitor-community/text-to-speech';
                const m: any = cap?.Plugins?.TextToSpeech ? { TextToSpeech: cap.Plugins.TextToSpeech } : await import(/* @vite-ignore */ pkgName).catch(() => null);
                if (m?.TextToSpeech?.stop) m.TextToSpeech.stop();
            } catch { /* ignore */ }
            const msg = String(e?.message || e?.code || e);
            console.warn('Native TTS failed:', msg);
            if (myEpoch === this.epoch) this.dispatchStatus('idle', 'DIAGNOSI VOCE NATIVA: ' + msg);
            return false;
        }
    }

    async speak(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let done = false;
            const settle = (err?: Error) => {
                if (done) return;
                done = true;
                this.activeSettlers = this.activeSettlers.filter(s => s !== settleWrapper);
                if (err) reject(err);
                else resolve();
            };
            const settleWrapper = () => settle();
            this.activeSettlers.push(settleWrapper);
            const myEpoch = this.epoch;
            const execute = async () => {
                if (this.isPaused || myEpoch !== this.epoch) { settle(); return; }
                if (this.currentAudio) { this.currentAudio.pause(); this.currentAudio = null; }
                if (this.synthesis.speaking) this.synthesis.cancel();
                this.dispatchStatus('speaking', text);

                if (await this.nativeSpeak(text, myEpoch)) {
                    if (myEpoch === this.epoch && !this.isPaused) settle();
                    return;
                }
                if (myEpoch !== this.epoch) { settle(); return; }

                const apiKey = navigator.onLine ? (this.dynamicApiKey || localStorage.getItem('GOOGLE_API_KEY') || INTERNAL_FALLBACK_KEY) : '';
                if (apiKey) {
                    try {
                        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                input: { text },
                                voice: { languageCode: 'it-IT', name: 'it-IT-Neural2-A' },
                                audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 }
                            })
                        });
                        if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || response.statusText); }
                        const data = await response.json();
                        if (data.audioContent && myEpoch === this.epoch) {
                            const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
                            this.currentAudio = audio;
                            audio.onended = () => { this.currentAudio = null; if (!this.isPaused) settle(); };
                            audio.onerror = () => { this.currentAudio = null; settle(new Error('Audio playback error')); };
                            await audio.play();
                            return;
                        }
                    } catch (error) { console.warn("Cloud TTS failed (Using Browser Fallback). Reason:", error); }
                }

                setTimeout(() => {
                    if (myEpoch !== this.epoch) { settle(); return; }
                    let spoke = false;
                    const finish = (err?: any) => {
                        if (done) return;
                        clearTimeout(safety);
                        clearTimeout(kick);
                        clearTimeout(retryT);
                        this.currentUtterance = null;
                        if (err) {
                            console.warn("SpeechSynthesis error:", err);
                            settle(new Error('SpeechSynthesis failed'));
                        } else {
                            if (myEpoch === this.epoch && !spoke && !this.isPaused) {
                                this.dispatchStatus('idle', 'DIAGNOSI: sintesi di sistema muta.');
                            }
                            settle();
                        }
                    };
                    const safety = window.setTimeout(() => finish(new Error('Timeout')), Math.max(20000, text.length * 150));
                    const kick = window.setTimeout(() => { try { this.synthesis.resume(); } catch { /* ignore */ } }, 250);
                    const buildAndSpeak = () => {
                        if (myEpoch !== this.epoch) return;
                        try { this.synthesis.cancel(); this.synthesis.resume(); } catch { /* ignore */ }
                        const utterance = new SpeechSynthesisUtterance(text);
                        this.currentUtterance = utterance;
                        utterance.lang = 'it-IT';
                        utterance.rate = 0.95;
                        utterance.volume = 1.0;
                        const voices = this.synthesis.getVoices();
                        const selectedVoice = voices.find(v => v.name.includes("Microsoft Elsa") && v.lang.includes('it')) ||
                            voices.find(v => v.name.includes("Google italiano")) ||
                            voices.find(voice => voice.lang.includes('it'));
                        if (selectedVoice) utterance.voice = selectedVoice;
                        utterance.onstart = () => { spoke = true; };
                        utterance.onend = () => finish();
                        utterance.onerror = (e) => finish(e);
                        this.synthesis.speak(utterance);
                    };
                    buildAndSpeak();
                    const retryT = window.setTimeout(() => { if (!done && !this.synthesis.speaking) buildAndSpeak(); }, 1200);
                }, 100);
            };
            execute();
        });
    }
}

// Intercettore globale dei click:
// Se qualsiasi voce guida o sintesi vocale è attiva e l'utente clicca qualsiasi pulsante o elemento interattivo
// sullo schermo (es. Esci, Ripeti, Torna alla home, Calibra, Avvia test, ecc.), la voce si spegne istantaneamente.
if (typeof window !== 'undefined' && !(window as any).__voiceClickInterceptorAttached) {
    (window as any).__voiceClickInterceptorAttached = true;
    window.addEventListener(
        'click',
        (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            const clickable = target.closest('button, a, [role="button"], input[type="button"], input[type="submit"]');
            if (!clickable) return;

            // Se l'elemento è esplicitamente autorizzato a mantenere/gestire la voce (es. toggle guida vocale)
            if (clickable.getAttribute('data-keep-voice') === 'true') {
                return;
            }

            // Spegne immediatamente qualsiasi voce guida o audio in riproduzione
            if (AdvancedVoiceService.isAnySpeaking()) {
                AdvancedVoiceService.stopAll();
            }
        },
        true
    );
}
