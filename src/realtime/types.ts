import type { ProgrammingLanguage } from '@shared/api.ts';

export interface RealtimeSocketCallbacks {
  onResponse?: (response: string) => void;
  onTranscript?: (transcript: string) => void;
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

export interface RealtimeAssistantConfig {
  realtimeUrl: string;
  solutionLanguage: ProgrammingLanguage;
}

export type AssistantStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'responding'
  | 'disconnected'
  | 'error';

export interface RealtimeAssistantState {
  status: AssistantStatus;
  response: string;
  responseId: number;
  transcript: string;
  transcriptId: number;
  error: string;
  start: () => Promise<void>;
  stop: () => void;
  submitManualQuestion: (question: string) => boolean;
  resetChatSession: () => Promise<void>;
}
