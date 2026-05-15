// ============================================================
// FILE: src/hooks/useRealtimeAssistant.ts
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerDepth, InterviewMetadata } from "@shared/api.ts";

import { AudioCapture } from "../realtime/audioCapture";

import { RealtimeSocket } from "../realtime/RealtimeSocket";

import { transcriptStore } from "../realtime/transcriptStore";

import {

    ASSISTANT_STATUS,

    DEFAULT_REALTIME_URL,

} from "../realtime/constants";

import type {
    AssistantStatus,

    RealtimeAssistantConfig

} from "../realtime/types";

const LIVE_RESUME_CONTEXT_LIMIT =
    12000;

function appendInterviewMetadataToUrl(
    realtimeUrl: string,
    metadata: InterviewMetadata | null | undefined,
): string {
    if (!metadata) {
        return realtimeUrl;
    }

    const url = new URL(realtimeUrl);
    url.searchParams.set('companyName', metadata.companyName);
    url.searchParams.set('interviewerName', metadata.interviewerName);
    url.searchParams.set('interviewRound', metadata.interviewRound);
    url.searchParams.set('answerDepth', metadata.answerDepth || 'medium');

    return url.toString();
}

function limitText(
    value: string | undefined,
    maxLength: number,
): string | undefined {
    if (!value || value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength)}\n\n[Resume context truncated for live audio session.]`;
}

function metadataForLiveSocket(
    metadata: InterviewMetadata,
): InterviewMetadata {
    return {
        ...metadata,
        resumeSummary: limitText(
            metadata.resumeSummary,
            LIVE_RESUME_CONTEXT_LIMIT,
        ),
    };
}

// ============================================================
// HOOK
// ============================================================

export function useRealtimeAssistant(

    config: Partial<
        RealtimeAssistantConfig
    > = {}

) {

    // ========================================================
    // STATE
    // ========================================================

    const [status, setStatus] =
        useState<AssistantStatus>(
            ASSISTANT_STATUS.IDLE
        );

    const [running, setRunning] =
        useState(false);

    const [transcript, setTranscript] =
        useState("");

    const [response, setResponse] =
        useState("");

    const [error, setError] =
        useState("");

    const [audioEnabled, setAudioEnabledState] =
        useState(true);

    // ========================================================
    // REFS
    // ========================================================

    const socketRef =
        useRef<RealtimeSocket | null>(
            null
        );

    const audioRef =
        useRef<AudioCapture | null>(
            null
        );

    const mountedRef =
        useRef(true);

    const runningRef =
        useRef(false);

    const startingRef =
        useRef(false);

    const startTokenRef =
        useRef(0);

    const backendAudioPausedRef =
        useRef(false);

    const audioEnabledRef =
        useRef(true);

    // ========================================================
    // START
    // ========================================================

    const start = useCallback(
        async () => {

            try {

                if (
                    runningRef.current ||
                    startingRef.current
                ) {
                    return;
                }

                startingRef.current = true;

                const startToken =
                    startTokenRef.current + 1;

                startTokenRef.current =
                    startToken;

                setError("");

                setTranscript("");

                setResponse("");

                transcriptStore.clear();

                setStatus(
                    ASSISTANT_STATUS.CONNECTING
                );

                // ============================================
                // SOCKET
                // ============================================

                const metadataResult =
                    await window.electronAPI.getInterviewMetadata();

                if (
                    !mountedRef.current ||
                    startTokenRef.current !== startToken
                ) {
                    return;
                }

                const realtimeUrl =
                    appendInterviewMetadataToUrl(
                        config.realtimeUrl ||
                            DEFAULT_REALTIME_URL,
                        metadataResult.success
                            ? metadataResult.metadata
                            : null,
                    );

                const answerDepth =
                    metadataResult.success
                        ? metadataResult.metadata?.answerDepth
                        : null;

                const socket =
                    new RealtimeSocket(

                        {
                            realtimeUrl:
                                realtimeUrl
                        },

                        {

                            onOpen: () => {

                                if (
                                    !mountedRef.current
                                ) {
                                    return;
                                }

                                if (answerDepth) {
                                    socketRef.current?.sendControlMessage({
                                        type: 'answerDepth',
                                        value: answerDepth,
                                    });
                                }

                                if (metadataResult.success && metadataResult.metadata) {
                                    socketRef.current?.sendControlMessage({
                                        type: 'interviewMetadata',
                                        value: metadataForLiveSocket(
                                            metadataResult.metadata,
                                        ),
                                    });
                                }

                                setStatus(
                                    runningRef.current
                                        ? ASSISTANT_STATUS.LISTENING
                                        : ASSISTANT_STATUS.CONNECTED
                                );
                            },

                            onClose: () => {

                                if (
                                    !mountedRef.current
                                ) {
                                    return;
                                }

                                if (runningRef.current) {
                                    setStatus(
                                        ASSISTANT_STATUS.CONNECTING
                                    );
                                    return;
                                }

                                runningRef.current =
                                    false;

                                setRunning(
                                    false
                                );

                                setStatus(
                                    ASSISTANT_STATUS.DISCONNECTED
                                );
                            },

                            onReconnecting: () => {

                                if (
                                    !mountedRef.current
                                ) {
                                    return;
                                }

                                setStatus(
                                    ASSISTANT_STATUS.CONNECTING
                                );
                            },

                            onReconnectFailed: () => {

                                if (
                                    !mountedRef.current
                                ) {
                                    return;
                                }

                                setError(
                                    "Backend connection lost. Please restart the assistant."
                                );

                                setStatus(
                                    ASSISTANT_STATUS.ERROR
                                );

                                runningRef.current =
                                    false;

                                setRunning(false);
                            },

                            onResponse: (
                                delta
                            ) => {

                                if (
                                    !mountedRef.current
                                ) {
                                    return;
                                }

                                setStatus(
                                    ASSISTANT_STATUS.RESPONDING
                                );

                                setResponse(delta);
                            },

                            onError: (
                                err
                            ) => {

                                console.error(
                                    err
                                );

                                if (
                                    !mountedRef.current
                                ) {
                                    return;
                                }

                                if (!socketRef.current?.isConnected()) {
                                    setStatus(
                                        ASSISTANT_STATUS.CONNECTING
                                    );
                                    return;
                                }

                                setError(
                                    err instanceof Error
                                        ? err.message
                                        : "Realtime error"
                                );
                            }
                        }
                    );

                socketRef.current =
                    socket;

                await socket.connect();

                if (
                    !mountedRef.current ||
                    startTokenRef.current !== startToken
                ) {
                    socket.disconnect();
                    return;
                }

                // ============================================
                // AUDIO
                // ============================================

                const audio =
                    new AudioCapture(

                        {},

                        {

                            onAudioData: (
                                audioData
                            ) => {

                                if (
                                    backendAudioPausedRef.current ||
                                    !audioEnabledRef.current
                                ) {
                                    return;
                                }

                                socket.appendAudio(
                                    audioData
                                );
                            },

                            onStart: () => {

                                if (
                                    !mountedRef.current
                                ) {
                                    return;
                                }

                                setStatus(
                                    ASSISTANT_STATUS.LISTENING
                                );
                            },

                            onStop: () => {

                                if (
                                    !mountedRef.current
                                ) {
                                    return;
                                }

                                setStatus(
                                    ASSISTANT_STATUS.DISCONNECTED
                                );
                            },

                            onError: (
                                err
                            ) => {

                                console.error(
                                    err
                                );

                                if (
                                    !mountedRef.current
                                ) {
                                    return;
                                }

                                setError(

                                    err?.message ||

                                    "Audio capture failed"
                                );

                                setStatus(
                                    ASSISTANT_STATUS.ERROR
                                );
                            }
                        }
                    );

                audioRef.current =
                    audio;

                await audio.start();

                if (
                    !mountedRef.current ||
                    startTokenRef.current !== startToken
                ) {
                    audio.stop();
                    socket.disconnect();
                    return;
                }

                runningRef.current =
                    true;

                setRunning(true);

            } catch (e: any) {

                console.error(e);

                setError(

                    e?.message ||

                    "Failed to start assistant"
                );

                setStatus(
                    ASSISTANT_STATUS.ERROR
                );
            } finally {

                startingRef.current =
                    false;
            }
        },

        [
            config.realtimeUrl
        ]
    );

    // ========================================================
    // STOP
    // ========================================================

    const stop = useCallback(
        () => {

            try {

                audioRef.current?.stop();

                audioRef.current =
                    null;

                socketRef.current?.disconnect();

                socketRef.current =
                    null;

                startTokenRef.current +=
                    1;

                runningRef.current =
                    false;

                startingRef.current =
                    false;

                setRunning(false);

                setStatus(
                    ASSISTANT_STATUS.DISCONNECTED
                );

            } catch (e) {

                console.error(e);
            }
        },

        []
    );

    // ========================================================
    // CLEAR
    // ========================================================

    const clearConversation =
        useCallback(() => {

            transcriptStore.clear();

            setTranscript("");

            setResponse("");

        }, []);

    const setAudioEnabled =
        useCallback((enabled: boolean) => {
            audioEnabledRef.current =
                enabled;

            setAudioEnabledState(
                enabled
            );

            setStatus(
                enabled
                    ? ASSISTANT_STATUS.LISTENING
                    : ASSISTANT_STATUS.CONNECTED
            );
        }, []);

    const submitManualQuestion =
        useCallback((question: string): boolean => {
            const cleanedQuestion =
                question.replace(/\s+/g, ' ')
                    .trim();

            if (!cleanedQuestion) {
                return false;
            }

            if (!socketRef.current?.isConnected()) {
                setError(
                    'Backend connection is not ready. Please wait a moment and try again.',
                );
                return false;
            }

            socketRef.current.sendControlMessage({
                type: 'manualQuestion',
                value: cleanedQuestion,
            });

            setStatus(
                ASSISTANT_STATUS.RESPONDING
            );

            return true;
        }, []);

    // ========================================================
    // CLEANUP
    // ========================================================

    useEffect(() => {

        mountedRef.current = true;

        return () => {

            mountedRef.current = false;

            stop();
        };

    }, [stop]);

    useEffect(() => {
        const handleAnswerDepthChange = (event: Event) => {
            const answerDepth = (event as CustomEvent<AnswerDepth>).detail;

            socketRef.current?.sendControlMessage({
                type: 'answerDepth',
                value: answerDepth,
            });
        };

        window.addEventListener(
            'vedha-answer-depth-changed',
            handleAnswerDepthChange,
        );

        return () => {
            window.removeEventListener(
                'vedha-answer-depth-changed',
                handleAnswerDepthChange,
            );
        };
    }, []);

    useEffect(() => {
        const pauseBackendAudio = () => {
            backendAudioPausedRef.current =
                true;
        };

        const resumeBackendAudio = () => {
            backendAudioPausedRef.current =
                false;
        };

        window.addEventListener(
            'vedha-local-audio-test-started',
            pauseBackendAudio,
        );

        window.addEventListener(
            'vedha-local-audio-test-ended',
            resumeBackendAudio,
        );

        return () => {
            window.removeEventListener(
                'vedha-local-audio-test-started',
                pauseBackendAudio,
            );

            window.removeEventListener(
                'vedha-local-audio-test-ended',
                resumeBackendAudio,
            );
        };
    }, []);

    // ========================================================
    // RETURN
    // ========================================================

    return {

        // ================================================
        // STATE
        // ================================================

        running,

        audioEnabled,

        status,

        transcript,

        response,

        error,

        // ================================================
        // ACTIONS
        // ================================================

        start,

        stop,

        setAudioEnabled,

        submitManualQuestion,

        clearConversation
    };
}
