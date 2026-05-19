import type {
  DebugResponse,
  SolveResponse,
} from '../../shared/api';

export interface ProcessingResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProcessingParams {
  images: string[];
  isMock: boolean;
  readableVarNames: boolean;
  signal: AbortSignal;
  headers: Record<string, string>;
  conversationId?: string;
  companyName?: string;
  interviewerName?: string;
  answerDepth?: string;
  resumeSummary?: string;
}

export interface AppModeProcessor {
  processSolve(
    params: ProcessingParams,
  ): Promise<ProcessingResult<SolveResponse>>;

  processDebug(
    params: ProcessingParams,
  ): Promise<ProcessingResult<DebugResponse>>;
}
