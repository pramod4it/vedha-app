type RuntimeEnv =
    Record<string, string | undefined>;

const getRuntimeEnv =
    (): RuntimeEnv => {
        if (typeof process !== 'undefined' && process.env) {
            return process.env;
        }

        return {};
    };

const runtimeEnv =
    getRuntimeEnv();

export const DEFAULT_REALTIME_URL =
    runtimeEnv.VITE_BACKEND_MANUAL_WS_URL ||
    `${runtimeEnv.VITE_API_BASE_URL || 'http://localhost:9090'}/ws/interview/manual`
        .replace(/^http:/, 'ws:')
        .replace(/^https:/, 'wss:');

export const WEBSOCKET_RECONNECT_DELAY =
    3000;

export const WEBSOCKET_MAX_RETRIES =
    10;

export const ASSISTANT_STATUS = {
    IDLE: 'idle',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RESPONDING: 'responding',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
} as const;
