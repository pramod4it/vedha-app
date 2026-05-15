import type React from 'react';
import { useEffect, useState } from 'react';
import { LATEST_ANSWER_LIMIT } from '@shared/constants.ts';
import { Mic, MicOff, Send } from 'lucide-react';

import {
    CommandSection,
    ScreenshotSection,
    SolutionSection,
} from '../components/sections';

import {
    useSolutionContext,
} from '../contexts/SolutionContext';

import { useSolutions } from '../hooks';

import {
    LiveInterviewLayout,
} from '../layouts';

import DebugPage from './DebugPage';

interface SolutionsPageProps {
    setView: (
        view:
            | 'queue'
            | 'solutions'
            | 'debug',
    ) => void;
    audioEnabled?: boolean;
    onAudioEnabledChange?: (
        enabled: boolean,
    ) => void;
    onManualQuestionSubmit?: (
        question: string,
    ) => boolean;
}

const SolutionsPage:
    React.FC<SolutionsPageProps> = ({
                                        setView: _setView,
                                        audioEnabled = true,
                                        onAudioEnabledChange,
                                        onManualQuestionSubmit,
                                    }) => {

    const [
        manualQuestion,
        setManualQuestion,
    ] = useState('');

    const [
        manualSubmitError,
        setManualSubmitError,
    ] = useState('');

    const {
        state: solutionState,
    } = useSolutionContext();

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
                width: 1800,
                height: 900,
                source: 'SolutionsPage',
            })
            .catch(console.error);

    }, []);

    if (
        !isResetting &&
        solutionState.newSolution
    ) {
        return (
            <DebugPage
                isProcessing={
                    debugProcessing
                }
                setIsProcessing={
                    setDebugProcessing
                }
            />
        );
    }

    const visibleSolutions =
        solutionHistory;

    const latestAnswerSummary =
        LATEST_ANSWER_LIMIT === 0
            ? 'Showing all interviewer questions and answers'
            : `Showing latest ${LATEST_ANSWER_LIMIT} interviewer questions and answers`;

    const handleManualQuestionSubmit = () => {
        const question =
            manualQuestion.replace(/\s+/g, ' ')
                .trim();

        if (!question) {
            setManualSubmitError(
                'Enter the interviewer question first.',
            );
            return;
        }

        const submitted =
            onManualQuestionSubmit?.(
                question,
            ) ?? false;

        if (!submitted) {
            setManualSubmitError(
                'Backend is not ready. Try again in a moment.',
            );
            return;
        }

        setManualQuestion('');
        setManualSubmitError('');
    };

    const hasSolutionContent =
        Boolean(
            visibleSolutions.length > 0 ||
            solutionData ||
            answerTextData ||
            diagramData ||
            (
                thoughtsData &&
                thoughtsData.length > 0
            ),
        );

    const screenshotSection =
        hasSolutionContent &&
        screenshots.length > 0
            ? (
                <ScreenshotSection
                    screenshots={
                        screenshots
                    }
                    onDeleteScreenshot={
                        handleDeleteScreenshot
                    }
                    isLoading={
                        debugProcessing
                    }
                />
            )
            : null;

    const commandSection = (
        <CommandSection
            mode="solutions"
            isProcessing={
                !hasSolutionContent
            }
            screenshots={
                screenshots
            }
        />
    );

    const solutionSection = (
        <div className="w-full max-w-[720px] space-y-6">

            <div className="w-full overflow-hidden rounded-3xl border border-zinc-800/70 bg-zinc-950/70 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">

                <div className="border-b border-zinc-800 px-5 py-4">

                    <div className="flex flex-wrap items-start justify-between gap-3">

                        <div>

                            <h1 className="text-xl font-bold tracking-tight text-white">
                                Latest answers
                            </h1>

                            <p className="mt-1.5 text-xs text-zinc-400">
                                {latestAnswerSummary}
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() => onAudioEnabledChange?.(!audioEnabled)}
                            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
                                audioEnabled
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                                    : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                            }`}
                            title={
                                audioEnabled
                                    ? 'Audio listening is on'
                                    : 'Audio listening is off'
                            }
                        >
                            {audioEnabled ? (
                                <Mic className="h-4 w-4" />
                            ) : (
                                <MicOff className="h-4 w-4" />
                            )}
                            <span>
                                {audioEnabled ? 'Audio On' : 'Audio Off'}
                            </span>
                        </button>

                    </div>

                </div>

                <div className="w-full p-5 xl:p-6">

                    <div className="mb-5 rounded-2xl border border-zinc-800/70 bg-zinc-950/60 p-4">

                        <label
                            htmlFor="manual-question"
                            className="text-xs font-semibold uppercase tracking-wide text-zinc-400"
                        >
                            Manual question
                        </label>

                        <div className="mt-2 flex flex-col gap-3 sm:flex-row">

                            <textarea
                                id="manual-question"
                                value={manualQuestion}
                                onChange={(event) => {
                                    setManualQuestion(event.target.value);
                                    setManualSubmitError('');
                                }}
                                onKeyDown={(event) => {
                                    if (
                                        event.key === 'Enter' &&
                                        (event.ctrlKey || event.metaKey)
                                    ) {
                                        event.preventDefault();
                                        handleManualQuestionSubmit();
                                    }
                                }}
                                rows={3}
                                className="min-h-[76px] flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-5 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20"
                                placeholder="Type the interviewer question here"
                            />

                            <button
                                type="button"
                                onClick={handleManualQuestionSubmit}
                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
                                disabled={!manualQuestion.trim()}
                                title="Send typed question"
                            >
                                <Send className="h-4 w-4" />
                                <span>Send</span>
                            </button>

                        </div>

                        {manualSubmitError ? (
                            <p className="mt-2 text-xs text-rose-300">
                                {manualSubmitError}
                            </p>
                        ) : null}

                    </div>

                    {!hasSolutionContent ? (
                        <SolutionSection
                            isGenerating={true}
                        />
                    ) : (
                        <div className="max-h-[52vh] space-y-5 overflow-y-auto pr-1">
                            {visibleSolutions.map(
                                (
                                    solution,
                                    index,
                                ) => (
                                    <div
                                        key={
                                            solution.conversationId ||
                                            `${solution.problemStatement}-${index}`
                                        }
                                        className="rounded-2xl border border-zinc-800/70 bg-zinc-950/50"
                                    >

                                        <div className="border-b border-zinc-800/70 px-4 py-3">

                                            <div className="flex items-start justify-between gap-3">

                                                <div className="min-w-0">

                                                    <h2 className="whitespace-pre-wrap text-sm font-semibold leading-5 text-zinc-100">
                                                        {`${solution.displaySequence || visibleSolutions.length - index}. ${solution.problemStatement || 'Question'}`}
                                                    </h2>

                                                </div>

                                                <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
                                                    {`#${solution.displaySequence || visibleSolutions.length - index}`}
                                                </span>

                                            </div>

                                        </div>

                                        <div className="p-4">

                                            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                Answer:
                                            </div>

                                            <SolutionSection
                                                solutionData={
                                                    solution.code || null
                                                }
                                                answerTextData={
                                                    solution.answerText || null
                                                }
                                                diagramData={
                                                    solution.diagramMermaid || null
                                                }
                                                thoughtsData={
                                                    solution.thoughts || null
                                                }
                                                followUpQuestions={
                                                    solution.followUpQuestions || null
                                                }
                                                sayThis={
                                                    solution.sayThis || null
                                                }
                                                example={
                                                    solution.example || null
                                                }
                                                title="Answer"
                                            />

                                        </div>

                                    </div>
                                ),
                            )}
                        </div>
                    )}

                </div>

            </div>

        </div>
    );

    return (
        <div
            ref={contentRef}
            className="relative w-full overflow-x-hidden px-4 py-4"
        >

            <LiveInterviewLayout
                className="flex-col items-center overflow-x-hidden pr-0"
                screenshotSection={
                    screenshotSection
                }
                commandSection={
                    commandSection
                }
                solutionSection={
                    solutionSection
                }
            />

        </div>
    );
};

export default SolutionsPage;
