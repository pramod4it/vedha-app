// ============================================================
// FILE: src/realtime/RealtimeSocket.ts
// Backend manual-question websocket client. Model providers stay on the backend.
// ============================================================

import {
    WEBSOCKET_MAX_RETRIES,
    WEBSOCKET_RECONNECT_DELAY,
} from './constants';

export interface RealtimeSocketCallbacks {
    onResponse?: (response: string) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onReconnecting?: (attempt: number, delayMs: number) => void;
    onReconnectFailed?: () => void;
    onError?: (error: unknown) => void;
}

export interface RealtimeSocketConfig {
    realtimeUrl: string;
    autoReconnect?: boolean;
    reconnectDelayMs?: number;
    maxReconnectAttempts?: number;
}

export class RealtimeSocket {
    private ws: WebSocket | null = null;

    private callbacks: RealtimeSocketCallbacks;

    private config: RealtimeSocketConfig;

    private connected = false;

    private manuallyClosed = false;

    private reconnectAttempts = 0;

    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    private pendingConnectResolve: (() => void) | null = null;

    private pendingConnectReject: ((error: unknown) => void) | null = null;

    constructor(
        config: RealtimeSocketConfig,
        callbacks: RealtimeSocketCallbacks,
    ) {
        this.config = {
            autoReconnect: true,
            reconnectDelayMs: WEBSOCKET_RECONNECT_DELAY,
            maxReconnectAttempts: WEBSOCKET_MAX_RETRIES,
            ...config,
        };
        this.callbacks = callbacks;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.manuallyClosed = false;
            this.reconnectAttempts = 0;
            this.pendingConnectResolve = resolve;
            this.pendingConnectReject = reject;
            this.openSocket();
        });
    }

    sendControlMessage(payload: Record<string, unknown>) {
        if (!this.ws || !this.connected || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        this.ws.send(JSON.stringify(payload));
    }

    requestResponse() {
        // Backend handles transcription, question detection, and answer generation.
    }

    isConnected(): boolean {
        return this.connected;
    }

    disconnect() {
        this.manuallyClosed = true;
        this.clearReconnectTimer();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.connected = false;
    }

    private openSocket() {
        try {
            this.clearReconnectTimer();

            console.info(
                '[RealtimeSocket] Connecting to backend manual websocket:',
                this.config.realtimeUrl,
            );

            this.ws = new WebSocket(this.config.realtimeUrl);
            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen = () => {
                console.info('[RealtimeSocket] Backend manual websocket connected');
                this.connected = true;
                this.reconnectAttempts = 0;
                this.callbacks.onOpen?.();
                this.pendingConnectResolve?.();
                this.pendingConnectResolve = null;
                this.pendingConnectReject = null;
            };

            this.ws.onmessage = (event) => {
                if (typeof event.data === 'string') {
                    console.info(
                        '[RealtimeSocket] Backend manual websocket response received length=',
                        event.data.length,
                    );
                    this.callbacks.onResponse?.(event.data);
                }
            };

            this.ws.onerror = (event) => {
                console.error('[RealtimeSocket] Backend manual websocket error', event);
                this.connected = false;
                this.callbacks.onError?.(event);
            };

            this.ws.onclose = (event) => {
                console.info(
                    '[RealtimeSocket] Backend manual websocket closed',
                    event.code,
                    event.reason,
                );
                this.connected = false;
                this.ws = null;

                if (this.manuallyClosed) {
                    this.callbacks.onClose?.();
                    return;
                }

                this.scheduleReconnect();
            };
        } catch (error) {
            this.connected = false;
            this.callbacks.onError?.(error);
            this.scheduleReconnect(error);
        }
    }

    private scheduleReconnect(lastError?: unknown) {
        if (!this.config.autoReconnect) {
            this.callbacks.onClose?.();
            this.pendingConnectReject?.(lastError || new Error('WebSocket disconnected'));
            this.pendingConnectResolve = null;
            this.pendingConnectReject = null;
            return;
        }

        const maxAttempts =
            this.config.maxReconnectAttempts || WEBSOCKET_MAX_RETRIES;

        if (this.reconnectAttempts >= maxAttempts) {
            console.error('[RealtimeSocket] Backend manual websocket reconnect failed');
            this.callbacks.onReconnectFailed?.();
            this.callbacks.onClose?.();
            this.pendingConnectReject?.(
                lastError || new Error('Backend websocket reconnect failed'),
            );
            this.pendingConnectResolve = null;
            this.pendingConnectReject = null;
            return;
        }

        const delayMs =
            this.config.reconnectDelayMs || WEBSOCKET_RECONNECT_DELAY;

        this.reconnectAttempts += 1;
        this.callbacks.onReconnecting?.(
            this.reconnectAttempts,
            delayMs,
        );

        this.reconnectTimer = setTimeout(
            () => this.openSocket(),
            delayMs,
        );
    }

    private clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
