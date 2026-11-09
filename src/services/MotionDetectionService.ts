import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export class MotionDetectionService {
    public id: string = Math.random().toString(36).substring(2, 9);
    private video: HTMLVideoElement | null = null;
    private poseLandmarker: PoseLandmarker | null = null;
    private isDetecting = false;
    private animationFrameId: number | null = null;

    // Parametri Pro V2: mantenuti compatibili con il comportamento esistente.
    private smoothingFactor = 0.8;
    private currentSmoothedDepth: number | null = null;
    private neutralDepth = 0;
    private hysteresisFactor = 0.4;
    private audioDebounce = 600;
    private lastAudioTrigger = 0;
    private sensitivity = 0.015;

    // Calibrazione robusta.
    private isCalibrating = false;
    private calibrationSamples: number[] = [];
    private calibrationDeadline = 0;
    private calibrationResolve: ((success: boolean) => void) | null = null;
    private readonly minimumCalibrationSamples = 8;
    private readonly maximumCalibrationStandardDeviation = 0.012;

    private lastResult: 'forward' | 'backward' | 'none' = 'none';

    async initialize(videoElement: HTMLVideoElement): Promise<boolean> {
        this.video = videoElement;

        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
            );
            const options = {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                    delegate: "GPU" as const
                },
                runningMode: "VIDEO" as const,
                numPoses: 1
            };

            try {
                this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, options);
            } catch (gpuError) {
                console.warn("Delegate GPU non disponibile, provo CPU:", gpuError);
                this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                    ...options,
                    baseOptions: { ...options.baseOptions, delegate: "CPU" as const }
                });
            }

            console.log(`MediaPipe PoseLandmarker inizializzato (ID: ${this.id})`);
            return true;
        } catch (error) {
            console.error("Errore inizializzazione MediaPipe:", error);
            this.poseLandmarker = null;
            return false;
        }
    }

    setSensitivity(value: number) {
        const normalized = Math.max(0, Math.min(100, value));
        this.sensitivity = 0.05 - (normalized / 100) * 0.045;
    }

    /** Compatibilità con le schermate esistenti: la calibrazione normale usa calibrateFromSamples. */
    calibrate() {
        if (this.currentSmoothedDepth !== null) {
            this.neutralDepth = this.currentSmoothedDepth;
        }
    }

    async calibrateFromSamples(durationMs = 1500): Promise<boolean> {
        if (!this.poseLandmarker || !this.video) return false;

        this.stopDetection();
        this.isCalibrating = true;
        this.calibrationSamples = [];
        this.calibrationDeadline = performance.now() + durationMs;
        this.currentSmoothedDepth = null;
        this.lastResult = 'none';

        return new Promise(resolve => {
            this.calibrationResolve = resolve;
            this.isDetecting = true;
            this.detect();
        });
    }

    startDetection() {
        if (!this.poseLandmarker || this.isDetecting) return;
        this.isDetecting = true;
        this.lastResult = 'none';
        this.currentSmoothedDepth = null;
        this.detect();
    }

    stopDetection() {
        this.isDetecting = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private calculateDepth(landmarks: any[]): number | null {
        const nose = landmarks[0];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        if (!nose || !leftShoulder || !rightShoulder) return null;

        const visibility = [nose, leftShoulder, rightShoulder]
            .map(point => typeof point.visibility === 'number' ? point.visibility : 1);
        if (visibility.some(value => value < 0.5)) return null;

        const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
        const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const shoulderWidth = Math.hypot(
            leftShoulder.x - rightShoulder.x,
            leftShoulder.y - rightShoulder.y
        );
        const noseToSpineDist = Math.hypot(
            nose.x - midShoulderX,
            nose.y - midShoulderY
        );

        return (shoulderWidth * 0.7) + (noseToSpineDist * 0.3);
    }

    private standardDeviation(values: number[]): number {
        if (values.length === 0) return Number.POSITIVE_INFINITY;
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    private finishCalibration(): void {
        const samples = [...this.calibrationSamples];
        const standardDeviation = this.standardDeviation(samples);
        const success = samples.length >= this.minimumCalibrationSamples
            && Number.isFinite(standardDeviation)
            && standardDeviation <= this.maximumCalibrationStandardDeviation;

        if (success) {
            const ordered = samples.sort((a, b) => a - b);
            const middle = Math.floor(ordered.length / 2);
            this.neutralDepth = ordered.length % 2 === 0
                ? (ordered[middle - 1] + ordered[middle]) / 2
                : ordered[middle];
            this.currentSmoothedDepth = this.neutralDepth;
            console.log("Calibrazione completata", {
                samples: ordered.length,
                standardDeviation,
                neutralDepth: this.neutralDepth
            });
        } else {
            console.warn("Calibrazione non stabile", {
                samples: samples.length,
                standardDeviation
            });
        }

        this.isCalibrating = false;
        const resolveCalibration = this.calibrationResolve;
        this.calibrationResolve = null;
        resolveCalibration?.(success);
    }

    private detect = () => {
        if (!this.isDetecting || !this.video || !this.poseLandmarker) return;

        const startTimeMs = performance.now();
        const results = this.poseLandmarker.detectForVideo(this.video, startTimeMs);
        const landmarks = results.landmarks?.[0];
        const rawDepth = landmarks ? this.calculateDepth(landmarks) : null;

        if (rawDepth !== null) {
            this.currentSmoothedDepth = this.currentSmoothedDepth === null
                ? rawDepth
                : (this.currentSmoothedDepth * this.smoothingFactor) + (rawDepth * (1 - this.smoothingFactor));

            if (this.isCalibrating) {
                this.calibrationSamples.push(this.currentSmoothedDepth);
                if (performance.now() >= this.calibrationDeadline) this.finishCalibration();
                this.animationFrameId = requestAnimationFrame(this.detect);
                return;
            }

            const offset = this.currentSmoothedDepth - this.neutralDepth;
            const threshold = this.sensitivity;
            const returnThreshold = threshold * this.hysteresisFactor;
            const currentResult: 'forward' | 'backward' | 'none' =
                offset > threshold ? 'forward' :
                offset < -threshold ? 'backward' :
                Math.abs(offset) < returnThreshold ? 'none' :
                this.lastResult;

            const now = Date.now();
            if (currentResult !== 'none' && currentResult !== this.lastResult && now - this.lastAudioTrigger > this.audioDebounce) {
                this.lastAudioTrigger = now;
                window.dispatchEvent(new CustomEvent('movementDetected', {
                    detail: { serviceId: this.id, direction: currentResult, intensity: Math.abs(offset) }
                }));
            }
            this.lastResult = currentResult;

            window.dispatchEvent(new CustomEvent('depthUpdate', {
                detail: { serviceId: this.id, depth: this.currentSmoothedDepth, delta: offset, neutral: this.neutralDepth, threshold }
            }));

            window.dispatchEvent(new CustomEvent('landmarksProcessed', {
                detail: { serviceId: this.id, landmarks }
            }));

            const nose = landmarks[0];
            if (nose) {
                window.dispatchEvent(new CustomEvent('movementCenterUpdate', {
                    detail: { serviceId: this.id, center: { x: nose.x * 100, y: nose.y * 100 } }
                }));
            }
        } else {
            window.dispatchEvent(new CustomEvent('landmarksProcessed', {
                detail: { serviceId: this.id, landmarks: [] }
            }));
        }

        this.animationFrameId = requestAnimationFrame(this.detect);
    };
}
