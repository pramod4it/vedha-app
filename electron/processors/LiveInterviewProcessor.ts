import axios, { type AxiosResponse } from 'axios';
import {
  API_ENDPOINTS,
  type DebugResponse,
  type ChatRequest,
  type ChatResponse,
  type SolveResponse,
} from '../../shared/api';
import { API_BASE_URL } from '../../shared/constants';
import type { AppModeProcessor, ProcessingParams, ProcessingResult } from './AppModeProcessor';

export class LiveInterviewProcessor implements AppModeProcessor {
  async processSolve(params: ProcessingParams): Promise<ProcessingResult<SolveResponse>> {
    try {
      const {
        images,
        signal,
        headers,
        companyName,
        interviewerName,
        answerDepth,
        chatSessionId,
        solutionLanguage,
        resumeSummary,
      } = params;
      console.log(
        'CALLING CHAT API',
        `${API_BASE_URL}${API_ENDPOINTS.CHAT.SEND}`,
      );
      const extractResponse = await axios.post<ChatRequest, AxiosResponse<ChatResponse>>(
        `${API_BASE_URL}${API_ENDPOINTS.CHAT.SEND}`,
        {
          sessionId: chatSessionId,
          message:
            'Analyze the screenshot(s) and answer the interview question naturally. If it is a coding question, explain the approach and provide code. If it is system design, include the required design sections.',
          images,
          mode: answerDepth === 'systemdesign' ? 'SYSTEM_DESIGN' : answerDepth === 'medium' ? 'MEDIUM' : 'SHORT',
          language: solutionLanguage || 'java',
          context: [
            companyName ? `Company: ${companyName}` : '',
            interviewerName ? `Interviewer: ${interviewerName}` : '',
            resumeSummary ? `Resume: ${resumeSummary}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
        {
          signal,
          timeout: 300000,
          headers,
        },
      );
      console.log(
          'AXIOS RESPONSE',
          extractResponse.data,
      );
      return {
        success: true,
        data: toSolveResponse(
          extractResponse.data.answer,
          answerDepth,
        ),
      };
    } catch (error: unknown) {
      console.log(error);
      if (axios.isCancel(error)) {
        return {
          success: false,
          error: 'Processing was canceled by the user.',
        };
      }

      const axiosError = error as {
        response?: { status?: number; data?: unknown };
        message?: string;
      };
      console.error('API Error Details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      if (axiosError.response?.status === 401) {
        return {
          success: false,
          error: 'Your session or subscription has expired. Please sign in again.',
        };
      }

      if (axiosError.response?.status === 402) {
        return {
          success: false,
          error: 'Upgrade to Pro to generate solutions. Visit vedha.com to upgrade your plan.',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  async processDebug(params: ProcessingParams): Promise<ProcessingResult<DebugResponse>> {
    try {
      const {
        images,
        signal,
        headers,
        chatSessionId,
        solutionLanguage,
      } = params;

      const response = await axios.post<ChatRequest, AxiosResponse<ChatResponse>>(
        `${API_BASE_URL}${API_ENDPOINTS.CHAT.SEND}`,
        {
          sessionId: chatSessionId,
          message:
            'Analyze these extra screenshots as a follow-up to the current interview question. Correct or extend the previous answer.',
          images,
          mode: 'MEDIUM',
          language: solutionLanguage || 'java',
        },
        {
          signal,
          timeout: 300000,
          headers,
        },
      );

      return {
        success: true,
        data: {
          code: '',
          thoughts: [],
          timeComplexity: 'N/A',
          spaceComplexity: 'N/A',
          conversationId: createConversationId(),
          answerText: response.data.answer,
        } as DebugResponse,
      };
    } catch (error: unknown) {
      if (axios.isCancel(error)) {
        return {
          success: false,
          error: 'Processing was canceled by the user.',
        };
      }

      const axiosError = error as {
        response?: { status?: number; data?: unknown };
        message?: string;
      };
      console.error('Debug API Error Details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      if (axiosError.response?.status === 401) {
        return {
          success: false,
          error: 'Your session or subscription has expired. Please sign in again.',
        };
      }

      if (axiosError.response?.status === 402) {
        return {
          success: false,
          error: 'Upgrade to Pro to generate solutions. Visit vedha.com to upgrade your plan.',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
}

function toSolveResponse(
  answer: string,
  answerDepth?: string,
): SolveResponse {
  return {
    thoughts: [],
    code: '',
    answerText: answer,
    diagramMermaid: '',
    messageType: answerDepth === 'systemdesign' ? 'SYSTEM_DESIGN' : 'CHAT',
    answerDepth: answerDepth === 'medium' || answerDepth === 'systemdesign' ? answerDepth : 'short',
    timeComplexity: 'N/A',
    spaceComplexity: 'N/A',
    problemStatement: 'Screenshot interview question',
    conversationId: createConversationId(),
  };
}

function createConversationId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
