import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  type AuthenticatedUser,
  ProgrammingLanguage,
  SubscriptionLevel,
  UserLanguage,
} from '../shared/api';

import App from './App';

import { authService } from './services/auth';
import { getAuthProvider } from './services/auth';
import { getStorageProvider } from './services/storage';

jest.mock('./services/auth.ts');
jest.mock('./services/storage');
jest.mock('./services/auth');

jest.mock('./config', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

jest.mock('./contexts/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) =>
      children,

  useSettings: () => ({
    solutionLanguage: 'javascript',
    userLanguage: 'es-ES',
    loading: false,
    error: null,
    updateSolutionLanguage: jest.fn(),
    updateUserLanguage: jest.fn(),
  }),
}));

jest.mock('./pages/SubscribedApp', () => {
  return function MockSubscribedApp() {
    const { useSettings } = require('./contexts/SettingsContext');

    const settings = useSettings();

    return (
        <div data-testid="subscribed-app">
        <span data-testid="language">
          {settings.solutionLanguage}
        </span>

          <span data-testid="locale">
          {settings.userLanguage}
        </span>
        </div>
    );
  };
});

jest.mock('./pages/SubscribePage', () => {
  return function MockSubscribePage({ user }: any) {
    return (
        <div data-testid="subscribe-page">
          Subscribe Page - {user.user.email}
        </div>
    );
  };
});

jest.mock('./pages/AuthForm', () => ({
  AuthForm: function MockAuthForm({
                                    setUser,
                                  }: any) {
    return (
        <div data-testid="auth-form">
          <button
              onClick={() =>
                  setUser(createUser())
              }
          >
            Login
          </button>
        </div>
    );
  },
}));

function createUser(
    overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    user: {
      email: 'realuser@example.com',
      ...overrides.user,
    },

    subscription: {
      active_from:
          '2024-01-01T00:00:00.000Z',

      active_to: null,

      level: SubscriptionLevel.PRO,

      ...overrides.subscription,
    },

    settings: {
      solutionLanguage:
      ProgrammingLanguage.JavaScript,

      userLanguage: UserLanguage.EN_US,

      ...overrides.settings,
    },
  };
}

function createAuthProviderMock() {
  return {
    getCurrentUser: jest.fn(),
    getAuthToken: jest.fn(),
    clearAuthToken: jest.fn(),
  };
}

function createStorageProviderMock() {
  return {
    getSettings: jest.fn(),
    getAppMode: jest.fn(),
  };
}

describe('App', () => {
  let mockAuthProvider: ReturnType<
      typeof createAuthProviderMock
  >;

  let mockStorageProvider: ReturnType<
      typeof createStorageProviderMock
  >;

  let mockAuthService: jest.Mocked<
      typeof authService
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthProvider =
        createAuthProviderMock();

    mockStorageProvider =
        createStorageProviderMock();

    mockAuthService =
        authService as jest.Mocked<
            typeof authService
        >;

    (
        getAuthProvider as jest.Mock
    ).mockReturnValue(mockAuthProvider);

    (
        getStorageProvider as jest.Mock
    ).mockReturnValue(
        mockStorageProvider,
    );

    mockStorageProvider.getSettings.mockResolvedValue(
        {
          solutionLanguage:
          ProgrammingLanguage.JavaScript,

          userLanguage:
          UserLanguage.EN_US,
        },
    );

    mockStorageProvider.getAppMode.mockResolvedValue(
        'live_interview',
    );

    delete (window as any).__LANGUAGE__;

    delete (window as any).__LOCALE__;

    delete (window as any)
        .__IS_INITIALIZED__;
  });

  describe('Loading state', () => {
    test('shows loading spinner', () => {
      mockAuthProvider.getCurrentUser.mockImplementation(
          () => new Promise(() => {}),
      );

      render(<App />);

      expect(
          screen.getByText('Loading...'),
      ).toBeInTheDocument();

      expect(
          document.querySelector(
              '.animate-spin',
          ),
      ).toBeInTheDocument();
    });
  });

  describe('Authentication flow', () => {
    test('shows auth form when user not authenticated', async () => {
      mockAuthProvider.getCurrentUser.mockResolvedValue(
          null,
      );

      render(<App />);

      await waitFor(() => {
        expect(
            screen.getByTestId(
                'auth-form',
            ),
        ).toBeInTheDocument();
      });
    });

    test('updates user after login', async () => {
      mockAuthProvider.getCurrentUser.mockResolvedValue(
          null,
      );

      const user = userEvent.setup();

      render(<App />);

      await waitFor(() => {
        expect(
            screen.getByTestId(
                'auth-form',
            ),
        ).toBeInTheDocument();
      });

      await user.click(
          screen.getByText('Login'),
      );

      await waitFor(() => {
        expect(
            screen.queryByTestId(
                'auth-form',
            ),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Subscription states', () => {
    test('shows subscribed app for PRO user', async () => {
      const proUser = createUser();

      mockAuthProvider.getCurrentUser.mockResolvedValue(
          proUser,
      );

      mockAuthProvider.getAuthToken.mockResolvedValue(
          'real-jwt-token',
      );

      render(<App />);

      await waitFor(() => {
        expect(
            screen.getByTestId(
                'subscribed-app',
            ),
        ).toBeInTheDocument();
      });

      expect(
          screen.getByTestId('language'),
      ).toHaveTextContent(
          'javascript',
      );

      expect(
          screen.getByTestId('locale'),
      ).toHaveTextContent(
          'es-ES',
      );
    });

    test('shows subscribed app for FREE user', async () => {
      const freeUser = createUser({
        subscription: {
          active_from: null,
          active_to: null,
          level: SubscriptionLevel.FREE,
        },
      });

      mockAuthProvider.getCurrentUser.mockResolvedValue(
          freeUser,
      );

      mockAuthProvider.getAuthToken.mockResolvedValue(
          'real-jwt-token',
      );

      render(<App />);

      await waitFor(() => {
        expect(
            screen.getByTestId(
                'subscribed-app',
            ),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Subscription polling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('polls subscription updates', async () => {
      const freeUser = createUser({
        subscription: {
          active_from: null,
          active_to: null,
          level: SubscriptionLevel.FREE,
        },
      });

      mockAuthProvider.getCurrentUser.mockResolvedValue(
          freeUser,
      );

      mockAuthProvider.getAuthToken.mockResolvedValue(
          'real-jwt-token',
      );

      mockAuthService.getCurrentUser.mockResolvedValue(
          freeUser,
      );

      render(<App />);

      await waitFor(() => {
        expect(
            screen.getByTestId(
                'subscribed-app',
            ),
        ).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(
            15000,
        );
      });

      await waitFor(() => {
        expect(
            mockAuthService.getCurrentUser,
        ).toHaveBeenCalled();
      });
    });
  });

  describe('Settings initialization', () => {
    test('loads settings successfully', async () => {
      const user = createUser();

      mockAuthProvider.getCurrentUser.mockResolvedValue(
          user,
      );

      mockAuthProvider.getAuthToken.mockResolvedValue(
          'real-jwt-token',
      );

      mockStorageProvider.getSettings.mockResolvedValue(
          {
            solutionLanguage:
            ProgrammingLanguage.JavaScript,

            userLanguage:
            UserLanguage.ES_ES,
          },
      );

      render(<App />);

      await waitFor(() => {
        expect(
            screen.getByTestId(
                'subscribed-app',
            ),
        ).toBeInTheDocument();
      });

      expect(
          screen.getByTestId('language'),
      ).toHaveTextContent(
          'javascript',
      );

      expect(
          screen.getByTestId('locale'),
      ).toHaveTextContent(
          'es-ES',
      );
    });

    test('shows error toast when settings fail', async () => {
      const user = createUser();

      mockAuthProvider.getCurrentUser.mockResolvedValue(
          user,
      );

      mockAuthProvider.getAuthToken.mockResolvedValue(
          'real-jwt-token',
      );

      mockStorageProvider.getSettings.mockRejectedValue(
          new Error('Settings error'),
      );

      render(<App />);

      await waitFor(() => {
        expect(
            screen.getByTestId(
                'subscribed-app',
            ),
        ).toBeInTheDocument();
      });

      expect(
          screen.getByText(
              'Failed to load user settings',
          ),
      ).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    test('shows auth form when token missing', async () => {
      const user = createUser();

      mockAuthProvider.getCurrentUser.mockResolvedValue(
          user,
      );

      mockAuthProvider.getAuthToken.mockResolvedValue(
          null,
      );

      render(<App />);

      await waitFor(() => {
        expect(
            screen.getByTestId(
                'auth-form',
            ),
        ).toBeInTheDocument();
      });
    });

    test('shows initialization error', async () => {
      mockAuthProvider.getCurrentUser.mockRejectedValue(
          new Error('Auth error'),
      );

      render(<App />);

      await waitFor(() => {
        expect(
            screen.getByTestId(
                'auth-form',
            ),
        ).toBeInTheDocument();
      });

      expect(
          screen.getByText(
              'Failed to initialize app',
          ),
      ).toBeInTheDocument();

      expect(
          mockAuthProvider.clearAuthToken,
      ).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('unmounts cleanly', async () => {
      const user = createUser();

      mockAuthProvider.getCurrentUser.mockResolvedValue(
          user,
      );

      mockAuthProvider.getAuthToken.mockResolvedValue(
          'real-jwt-token',
      );

      const { unmount } = render(
          <App />,
      );

      await waitFor(() => {
        expect(
            screen.getByTestId(
                'subscribed-app',
            ),
        ).toBeInTheDocument();
      });

      unmount();
    });
  });
});