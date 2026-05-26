import { type AuthenticatedUser, type SolveResponse, SubscriptionLevel } from '@shared/api.ts';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScreenshotProvider } from '../contexts/ScreenshotContext';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import { SolutionProvider, useSolutionContext } from '../contexts/SolutionContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { useToast } from '../contexts/toast';
import { useRealtimeAssistant } from '../hooks/useRealtimeAssistant';
import { AppModeLayoutProvider } from '../layouts';
import { ASSISTANT_STATUS } from '../realtime/constants';
import { QueuePage, SolutionsPage } from '.';

interface SubscribedAppProps {
  user: AuthenticatedUser;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((item) => item.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
  }

  return [];
}

function toText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toText).filter(Boolean).join('\n');
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nestedText = toText(
      record.text ?? record.content ?? record.value ?? record.answer ?? record.description,
    );

    if (nestedText) {
      return nestedText;
    }
  }

  return '';
}

function parseRealtimeResponse(response: string): Partial<SolveResponse> {
  try {
    const parsed = JSON.parse(response) as Partial<SolveResponse> & {
      content?: unknown;
      question?: unknown;
      type?: unknown;
    };

    if (!parsed.answerText && parsed.content) {
      return {
        ...parsed,
        answerText: toText(parsed.content),
        problemStatement: toText(parsed.question) || toText(parsed.problemStatement),
        messageType: toText(parsed.type) || toText(parsed.messageType),
        code: '',
      };
    }

    return parsed;
  } catch {
    const start = response.indexOf('{');
    const end = response.lastIndexOf('}');

    if (start >= 0 && end > start) {
      return parseRealtimeResponse(response.slice(start, end + 1));
    }

    throw new Error('Realtime response is not JSON');
  }
}

const SubscribedAppContent: React.FC = () => {
  const { clearAll, setSolution } = useSolutionContext();
  const { solutionLanguage } = useSettings();
  const [view, setView] = useState<'queue' | 'solutions' | 'debug'>('solutions');
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const {
    start,
    response,
    responseId,
    transcript,
    error,
    status,
    submitManualQuestion,
    resetChatSession,
  } = useRealtimeAssistant({
    solutionLanguage,
  });
  const lastRealtimeResponseRef = useRef({
    id: 0,
    response: '',
  });

  useEffect(() => {
    start().catch(console.error);
  }, [start]);

  useEffect(() => {
    if (error) {
      showToast('Backend Connection', error, 'error');
    }
  }, [error, showToast]);

  useEffect(() => {
    if (!response) {
      return;
    }

    if (
      responseId === lastRealtimeResponseRef.current.id &&
      response === lastRealtimeResponseRef.current.response
    ) {
      return;
    }

    lastRealtimeResponseRef.current = {
      id: responseId,
      response,
    };

    try {
      const parsed = parseRealtimeResponse(response);
      const thoughts = toStringArray(parsed.thoughts);
      const followUpQuestions = toStringArray(parsed.followUpQuestions);
      const answerText = toText(parsed.answerText);
      const code = answerText ? '' : toText(parsed.code);
      const diagramMermaid = toText(parsed.diagramMermaid);
      const problemStatement = toText(parsed.problemStatement);
      const sayThis = toText(parsed.sayThis);
      const example = toText(parsed.example);
      const hasContent = Boolean(
        code || answerText || diagramMermaid || problemStatement || thoughts.length > 0,
      );

      setSolution({
        thoughts:
          thoughts.length > 0
            ? thoughts
            : hasContent
              ? []
              : ['The backend returned an answer in an unexpected shape. Showing the raw answer.'],
        code,
        answerText,
        diagramMermaid,
        messageType: toText(parsed.messageType) || 'NEW_QUESTION',
        parentQuestionId:
          typeof parsed.parentQuestionId === 'number' ? parsed.parentQuestionId : undefined,
        answerDepth: parsed.answerDepth,
        timeComplexity: toText(parsed.timeComplexity) || 'Unknown',
        spaceComplexity: toText(parsed.spaceComplexity) || 'Unknown',
        problemStatement: problemStatement || 'Manual question',
        conversationId: toText(parsed.conversationId),
        followUpQuestions,
        sayThis,
        example,
      });
      setView('solutions');
    } catch {
      setSolution({
        thoughts: ['The interviewer asked a question. Here is a concise answer from the backend.'],
        code: '',
        answerText: response,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A',
        problemStatement: 'Manual question',
        conversationId: '',
      });
      setView('solutions');
    }
  }, [response, responseId, setSolution]);

  // Dynamically update the window size
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const updateDimensions = () => {
      if (!containerRef.current) {
        return;
      }
      const width = view === 'solutions' ? 980 : Math.max(containerRef.current.scrollWidth, 360);
      const height = view === 'solutions' ? 720 : Math.max(containerRef.current.scrollHeight, 240);
      window.electronAPI
        ?.updateContentDimensions({ width, height, source: 'SubscribedApp' })
        .catch(console.error);
    };

    if (view === 'solutions') {
      updateDimensions();
      return;
    }

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    // Also watch DOM changes
    const mutationObserver = new MutationObserver(updateDimensions);
    mutationObserver.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Initial dimension update
    updateDimensions();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [view]);

  // Listen for events that might switch views or show errors
  useEffect(() => {
    const cleanupFunctions = [
      // PROCESSING_EVENTS.INITIAL_START
      window.electronAPI.onSolutionStart(() => {
        setView('solutions');
      }),
      window.electronAPI.onUnauthorized(() => {
        clearAll();
        setView('queue');
      }),
      window.electronAPI.onResetView(() => {
        clearAll();
        setView('queue');
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast('Error', error, 'error');
      }),
    ];

    return () => {
      cleanupFunctions.forEach((fn) => {
        fn();
      });
    };
  }, [clearAll, showToast]);

  return (
    <AppModeLayoutProvider>
      <div ref={containerRef} className="min-h-0">
        {view === 'queue' ? (
          <QueuePage setView={setView} />
        ) : view === 'solutions' ? (
          <SolutionsPage
            setView={setView}
            onManualQuestionSubmit={submitManualQuestion}
            onClearChat={() => {
              resetChatSession().catch(console.error);
            }}
            isManualQuestionProcessing={status === ASSISTANT_STATUS.RESPONDING}
            audioTranscript={transcript}
          />
        ) : null}
      </div>
    </AppModeLayoutProvider>
  );
};

const SubscribedApp: React.FC<SubscribedAppProps> = ({ user }) => {
  const subscriptionValue = useMemo(
    () => ({
      user,
      isFree: user.subscription.level === SubscriptionLevel.FREE,
    }),
    [user],
  );

  return (
    <SubscriptionProvider value={subscriptionValue}>
      <SettingsProvider>
        <SolutionProvider>
          <ScreenshotProvider>
            <SubscribedAppContent />
          </ScreenshotProvider>
        </SolutionProvider>
      </SettingsProvider>
    </SubscriptionProvider>
  );
};

export default SubscribedApp;
