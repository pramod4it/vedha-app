// ============================================================
// FILE: src/realtime/realtimeInterviewAssistant.ts
// Backend-only realtime interview assistant.
// ============================================================

import { DEFAULT_REALTIME_URL } from './constants';
import { AudioCapture } from './audioCapture';
import { RealtimeSocket } from './RealtimeSocket';
import type { AssistantStatus, RealtimeAssistantCallbacks } from './types';

let socket: RealtimeSocket | null = null;
let audio: AudioCapture | null = null;

export async function startRealtimeAssistant(callbacks: RealtimeAssistantCallbacks = {}) {
    callbacks.onStatusChange?.('connecting' as AssistantStatus);

    socket = new RealtimeSocket(
        {
            realtimeUrl: DEFAULT_REALTIME_URL,
        },
        {
            onOpen: () => {
                callbacks.onStatusChange?.('connected' as AssistantStatus);
            },
            onResponse: (message) => {
                callbacks.onStatusChange?.('responding' as AssistantStatus);
                callbacks.onResponse?.(message);
            },
            onClose: () => {
                callbacks.onStatusChange?.('disconnected' as AssistantStatus);
            },
            onError: (error) => {
                callbacks.onStatusChange?.('error' as AssistantStatus);
                callbacks.onError?.(error);
            },
        },
    );

    await socket.connect();

    audio = new AudioCapture(
        {},
        {
            onAudioData: (audioData) => {
                socket?.appendAudio(audioData);
            },
            onStart: () => {
                callbacks.onStatusChange?.('listening' as AssistantStatus);
            },
            onStop: () => {
                callbacks.onStatusChange?.('disconnected' as AssistantStatus);
            },
            onError: (error) => {
                callbacks.onStatusChange?.('error' as AssistantStatus);
                callbacks.onError?.(error);
            },
        },
    );

    await audio.start();
}

export function stopRealtimeAssistant() {
    audio?.stop();
    audio = null;

    socket?.disconnect();
    socket = null;
}
