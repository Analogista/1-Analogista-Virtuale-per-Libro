import { MotionDetectionService } from './MotionDetectionService';
import { playFeedbackSound } from '../utils/sound';

export type AutomatedResponse = 'SI' | 'NO' | 'NON_RILEVATO';

const INTERNAL_FALLBACK_KEY = "";

export class AdvancedVoiceService {
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

    constructor() {
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
        if (this.currentAudio) { this.currentAudio.pause(); this.currentAudio = null; }
        this.synthesis.cancel();
        this.currentUtterance = null;
        this.motionDetector.stopDetection();
        this.stopListening();
        if (this.responseTimeout) clearTimeout(this.responseTimeout);
        if (this.movementHandler) window.removeEventListener('movementDetected', this.movementHandler);
        this.dispatchStatus('idle', '');
        settlers.forEach(s => s());
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
                await this.speak(questionText);
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
                const feedbackText = response === 'SI' ? "Ho rilevato un SÌ." : response === 'NO' ? "Ho rilevato un NO." : "Non ho capito.";
                await this.speak(feedbackText);
                settle(response);
            }
        };
        window.addEventListener('movementDetected', this.movementHandler);
        if (this.responseTimeout) clearTimeout(this.responseTimeout);
        this.responseTimeout = window.setTimeout(async () => {
            if (this.isWaitingForResponse && !this.isPaused) {
                this.stopResponseDetection();
                await this.speak("Non ho rilevato nessun movimento.");
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
        return new Promise((resolve) => {
            let done = false;
            const settle = () => {
                if (done) return;
                done = true;
                this.activeSettlers = this.activeSettlers.filter(s => s !== settle);
                resolve();
            };
            this.activeSettlers.push(settle);
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
                            audio.onerror = () => { this.currentAudio = null; settle(); };
                            await audio.play();
                            return;
                        }
                    } catch (error) { console.warn("Cloud TTS failed (Using Browser Fallback). Reason:", error); }
                }

                setTimeout(() => {
                    if (myEpoch !== this.epoch) { settle(); return; }
                    let spoke = false;
                    const finish = () => {
                        if (done) return;
                        clearTimeout(safety);
                        clearTimeout(kick);
                        clearTimeout(retryT);
                        this.currentUtterance = null;
                        if (myEpoch === this.epoch && !spoke && !this.isPaused) {
                            this.dispatchStatus('idle', 'DIAGNOSI: sintesi di sistema muta. Controlla volume multimediale e impostazioni TTS del dispositivo.');
                        }
                        settle();
                    };
                    const safety = window.setTimeout(finish, Math.max(20000, text.length * 150));
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
                        utterance.onend = finish;
                        utterance.onerror = finish;
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
