import { LoaderCircle, Mic, MicOff, Send, Trash2, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { CommandSection, ScreenshotSection, SolutionSection } from '../components/sections';
import { LanguageSelector } from '../components/shared/LanguageSelector';
import { ShortAnswerCheckbox } from '../components/shared/ShortAnswerCheckbox';

import { API_BASE_URL } from '../config';
import { useSolutionContext } from '../contexts/SolutionContext';

import { useSolutions } from '../hooks';

import { LiveInterviewLayout } from '../layouts';

import DebugPage from './DebugPage';

interface SolutionsPageProps {
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
  onManualQuestionSubmit?: (question: string) => boolean;
  onClearChat?: () => void;
  isManualQuestionProcessing?: boolean;
  audioTranscript?: string;
}

const SolutionsPage: React.FC<SolutionsPageProps> = ({
  setView: _setView,
  onManualQuestionSubmit,
  onClearChat,
  isManualQuestionProcessing = false,
  audioTranscript = '',
}) => {
  const [manualQuestion, setManualQuestion] = useState('');

  const [pendingQuestion, setPendingQuestion] = useState('');

  const [manualSubmitError, setManualSubmitError] = useState('');

  const [audioDraftEnabled, setAudioDraftEnabled] = useState(true);

  const { state: solutionState, clearSolution } = useSolutionContext();

  const {
    debugProcessing,
    solutionData,
    answerTextData,
    diagramData,
    thoughtsData,
    solutionHistory,
    isResetting,
    screenshots,
    contentRef,
    handleDeleteScreenshot,
    setDebugProcessing,
  } = useSolutions();

  useEffect(() => {
    window.electronAPI
      .updateContentDimensions({
        width: 980,
        height: 760,
        source: 'SolutionsPage',
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!audioDraftEnabled || !audioTranscript.trim()) {
      return;
    }

    const nextTranscript = audioTranscript.trim();

    setManualQuestion((currentQuestion) => {
      const current = currentQuestion.trim();

      if (!current) {
        return nextTranscript;
      }

      if (current.includes(nextTranscript)) {
        return currentQuestion;
      }

      if (nextTranscript.includes(current)) {
        return nextTranscript;
      }

      return `${currentQuestion.trimEnd()} ${nextTranscript}`;
    });
    setManualSubmitError('');
  }, [audioDraftEnabled, audioTranscript]);

  useEffect(() => {
    const endpoint = audioDraftEnabled ? 'start' : 'stop';

    fetch(`${API_BASE_URL}/audio/native/${endpoint}`, {
      method: 'POST',
    }).catch(console.error);
  }, [audioDraftEnabled]);

  useEffect(() => {
    if (!isManualQuestionProcessing) {
      setPendingQuestion('');
    }
  }, [isManualQuestionProcessing]);

  if (!isResetting && solutionState.newSolution) {
    return <DebugPage isProcessing={debugProcessing} setIsProcessing={setDebugProcessing} />;
  }

  const visibleSolutions = solutionHistory;

  const handleManualQuestionSubmit = () => {
    if (isManualQuestionProcessing) {
      return;
    }

    const question = manualQuestion.replace(/\s+/g, ' ').trim();

    if (!question) {
      setManualSubmitError('Enter the interviewer question first.');
      return;
    }

    const submitted = onManualQuestionSubmit?.(question) ?? false;

    if (!submitted) {
      setManualSubmitError('Backend is not ready. Try again in a moment.');
      return;
    }

    setPendingQuestion(question);
    setManualQuestion('');
    setManualSubmitError('');
  };

  const clearManualQuestion = () => {
    setManualQuestion('');
    setManualSubmitError('');
  };

  const handleClearChat = () => {
    clearSolution();
    onClearChat?.();
  };

  const isManualSubmitShortcut = (event: React.KeyboardEvent<HTMLTextAreaElement>) =>
    (event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'm' || event.code === 'KeyM');

  const hasSolutionContent = Boolean(
    visibleSolutions.length > 0 ||
      solutionData ||
      answerTextData ||
      diagramData ||
      (thoughtsData && thoughtsData.length > 0),
  );

  const shouldShowAnswerArea = hasSolutionContent || isManualQuestionProcessing;
  const visibleAnswerCards =
    isManualQuestionProcessing && visibleSolutions.length === 0
      ? [
          {
            answerText: '',
            code: '',
            conversationId: 'pending-manual-answer',
            diagramMermaid: '',
            displaySequence: 1,
            isPending: true,
            problemStatement: pendingQuestion || 'Manual question',
          },
        ]
      : visibleSolutions.map((solution, index) => ({
          ...solution,
          displaySequence: solution.displaySequence || visibleSolutions.length - index,
          isPending: false,
        }));

  const screenshotSection =
    hasSolutionContent && screenshots.length > 0 ? (
      <ScreenshotSection
        screenshots={screenshots}
        onDeleteScreenshot={handleDeleteScreenshot}
        isLoading={debugProcessing}
      />
    ) : null;

  const commandSection = (
    <CommandSection mode="solutions" isProcessing={!hasSolutionContent} screenshots={screenshots} />
  );

  const solutionSection = (
    <div className="w-full max-w-full space-y-6">
      <div className="w-full overflow-hidden rounded-3xl border border-zinc-800/70 bg-zinc-950/70 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="border-b border-zinc-800 px-5 py-2.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Latest answers</h1>

              <p className="mt-0.5 text-xs text-zinc-400">Current chat questions and answers</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <LanguageSelector compact showReadableVarNames={false} />

              <ShortAnswerCheckbox />

              <button
                type="button"
                onClick={handleClearChat}
                disabled={!hasSolutionContent}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 text-[11px] font-medium text-zinc-300 transition hover:border-rose-500/50 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                title="Clear chat window"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Chat</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full p-3 xl:p-4">
          <div className="mb-4 rounded-2xl border border-zinc-800/70 bg-zinc-950/60 p-4">
            <label
              htmlFor="manual-question"
              className="text-sm font-semibold uppercase tracking-wide text-zinc-300"
            >
              Manual question
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAudioDraftEnabled((enabled) => !enabled)}
                className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition ${
                  audioDraftEnabled
                    ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-100'
                    : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-cyan-500/50 hover:text-cyan-200'
                }`}
                title="Toggle transcript drafting into the textarea"
                aria-pressed={audioDraftEnabled}
              >
                {audioDraftEnabled ? (
                  <Mic className="h-3.5 w-3.5" />
                ) : (
                  <MicOff className="h-3.5 w-3.5" />
                )}
                <span>Audio</span>
              </button>

              <span className="text-[11px] text-zinc-500">
                {audioDraftEnabled ? 'On' : 'Off'}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-3 lg:flex-row">
              <textarea
                id="manual-question"
                value={manualQuestion}
                onChange={(event) => {
                  setManualQuestion(event.target.value);
                  setManualSubmitError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    clearManualQuestion();
                    return;
                  }

                  if (isManualSubmitShortcut(event)) {
                    event.preventDefault();
                    handleManualQuestionSubmit();
                  }
                }}
                rows={5}
                className="min-h-[110px] flex-1 resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-normal leading-5 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Type the interviewer question here"
              />

              <div className="flex shrink-0 flex-row gap-2 lg:flex-col lg:self-end">
                <button
                  type="button"
                  onClick={clearManualQuestion}
                  className="inline-flex h-12 min-w-[108px] items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-xs font-medium text-zinc-300 transition hover:border-rose-500/50 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!manualQuestion}
                  title="Clear typed question (Ctrl+Backspace)"
                >
                  <X className="h-4 w-4" />
                  <span>Clear</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualQuestionSubmit}
                  className="inline-flex h-12 min-w-[108px] items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 text-base font-semibold text-zinc-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!manualQuestion.trim() || isManualQuestionProcessing}
                  title="Send typed question (Ctrl+M)"
                >
                  {isManualQuestionProcessing ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  <span>{isManualQuestionProcessing ? 'Sending' : 'Send'}</span>
                </button>
              </div>
            </div>

            {manualSubmitError ? (
              <p className="mt-2 text-xs text-rose-300">{manualSubmitError}</p>
            ) : null}
          </div>

          {shouldShowAnswerArea ? (
            <div className="min-h-[260px] max-h-[48vh] space-y-4 overflow-y-auto overflow-x-hidden pr-1 transition-[min-height,opacity] duration-200 ease-out">
              {visibleAnswerCards.map((solution) => (
                <div
                  key={`answer-${solution.displaySequence}`}
                  className="rounded-2xl border border-zinc-800/70 bg-zinc-950/50 transition-opacity duration-200"
                >
                  <div className="border-b border-zinc-800/70 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="whitespace-pre-wrap text-sm font-semibold leading-5 text-zinc-100">
                          {`${solution.displaySequence}. ${solution.problemStatement || 'Question'}`}
                        </h2>
                      </div>

                      <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
                        {`#${solution.displaySequence}`}
                      </span>
                    </div>
                  </div>

                  <div className="min-h-[190px] min-w-0 p-4 transition-colors duration-200">
                    {solution.isPending ? (
                      <div className="rounded-xl border border-zinc-800/60 bg-[#1E2530]/60 p-4">
                        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-cyan-100">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          <span>Generating answer</span>
                        </div>

                        <div className="space-y-2">
                          <div className="h-3 w-11/12 animate-pulse rounded bg-zinc-700/55" />
                          <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-700/45" />
                          <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-700/35" />
                        </div>
                      </div>
                    ) : (
                      <SolutionSection
                        solutionData={solution.code || null}
                        answerTextData={solution.answerText || null}
                        diagramData={solution.diagramMermaid || null}
                        title="Answer"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="min-h-[260px] rounded-2xl border border-zinc-800/50 bg-zinc-950/30" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={contentRef} className="relative w-full overflow-x-hidden px-3 py-1">
      <LiveInterviewLayout
        className="flex-col items-center gap-2 overflow-x-hidden pb-0 pr-0"
        screenshotSection={screenshotSection}
        commandSection={commandSection}
        solutionSection={solutionSection}
      />
    </div>
  );
};

export default SolutionsPage;
