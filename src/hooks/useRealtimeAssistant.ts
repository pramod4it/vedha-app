import { useCallback, useEffect, useRef, useState } from 'react';
import { ProgrammingLanguage } from '@shared/api.ts';
import type { AnswerDepth, InterviewMetadata } from '@shared/api.ts';

import { ASSISTANT_STATUS, DEFAULT_REALTIME_URL } from '../realtime/constants';
import { RealtimeSocket } from '../realtime/RealtimeSocket';
import type {
    AssistantStatus,
    RealtimeAssistantConfig,
    RealtimeAssistantState,
} from '../realtime/types';

const LIVE_RESUME_CONTEXT_LIMIT =
    12000;
const INTERVIEW_SESSION_TTL_MS =
    2 * 60 * 60 * 1000;

let activeManualSocket: RealtimeSocket | null =
    null;
let activeManualSocketOwner =
    0;
let nextManualSocketOwner =
    1;

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
    url.searchParams.set('answerDepth', metadata.answerDepth || 'medium');
    if (metadata.chatSessionId) {
        url.searchParams.set('chatSessionId', metadata.chatSessionId);
    }
    if (metadata.chatContextClearedAt) {
        url.searchParams.set('chatContextClearedAt', String(metadata.chatContextClearedAt));
    }
    if (metadata.solutionLanguage) {
        url.searchParams.set('solutionLanguage', metadata.solutionLanguage);
    }

    return url.toString();
}

function createChatSessionId(): string {
    const randomId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return `chat-${randomId}`;
}

async function ensureSocketMetadata(
    metadata: InterviewMetadata | null | undefined,
    solutionLanguage: ProgrammingLanguage | undefined,
): Promise<InterviewMetadata> {
    const now =
        Date.now();
    const existingStartedAt =
        metadata?.chatSessionStartedAt || 0;
    const isExpired =
        !metadata?.chatSessionId ||
        !existingStartedAt ||
        now - existingStartedAt > INTERVIEW_SESSION_TTL_MS;

    const nextMetadata: InterviewMetadata = {
        companyName: metadata?.companyName || '',
        interviewerName: metadata?.interviewerName || '',
        answerDepth: metadata?.answerDepth || 'short',
        chatSessionId: isExpired
            ? createChatSessionId()
            : metadata.chatSessionId,
        chatSessionStartedAt: isExpired
            ? now
            : existingStartedAt,
        chatContextClearedAt: isExpired
            ? undefined
            : metadata?.chatContextClearedAt,
        solutionLanguage: solutionLanguage || metadata?.solutionLanguage || ProgrammingLanguage.Java,
        resumeSummary: metadata?.resumeSummary || '',
    };

    if (
        !metadata ||
        metadata.chatSessionId !== nextMetadata.chatSessionId ||
        metadata.chatSessionStartedAt !== nextMetadata.chatSessionStartedAt ||
        metadata.chatContextClearedAt !== nextMetadata.chatContextClearedAt ||
        metadata.solutionLanguage !== nextMetadata.solutionLanguage ||
        metadata.answerDepth !== nextMetadata.answerDepth
    ) {
        await window.electronAPI.setInterviewMetadata(nextMetadata);
    }

    return nextMetadata;
}

function limitText(
    value: string | undefined,
    maxLength: number,
): string | undefined {
    if (!value || value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength)}\n\n[Resume context truncated for manual question session.]`;
}

function metadataForSocket(
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

export function useRealtimeAssistant(
    config: Partial<RealtimeAssistantConfig> = {},
): RealtimeAssistantState {
    const [status, setStatus] =
        useState<AssistantStatus>(ASSISTANT_STATUS.IDLE);
    const [response, setResponse] =
        useState('');
    const [responseId, setResponseId] =
        useState(0);
    const [error, setError] =
        useState('');

    const socketRef =
        useRef<RealtimeSocket | null>(null);
    const ownerRef =
        useRef(0);
    const startSequenceRef =
        useRef(0);
    const mountedRef =
        useRef(true);
    const startingRef =
        useRef(false);

    if (ownerRef.current === 0) {
        ownerRef.current =
            nextManualSocketOwner;
        nextManualSocketOwner +=
            1;
    }

    const start = useCallback(
        async () => {
            if (
                socketRef.current?.isConnected() ||
                startingRef.current
            ) {
                return;
            }

            startingRef.current =
                true;
            const startSequence =
                startSequenceRef.current + 1;
            startSequenceRef.current =
                startSequence;

            try {
                setError('');
                setResponse('');
                setStatus(ASSISTANT_STATUS.CONNECTING);

                const metadataResult =
                    await window.electronAPI.getInterviewMetadata();

                if (
                    !mountedRef.current ||
                    startSequenceRef.current !== startSequence
                ) {
                    return;
                }

                const socketMetadata =
                    await ensureSocketMetadata(
                        metadataResult.success
                            ? metadataResult.metadata
                            : null,
                        config.solutionLanguage,
                    );

                const realtimeUrl =
                    appendInterviewMetadataToUrl(
                        config.realtimeUrl || DEFAULT_REALTIME_URL,
                        socketMetadata,
                    );

                const answerDepth =
                    socketMetadata.answerDepth;

                activeManualSocket?.disconnect();
                activeManualSocket =
                    null;

                const socket =
                    new RealtimeSocket(
                        {
                            realtimeUrl,
                        },
                        {
                            onOpen: () => {
                                if (
                                    !mountedRef.current ||
                                    socketRef.current !== socket
                                ) {
                                    return;
                                }

                                if (answerDepth) {
                                    socketRef.current?.sendControlMessage({
                                        type: 'answerDepth',
                                        value: answerDepth,
                                    });
                                }

                                socketRef.current?.sendControlMessage({
                                    type: 'interviewMetadata',
                                    value: metadataForSocket(
                                        socketMetadata,
                                    ),
                                });

                                setStatus(ASSISTANT_STATUS.CONNECTED);
                            },
                            onClose: () => {
                                if (
                                    !mountedRef.current ||
                                    socketRef.current !== socket
                                ) {
                                    return;
                                }

                                setStatus(ASSISTANT_STATUS.DISCONNECTED);
                            },
                            onReconnecting: () => {
                                if (
                                    !mountedRef.current ||
                                    socketRef.current !== socket
                                ) {
                                    return;
                                }

                                setStatus(ASSISTANT_STATUS.CONNECTING);
                            },
                            onReconnectFailed: () => {
                                if (
                                    !mountedRef.current ||
                                    socketRef.current !== socket
                                ) {
                                    return;
                                }

                                setError(
                                    'Backend connection lost. Please restart the app.',
                                );
                                setStatus(ASSISTANT_STATUS.ERROR);
                            },
                            onResponse: (nextResponse) => {
                                if (
                                    !mountedRef.current ||
                                    socketRef.current !== socket
                                ) {
                                    return;
                                }

                                setResponse(nextResponse);
                                setResponseId((current) => current + 1);
                                setStatus(ASSISTANT_STATUS.CONNECTED);
                            },
                            onError: (err) => {
                                console.error(err);

                                if (
                                    !mountedRef.current ||
                                    socketRef.current !== socket
                                ) {
                                    return;
                                }

                                setError(
                                    err instanceof Error
                                        ? err.message
                                        : 'Realtime connection error',
                                );
                                setStatus(ASSISTANT_STATUS.ERROR);
                            },
                        },
                    );

                socketRef.current =
                    socket;
                activeManualSocket =
                    socket;
                activeManualSocketOwner =
                    ownerRef.current;

                await socket.connect();
            } catch (e: any) {
                if (
                    !mountedRef.current ||
                    startSequenceRef.current !== startSequence
                ) {
                    return;
                }

                console.error(e);
                setError(
                    e?.message || 'Failed to connect to backend',
                );
                setStatus(ASSISTANT_STATUS.ERROR);
            } finally {
                if (startSequenceRef.current === startSequence) {
                    startingRef.current =
                        false;
                }
            }
        },
        [config.realtimeUrl, config.solutionLanguage],
    );

    const stop = useCallback(
        () => {
            try {
                startSequenceRef.current +=
                    1;
                socketRef.current?.disconnect();
                if (activeManualSocketOwner === ownerRef.current) {
                    activeManualSocket =
                        null;
                    activeManualSocketOwner =
                        0;
                }
                socketRef.current =
                    null;
                startingRef.current =
                    false;
                setStatus(ASSISTANT_STATUS.DISCONNECTED);
            } catch (e) {
                console.error(e);
            }
        },
        [],
    );

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

            setStatus(ASSISTANT_STATUS.RESPONDING);

            return true;
        }, []);

    const resetChatSession =
        useCallback(async () => {
            try {
                const metadataResult =
                    await window.electronAPI.getInterviewMetadata();
                const existingMetadata =
                    metadataResult.success
                        ? metadataResult.metadata
                        : null;
                const socketMetadata =
                    await ensureSocketMetadata(
                        existingMetadata,
                        config.solutionLanguage,
                    );
                const clearedAt =
                    Date.now();

                const nextMetadata: InterviewMetadata = {
                    companyName:
                        socketMetadata.companyName || '',
                    interviewerName:
                        socketMetadata.interviewerName || '',
                    answerDepth:
                        socketMetadata.answerDepth || 'short',
                    chatSessionId: socketMetadata.chatSessionId,
                    chatSessionStartedAt: socketMetadata.chatSessionStartedAt,
                    chatContextClearedAt: clearedAt,
                    solutionLanguage:
                        config.solutionLanguage ||
                        socketMetadata.solutionLanguage ||
                        ProgrammingLanguage.Java,
                    resumeSummary:
                        socketMetadata.resumeSummary || '',
                };

                await window.electronAPI.setInterviewMetadata(nextMetadata);

                socketRef.current?.sendControlMessage({
                    type: 'clearChatSession',
                    value: {
                        chatSessionId: nextMetadata.chatSessionId,
                        clearedAt,
                    },
                });

                socketRef.current?.sendControlMessage({
                    type: 'interviewMetadata',
                    value: metadataForSocket(nextMetadata),
                });
            } catch (err) {
                console.error(err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to clear chat session',
                );
            }
        }, [config.solutionLanguage]);

    useEffect(() => {
        mountedRef.current =
            true;

        return () => {
            mountedRef.current =
                false;
            stop();
        };
    }, [stop]);

    useEffect(() => {
        const handleAnswerDepthChange = (event: Event) => {
            const answerDepth =
                (event as CustomEvent<AnswerDepth>).detail;

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
        if (!config.solutionLanguage) {
            return;
        }

        socketRef.current?.sendControlMessage({
            type: 'solutionLanguage',
            value: config.solutionLanguage,
        });

        window.electronAPI
            .getInterviewMetadata()
            .then((result) => {
                if (!result.success || !result.metadata) {
                    return;
                }

                return window.electronAPI.setInterviewMetadata({
                    ...result.metadata,
                    solutionLanguage: config.solutionLanguage,
                });
            })
            .catch(console.error);
    }, [config.solutionLanguage]);

    return {
        status,
        response,
        responseId,
        error,
        start,
        stop,
        submitManualQuestion,
        resetChatSession,
    };
}
