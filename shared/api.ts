export enum ProgrammingLanguage {
  Python = 'python',
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Java = 'java',
  Go = 'golang',
  Cpp = 'cpp',
  Swift = 'swift',
  Kotlin = 'kotlin',
  Ruby = 'ruby',
  SQL = 'sql',
  R = 'r',
  PHP = 'php',
}

export enum UserLanguage {
  EN_US = 'en-US',
  ES_ES = 'es-ES',
  ES_MX = 'es-MX',
  ES_AR = 'es-AR',
  PT_PT = 'pt-PT',
  PT_BR = 'pt-BR',
  FR_FR = 'fr-FR',
  FR_CA = 'fr-CA',
  DE_DE = 'de-DE',
  DE_AT = 'de-AT',
  UK_UA = 'uk-UA',
  RU_RU = 'ru-RU',
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
  JA_JP = 'ja-JP',
  KO_KR = 'ko-KR',
  HI_IN = 'hi-IN',
  AR_SA = 'ar-SA',
  AR_EG = 'ar-EG',
}

export enum AppMode {
  LIVE_INTERVIEW = 'live-interview',
}

export enum SubscriptionLevel {
  FREE = 'FREE',
  PRO = 'PRO',
}

export type AnswerDepth = 'short' | 'medium' | 'systemdesign';

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export interface AuthUser {
  email: string;
}

export interface AuthSession {
  access_token: string;
}

export interface AuthResponse {
  data: {
    user: AuthUser | null;
    session: AuthSession | null;
  };

  error: {
    name?: string;
    status?: number;
  } | null;
}

export interface AuthenticatedUser {
  user: {
    email: string;
  };

  subscription: {
    active_from: string | null;
    active_to: string | null;
    level: SubscriptionLevel;
  };

  settings: {
    solutionLanguage: ProgrammingLanguage;
    userLanguage: UserLanguage;
  };
}

// =============================================================================
// SOLUTION PROCESSING TYPES
// =============================================================================

export interface SolveRequest {
  images: string[];

  isMock?: boolean;

  readableVarNames?: boolean;

  companyName?: string;

  interviewerName?: string;

  interviewRound?: string;

  answerDepth?: AnswerDepth;

  targetRole?: string;

  techStack?: string;

  resumeSummary?: string;

  jobDescription?: string;

  extraInstructions?: string;
}

export interface InterviewMetadata {
  companyName: string;
  interviewerName: string;
  interviewRound: string;
  answerDepth: AnswerDepth;
  targetRole?: string;
  techStack?: string;
  resumeSummary?: string;
  jobDescription?: string;
  extraInstructions?: string;
}

export interface SolveResponse {
  thoughts: string[];

  code: string;

  answerText?: string;

  diagramMermaid?: string;

  messageType?: string;

  parentQuestionId?: number;

  answerDepth?: AnswerDepth;

  timeComplexity: string;

  spaceComplexity: string;

  problemStatement: string;

  conversationId: string;

  followUpQuestions?: string[];

  sayThis?: string;

  example?: string;
}

export interface DebugRequest {
  images: string[];

  isMock?: boolean;

  readableVarNames?: boolean;
}

export interface DebugResponse {
  code: string;

  thoughts: string[];

  timeComplexity: string;

  spaceComplexity: string;

  conversationId: string;
}

export interface InterviewQuestionRequest {
  question: string;

  textQuestion?: string;

  audioQuestion?: string;

  audioData?: number[];

  screenshotCount?: number;

  companyName?: string;

  interviewerName?: string;

  interviewRound?: string;

  answerDepth?: AnswerDepth;

  answer?: string;

  answerText?: string;

  diagramMermaid?: string;

  rawResponse?: string;

  messageType?: string;

  parentQuestionId?: number;

  source?: string;

  sessionKey?: string;

  conversationId?: string;
}

export interface InterviewQuestionResponse {
  id: number;

  question: string;

  textQuestion?: string | null;

  audioQuestion?: string | null;

  audioSizeBytes?: number | null;

  screenshotCount?: number | null;

  companyName?: string | null;

  interviewerName?: string | null;

  interviewRound?: string | null;

  answerDepth?: AnswerDepth | null;

  answer?: string | null;

  answerText?: string | null;

  diagramMermaid?: string | null;

  rawResponse?: string | null;

  messageType?: string | null;

  parentQuestionId?: number | null;

  source?: string | null;

  sessionKey?: string | null;

  conversationId?: string | null;

  createdAt: string;
}

// =============================================================================
// SETTINGS TYPES
// =============================================================================

export interface SettingsResponse {
  solutionLanguage: ProgrammingLanguage;

  userLanguage: UserLanguage;
}

export interface UserSettingsUpdateRequest {
  solutionLanguage: ProgrammingLanguage;

  userLanguage: UserLanguage;
}

// =============================================================================
// API ENDPOINTS
// =============================================================================

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    USER: '/auth/user',
  },

  SETTINGS: {
    GET: '/user-settings',
    UPDATE: '/user-settings',
  },

  SOLUTIONS: {
    SOLVE: '/solutions/solve',
    DEBUG: '/solutions/debug',
  },

  INTERVIEW_QUESTIONS: {
    LIST: '/interview-questions',
    CREATE: '/interview-questions',
  },

  RESUME: {
    EXTRACT: '/resume/extract',
  },
} as const;

// =============================================================================
// ADDITIONAL TYPES
// =============================================================================

export interface Screenshot {
  path: string;

  preview: string;
}
