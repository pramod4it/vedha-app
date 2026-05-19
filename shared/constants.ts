type RuntimeEnv =
  Record<string, string | undefined>;

const getRuntimeEnv =
  (): RuntimeEnv => {
    if (typeof process !== 'undefined' && process.env) {
      return process.env;
    }

    return {};
  };

/**
 * Check if running in self-hosted mode.
 * Vite mirrors VITE_* values into process.env for this app build, and using
 * process.env keeps Jest from parsing import.meta in CommonJS tests.
 */
export const isSelfHosted = (): boolean => {
  return getRuntimeEnv().VITE_SELF_HOSTED_MODE === 'true';
};

/**
 * API base URL for both React and Electron apps
 * In React: Uses import.meta.env.VITE_API_BASE_URL
 * In Electron: Uses process.env.VITE_API_BASE_URL
 * Falls back to development URL if not set
 */
export const getApiBaseUrl = (): string => {
  return getRuntimeEnv().VITE_API_BASE_URL || 'http://localhost:9090';
};

export const API_BASE_URL = getApiBaseUrl();

export const IPC_EVENTS = {
  TOOLTIP: {
    MOUSE_ENTER: 'tooltip:mouse-enter',
    MOUSE_LEAVE: 'tooltip:mouse-leave',
    CLOSE_CLICK: 'tooltip:close-click',
  },
  QUEUE: {
    LOADED_NO_SCREENSHOTS: 'queue:loaded-no-screenshots',
    LOADED_WITH_SCREENSHOTS: 'queue:loaded-with-screenshots',
  },
  APP_MODE: {
    CHANGE: 'app-mode:change',
  },
} as const;

// Type for all IPC events
export type IpcEvents = typeof IPC_EVENTS;
export type IpcEventKeys = keyof IpcEvents;

// Helper type to get all possible event names
export type AllIpcEvents = {
  [K in keyof IpcEvents]: IpcEvents[K] extends { [key: string]: string }
    ? IpcEvents[K][keyof IpcEvents[K]]
    : IpcEvents[K];
}[keyof IpcEvents];
