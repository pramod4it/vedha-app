// ============================================================
// FILE: src/realtime/types.ts
// ============================================================

// ============================================================
// REALTIME SOCKET
// ============================================================

export interface RealtimeSocketCallbacks {

    onTranscript?: (
        transcript: string
    ) => void;

    onResponse?: (
        response: string
    ) => void;

    onOpen?: () => void;

    onClose?: () => void;

    onError?: (
        error: any
    ) => void;
}

export interface RealtimeSocketConfig {
    realtimeUrl: string;
}

// ============================================================
// AUDIO CAPTURE
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
// TRANSCRIPT STORE
// ============================================================

export interface TranscriptMessage {

    id: string;

    role:
        | "interviewer"
        | "assistant"
        | "system";

    text: string;

    timestamp: number;
}

export interface ConversationContext {

    messages:
        TranscriptMessage[];

    lastTranscript: string;

    lastResponse: string;
}

// ============================================================
// REALTIME ASSISTANT
// ============================================================

export interface RealtimeAssistantCallbacks {

    onTranscript?: (
        transcript: string
    ) => void;

    onResponse?: (
        response: string
    ) => void;

    onStatusChange?: (
        status: AssistantStatus
    ) => void;

    onError?: (
        error: any
    ) => void;
}

export interface RealtimeAssistantConfig {
    realtimeUrl: string;

    autoReconnect?: boolean;

    autoRequestResponse?: boolean;
}

// ============================================================
// STATUS
// ============================================================

export type AssistantStatus =

    | "idle"

    | "connecting"

    | "connected"

    | "listening"

    | "processing"

    | "responding"

    | "disconnected"

    | "error";

// ============================================================
// AUDIO EVENTS
// ============================================================

export interface AudioChunkEvent {

    type: "audio_chunk";

    audio: string;

    timestamp: number;
}

export interface TranscriptEvent {

    type: "transcript";

    transcript: string;

    timestamp: number;
}

export interface ResponseEvent {

    type: "response";

    response: string;

    timestamp: number;
}

// ============================================================
// BACKEND REALTIME EVENTS
// ============================================================

export interface BackendRealtimeEvent {

    type: string;

    [key: string]: any;
}

export interface RealtimeSessionUpdateEvent {

    type: "session.update";

    session: {

        modalities?: string[];

        input_audio_format?: string;

        output_audio_format?: string;

        turn_detection?: {

            type?: string;

            threshold?: number;

            prefix_padding_ms?: number;

            silence_duration_ms?: number;
        };
    };
}

export interface InputAudioAppendEvent {

    type: "input_audio_buffer.append";

    audio: string;
}

export interface InputAudioCommitEvent {

    type: "input_audio_buffer.commit";
}

export interface ResponseCreateEvent {

    type: "response.create";

    response?: {

        modalities?: string[];

    };
}

// ============================================================
// OVERLAY
// ============================================================

export interface OverlayState {

    visible: boolean;

    transcript: string;

    response: string;

    status: AssistantStatus;
}

// ============================================================
// OCR
// ============================================================

export interface OCRResult {

    text: string;

    confidence?: number;

    raw?: any;
}

// ============================================================
// SCREENSHOT
// ============================================================

export interface ScreenshotPayload {

    imageBase64: string;

    timestamp: number;
}

// ============================================================
// INTERVIEW QUESTION
// ============================================================

export interface InterviewQuestion {

    question: string;

    category?:
        | "dsa"
        | "system-design"
        | "java"
        | "spring"
        | "database"
        | "behavioral"
        | "other";

    timestamp: number;
}

// ============================================================
// AI ANSWER
// ============================================================

export interface AIAnswer {

    answer: string;

    hints?: string[];

    code?: string;

    timeComplexity?: string;

    spaceComplexity?: string;

    timestamp: number;
}
