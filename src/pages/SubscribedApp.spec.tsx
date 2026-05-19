import { render, screen, waitFor } from '@testing-library/react';
import {
  type AuthenticatedUser,
  ProgrammingLanguage,
  SubscriptionLevel,
  UserLanguage,
} from '@shared/api.ts';

import { ToastContext } from '../contexts/toast';
import SubscribedApp from './SubscribedApp';

const mockUseRealtimeAssistant = jest.fn();

jest.mock('../hooks/useRealtimeAssistant', () => ({
  useRealtimeAssistant: () => mockUseRealtimeAssistant(),
}));

jest.mock('../layouts', () => ({
  AppModeLayoutProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('.', () => {
  const { useSolutionContext } = require('../contexts/SolutionContext');

  return {
    QueuePage: () => <div data-testid="queue-page" />,
    SolutionsPage: () => {
      const { state } = useSolutionContext();

      return (
        <div data-testid="solutions-page">
          {state.solution?.problemStatement}
          {state.solution?.answerText}
          {state.solution?.thoughts?.map((thought: string) => (
            <span key={thought}>{thought}</span>
          ))}
          {state.solution?.followUpQuestions?.map((question: string) => (
            <span key={question}>{question}</span>
          ))}
        </div>
      );
    },
  };
});

function createUser(): AuthenticatedUser {
  return {
    user: {
      email: 'test@example.com',
    },
    subscription: {
      active_from: '2026-01-01T00:00:00.000Z',
      active_to: null,
      level: SubscriptionLevel.PRO,
    },
    settings: {
      solutionLanguage: ProgrammingLanguage.TypeScript,
      userLanguage: UserLanguage.EN_US,
    },
  };
}

function renderSubscribedApp() {
  return render(
    <ToastContext.Provider value={{ showToast: jest.fn() }}>
      <SubscribedApp user={createUser()} />
    </ToastContext.Provider>,
  );
}

describe('SubscribedApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    window.electronAPI.onSolutionStart = jest.fn(() => jest.fn());
    window.electronAPI.onUnauthorized = jest.fn(() => jest.fn());
    window.electronAPI.onResetView = jest.fn(() => jest.fn());
    window.electronAPI.onSolutionError = jest.fn(() => jest.fn());
    window.electronAPI.updateContentDimensions =
      jest.fn().mockResolvedValue(undefined);

    mockUseRealtimeAssistant.mockReturnValue({
      start: jest.fn().mockResolvedValue(undefined),
      response: '',
      error: '',
      submitManualQuestion: jest.fn(),
      resetChatSession: jest.fn().mockResolvedValue(undefined),
    });
  });

  test('handles realtime responses without browser crypto.randomUUID', async () => {
    const originalRandomUUID =
      globalThis.crypto?.randomUUID;

    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: undefined,
    });

    mockUseRealtimeAssistant.mockReturnValue({
      start: jest.fn().mockResolvedValue(undefined),
      response: JSON.stringify({
        problemStatement: 'What is event loop?',
        answerText: 'It schedules asynchronous callbacks.',
      }),
      error: '',
      submitManualQuestion: jest.fn(),
      resetChatSession: jest.fn().mockResolvedValue(undefined),
    });

    try {
      renderSubscribedApp();

      await waitFor(() => {
        expect(
          screen.getByText('What is event loop?It schedules asynchronous callbacks.'),
        ).toBeInTheDocument();
      });
    } finally {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        configurable: true,
        value: originalRandomUUID,
      });
    }
  });

  test('normalizes string list fields from realtime responses', async () => {
    mockUseRealtimeAssistant.mockReturnValue({
      start: jest.fn().mockResolvedValue(undefined),
      response: JSON.stringify({
        problemStatement: 'Design a cache',
        thoughts: '- Use TTL\n- Evict least recently used entries',
        followUpQuestions: 'How would you shard it?',
      }),
      error: '',
      submitManualQuestion: jest.fn(),
      resetChatSession: jest.fn().mockResolvedValue(undefined),
    });

    renderSubscribedApp();

    await waitFor(() => {
      expect(screen.getByText('Use TTL')).toBeInTheDocument();
      expect(screen.getByText('Evict least recently used entries')).toBeInTheDocument();
      expect(screen.getByText('How would you shard it?')).toBeInTheDocument();
    });
  });

  test('ignores non-renderable realtime response fields', async () => {
    mockUseRealtimeAssistant.mockReturnValue({
      start: jest.fn().mockResolvedValue(undefined),
      response: JSON.stringify({
        problemStatement: { text: 'Do not render this object' },
        answerText: { text: 'Nor this one' },
        code: { language: 'java', body: 'class Demo {}' },
        thoughts: ['Use typed boundary checks'],
      }),
      error: '',
      submitManualQuestion: jest.fn(),
      resetChatSession: jest.fn().mockResolvedValue(undefined),
    });

    renderSubscribedApp();

    await waitFor(() => {
      expect(screen.getByText('Use typed boundary checks')).toBeInTheDocument();
    });
  });

  test('renders clarification responses instead of dropping backend answers', async () => {
    mockUseRealtimeAssistant.mockReturnValue({
      start: jest.fn().mockResolvedValue(undefined),
      response: JSON.stringify({
        messageType: 'CLARIFICATION_REQUEST',
        problemStatement: 'Follow-up request',
        answerText: 'I can continue from the previous Saga Pattern answer.',
      }),
      error: '',
      submitManualQuestion: jest.fn(),
      resetChatSession: jest.fn().mockResolvedValue(undefined),
    });

    renderSubscribedApp();

    await waitFor(() => {
      expect(
        screen.getByText('Follow-up requestI can continue from the previous Saga Pattern answer.'),
      ).toBeInTheDocument();
    });
  });
});
