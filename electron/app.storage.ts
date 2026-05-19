import Store from 'electron-store';
import { AppMode, ProgrammingLanguage } from '../shared/api';
import { type AppStoreSchema, ELECTRON_STORAGE_KEYS, ELECTRON_STORES } from '../shared/storage';

function normalizeAnswerDepth(
  answerDepth: NonNullable<AppStoreSchema['interviewMetadata']>['answerDepth'] | undefined,
): NonNullable<AppStoreSchema['interviewMetadata']>['answerDepth'] {
  return answerDepth === 'medium' || answerDepth === 'systemdesign' ? answerDepth : 'short';
}

function normalizeSolutionLanguage(
  solutionLanguage: NonNullable<AppStoreSchema['interviewMetadata']>['solutionLanguage'] | undefined,
): ProgrammingLanguage {
  return solutionLanguage === ProgrammingLanguage.C || solutionLanguage === ProgrammingLanguage.Cpp
    ? solutionLanguage
    : ProgrammingLanguage.Java;
}

export interface IAppStore {
  set<K extends keyof AppStoreSchema>(key: K, value: AppStoreSchema[K]): void;
  get<K extends keyof AppStoreSchema>(key: K): AppStoreSchema[K];
  delete(key: keyof AppStoreSchema): void;
}

const store = new Store<AppStoreSchema>({
  name: ELECTRON_STORES.APP_SETTINGS,
  schema: {
    [ELECTRON_STORAGE_KEYS.APP_SETTINGS.APP_MODE]: {
      type: ['string', 'null'],
      default: AppMode.LIVE_INTERVIEW,
    },
    [ELECTRON_STORAGE_KEYS.APP_SETTINGS.READABLE_VAR_NAMES]: {
      type: ['boolean', 'null'],
      default: false,
    },
    [ELECTRON_STORAGE_KEYS.APP_SETTINGS.INTERVIEW_METADATA]: {
      type: ['object', 'null'],
      default: null,
      properties: {
        companyName: {
          type: 'string',
        },
        interviewerName: {
          type: 'string',
        },
        answerDepth: {
          type: 'string',
          enum: ['short', 'medium', 'deep', 'systemdesign'],
          default: 'short',
        },
        chatSessionId: {
          type: 'string',
        },
        chatSessionStartedAt: {
          type: 'number',
        },
        chatContextClearedAt: {
          type: 'number',
        },
        solutionLanguage: {
          type: 'string',
          enum: ['java', 'c', 'cpp'],
          default: ProgrammingLanguage.Java,
        },
        resumeSummary: {
          type: 'string',
        },
      },
    },
  },
}) as unknown as IAppStore;

export class AppStorage {
  private static instance: AppStorage;
  private readonly store: IAppStore;

  private constructor() {
    this.store = store;
  }

  static getInstance(): AppStorage {
    if (!AppStorage.instance) {
      AppStorage.instance = new AppStorage();
    }

    return AppStorage.instance;
  }

  setAppMode(appMode: AppMode): void {
    this.store.set(ELECTRON_STORAGE_KEYS.APP_SETTINGS.APP_MODE, appMode);
  }

  getAppMode(): AppMode {
    const storedMode = this.store.get(ELECTRON_STORAGE_KEYS.APP_SETTINGS.APP_MODE);

    return storedMode || AppMode.LIVE_INTERVIEW;
  }

  setReadableVarNames(value: boolean): void {
    this.store.set(ELECTRON_STORAGE_KEYS.APP_SETTINGS.READABLE_VAR_NAMES, value);
  }

  getReadableVarNames(): boolean {
    return this.store.get(ELECTRON_STORAGE_KEYS.APP_SETTINGS.READABLE_VAR_NAMES) || false;
  }

  setInterviewMetadata(value: AppStoreSchema['interviewMetadata']): void {
    this.store.set(
      ELECTRON_STORAGE_KEYS.APP_SETTINGS.INTERVIEW_METADATA,
      value
        ? {
            ...value,
            answerDepth: normalizeAnswerDepth(value.answerDepth),
            solutionLanguage: normalizeSolutionLanguage(value.solutionLanguage),
          }
        : value,
    );
  }

  getInterviewMetadata(): AppStoreSchema['interviewMetadata'] {
    const metadata = this.store.get(ELECTRON_STORAGE_KEYS.APP_SETTINGS.INTERVIEW_METADATA) || null;

    if (!metadata) {
      return null;
    }

    return {
      ...metadata,
      answerDepth: normalizeAnswerDepth(metadata.answerDepth),
      solutionLanguage: normalizeSolutionLanguage(metadata.solutionLanguage),
    };
  }
}
