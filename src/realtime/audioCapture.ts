// ============================================================
// FILE: src/realtime/audioCapture.ts
// ============================================================

export interface AudioCaptureCallbacks {

    onAudioData?: (
        audioData: ArrayBuffer
    ) => void;

    onStart?: () => void;

    onStop?: () => void;

    onError?: (
        error: any
    ) => void;
}

export interface AudioCaptureConfig {

    sampleRate?: number;

    channelCount?: number;

    echoCancellation?: boolean;

    noiseSuppression?: boolean;

    autoGainControl?: boolean;

    processorBufferSize?: number;
}

// ============================================================
// AUDIO CAPTURE
// ============================================================

export class AudioCapture {

    private audioContext:
        AudioContext | null = null;

    private mediaStream:
        MediaStream | null = null;

    private sourceNode:
        MediaStreamAudioSourceNode | null = null;

    private processor:
        ScriptProcessorNode | null = null;

    private started =
        false;

    private callbacks:
        AudioCaptureCallbacks;

    private config:
        AudioCaptureConfig;

    constructor(

        config:
        AudioCaptureConfig = {},

        callbacks:
        AudioCaptureCallbacks = {}
    ) {

        this.config = {

            sampleRate:
                config.sampleRate || 24000,

            channelCount:
                config.channelCount || 1,

            echoCancellation:
                config.echoCancellation ?? true,

            noiseSuppression:
                config.noiseSuppression ?? true,

            autoGainControl:
                config.autoGainControl ?? true,

            processorBufferSize:
                config.processorBufferSize || 4096
        };

        this.callbacks =
            callbacks;
    }

    // ========================================================
    // START
    // ========================================================

    async start(): Promise<void> {

        if (this.started) {
            return;
        }

        try {

            console.log(
                "🎤 Requesting microphone access..."
            );

            this.mediaStream =
                await navigator
                    .mediaDevices
                    .getUserMedia({

                        audio: {

                            channelCount:
                            this.config
                                .channelCount,

                            sampleRate:
                            this.config
                                .sampleRate,

                            echoCancellation:
                            this.config
                                .echoCancellation,

                            noiseSuppression:
                            this.config
                                .noiseSuppression,

                            autoGainControl:
                            this.config
                                .autoGainControl
                        },

                        video: false
                    });

            this.audioContext =
                new AudioContext({

                    sampleRate:
                    this.config
                        .sampleRate
                });

            this.sourceNode =
                this.audioContext
                    .createMediaStreamSource(
                        this.mediaStream
                    );

            this.processor =
                this.audioContext
                    .createScriptProcessor(

                        this.config
                            .processorBufferSize,

                        1,

                        1
                    );

            this.sourceNode.connect(
                this.processor
            );

            this.processor.connect(
                this.audioContext.destination
            );

            this.processor.onaudioprocess =
                (
                    event
                ) => {

                    try {

                        const inputData =
                            event
                                .inputBuffer
                                .getChannelData(0);

                        const pcmBuffer =
                            this.convertFloat32ToPCM16(
                                inputData
                            );

                        this.callbacks
                            .onAudioData
                            ?.(
                                pcmBuffer
                            );

                    } catch (e) {

                        console.error(
                            "Audio process failed",
                            e
                        );
                    }
                };

            this.started = true;

            console.log(
                "✅ Microphone capture started"
            );

            this.callbacks
                .onStart
                ?.();

        } catch (e) {

            console.error(
                "❌ Audio capture failed",
                e
            );

            this.callbacks
                .onError
                ?.(
                    e
                );

            throw e;
        }
    }

    // ========================================================
    // STOP
    // ========================================================

    stop() {

        try {

            console.log(
                "🛑 Stopping microphone capture..."
            );

            if (this.processor) {

                this.processor.disconnect();

                this.processor = null;
            }

            if (this.sourceNode) {

                this.sourceNode.disconnect();

                this.sourceNode = null;
            }

            if (this.mediaStream) {

                this.mediaStream
                    .getTracks()
                    .forEach(track =>
                        track.stop()
                    );

                this.mediaStream = null;
            }

            if (this.audioContext) {

                this.audioContext.close();

                this.audioContext = null;
            }

            this.started = false;

            console.log(
                "✅ Microphone capture stopped"
            );

            this.callbacks
                .onStop
                ?.();

        } catch (e) {

            console.error(
                "Audio stop failed",
                e
            );
        }
    }

    // ========================================================
    // STATUS
    // ========================================================

    isStarted(): boolean {

        return this.started;
    }

    // ========================================================
    // FLOAT32 -> PCM16
    // ========================================================

    private convertFloat32ToPCM16(
        buffer: Float32Array
    ): ArrayBuffer {

        const pcm16 =
            new Int16Array(
                buffer.length
            );

        for (
            let i = 0;
            i < buffer.length;
            i++
        ) {

            let s = Math.max(
                -1,
                Math.min(1, buffer[i])
            );

            pcm16[i] =

                s < 0

                    ? s * 0x8000

                    : s * 0x7fff;
        }

        return pcm16.buffer;
    }

}
