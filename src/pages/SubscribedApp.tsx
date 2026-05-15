import { type AuthenticatedUser, type SolveResponse, SubscriptionLevel } from '@shared/api.ts';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScreenshotProvider } from '../contexts/ScreenshotContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { SolutionProvider, useSolutionContext } from '../contexts/SolutionContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { useToast } from '../contexts/toast';
import { useRealtimeAssistant } from '../hooks/useRealtimeAssistant';
import { AppModeLayoutProvider } from '../layouts';
import { QueuePage, SolutionsPage } from '.';

interface SubscribedAppProps {
  user: AuthenticatedUser;
}

const SubscribedAppContent: React.FC = () => {
  const { clearAll, setSolution } = useSolutionContext();
  const [view, setView] = useState<'queue' | 'solutions' | 'debug'>('queue');
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const {
    start,
    response,
    error,
    audioEnabled,
    setAudioEnabled,
    submitManualQuestion,
  } = useRealtimeAssistant();
  const lastRealtimeResponseRef = useRef('');

  useEffect(() => {
    start().catch(console.error);
  }, [start]);

  useEffect(() => {
    if (error) {
      showToast('Audio Detection', error, 'error');
    }
  }, [error, showToast]);

  useEffect(() => {
    if (!response || response === lastRealtimeResponseRef.current) {
      return;
    }

    lastRealtimeResponseRef.current = response;

    try {
      const parsed = JSON.parse(response) as Partial<SolveResponse>;
      const hasContent = Boolean(
        parsed.code ||
          parsed.answerText ||
          parsed.diagramMermaid ||
          parsed.problemStatement ||
          (parsed.thoughts && parsed.thoughts.length > 0),
      );

      if (parsed.messageType === 'CLARIFICATION_REQUEST') {
        return;
      }

      if (hasContent) {
        setSolution({
          thoughts: parsed.thoughts || [],
          code: parsed.code || '',
          answerText: parsed.answerText || '',
          diagramMermaid: parsed.diagramMermaid || '',
          messageType: parsed.messageType || 'NEW_QUESTION',
          parentQuestionId: parsed.parentQuestionId,
          answerDepth: parsed.answerDepth,
          timeComplexity: parsed.timeComplexity || 'Unknown',
          spaceComplexity: parsed.spaceComplexity || 'Unknown',
          problemStatement: parsed.problemStatement || '',
          conversationId: parsed.conversationId || crypto.randomUUID(),
          followUpQuestions: parsed.followUpQuestions || [],
          sayThis: parsed.sayThis || '',
          example: parsed.example || '',
        });
        setView('solutions');
      }
    } catch {
      setSolution({
        thoughts: ['The interviewer asked a question. Here is a concise answer from the backend.'],
        code: response,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A',
        problemStatement: response,
        conversationId: crypto.randomUUID(),
      });
      setView('solutions');
    }
  }, [response, setSolution]);

  // Dynamically update the window size
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const updateDimensions = () => {
      if (!containerRef.current) {
        return;
      }
      const height = containerRef.current.scrollHeight;
      const width = containerRef.current.scrollWidth;
      window.electronAPI
        ?.updateContentDimensions({ width, height, source: 'SubscribedApp' })
        .catch(console.error);
    };

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
            audioEnabled={audioEnabled}
            onAudioEnabledChange={setAudioEnabled}
            onManualQuestionSubmit={submitManualQuestion}
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
