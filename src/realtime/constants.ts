// ============================================================
// FILE: src/realtime/constants.ts
// ============================================================

export const DEFAULT_REALTIME_URL =
    import.meta.env.VITE_BACKEND_AUDIO_WS_URL ||
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090'}/ws/interview/audio`
        .replace(/^http:/, 'ws:')
        .replace(/^https:/, 'wss:');

// ============================================================
// AUDIO
// ============================================================

export const AUDIO_SAMPLE_RATE =
    24000;

export const AUDIO_CHANNEL_COUNT =
    1;

export const AUDIO_BUFFER_SIZE =
    4096;

// ============================================================
// AUDIO FEATURES
// ============================================================

export const ENABLE_ECHO_CANCELLATION =
    true;

export const ENABLE_NOISE_SUPPRESSION =
    true;

export const ENABLE_AUTO_GAIN_CONTROL =
    true;

// ============================================================
// REALTIME SESSION
// ============================================================

export const DEFAULT_INSTRUCTIONS = `

You are a realtime interview assistant.

Rules:
- Answer extremely fast
- Keep answers concise
- Focus on technical interviews
- Help with DSA problems
- Explain Java and Spring clearly
- Provide optimized solutions
- Prefer short direct answers
- Avoid unnecessary verbosity
- Prioritize low latency
- Help during live coding rounds

`;

// ============================================================
// TURN DETECTION
// ============================================================

export const TURN_DETECTION_THRESHOLD =
    0.5;

export const PREFIX_PADDING_MS =
    300;

export const SILENCE_DURATION_MS =
    500;

// ============================================================
// TRANSCRIPT
// ============================================================

export const MAX_TRANSCRIPT_MESSAGES =
    100;

export const RECENT_CONTEXT_LIMIT =
    10;

// ============================================================
// RESPONSE
// ============================================================

export const MAX_RESPONSE_LENGTH =
    4000;

// ============================================================
// WEBSOCKET
// ============================================================

export const WEBSOCKET_RECONNECT_DELAY =
    3000;

export const WEBSOCKET_MAX_RETRIES =
    10;

// ============================================================
// OVERLAY
// ============================================================

export const OVERLAY_WIDTH =
    500;

export const OVERLAY_HEIGHT =
    700;

// ============================================================
// OCR
// ============================================================

export const OCR_LANGUAGE =
    "eng";

// ============================================================
// SCREENSHOT
// ============================================================

export const SCREENSHOT_QUALITY =
    90;

// ============================================================
// STORAGE KEYS
// ============================================================

export const STORAGE_KEYS = {

    TRANSCRIPTS:
        "realtime_transcripts",

    SETTINGS:
        "realtime_settings",

    SESSION:
        "realtime_session"
};

// ============================================================
// STATUS
// ============================================================

export const ASSISTANT_STATUS = {

    IDLE:
        "idle",

    CONNECTING:
        "connecting",

    CONNECTED:
        "connected",

    LISTENING:
        "listening",

    PROCESSING:
        "processing",

    RESPONDING:
        "responding",

    DISCONNECTED:
        "disconnected",

    ERROR:
        "error"
} as const;

// ============================================================
// INTERVIEW KEYWORDS
// ============================================================

export const QUESTION_KEYWORDS = [

    "explain",

    "difference between",

    "what is",

    "how does",

    "implement",

    "optimize",

    "complexity",

    "design",

    "algorithm",

    "java",

    "spring",

    "database",

    "thread",

    "microservice",

    "react",

    "system design",

    "coding problem"
];

// ============================================================
// FILE TYPES
// ============================================================

export const SUPPORTED_IMAGE_TYPES = [

    "image/png",

    "image/jpeg",

    "image/webp"
];

// ============================================================
// DEBUG
// ============================================================

export const ENABLE_REALTIME_LOGS =
    true;

// ============================================================
// ENV VALIDATION
// ============================================================

export function validateRealtimeConfig() {
    if (!DEFAULT_REALTIME_URL) {

        throw new Error(

            "Missing realtime URL"
        );
    }
}
