import type { AnswerDepth, InterviewMetadata } from '@shared/api.ts';
import type React from 'react';
import { useEffect, useState } from 'react';

const ANSWER_DEPTH_LABELS: Record<AnswerDepth, string> = {
  short: 'Short',
  medium: 'Medium',
  systemdesign: 'System Design',
};

const ANSWER_DEPTHS = Object.keys(ANSWER_DEPTH_LABELS) as AnswerDepth[];

interface AnswerDepthSelectorProps {
  compact?: boolean;
  depths?: AnswerDepth[];
}

export const AnswerDepthSelector: React.FC<AnswerDepthSelectorProps> = ({
  compact = false,
  depths = ANSWER_DEPTHS,
}) => {
  const [answerDepth, setAnswerDepth] = useState<AnswerDepth>('short');
  const [metadata, setMetadata] = useState<InterviewMetadata | null>(null);

  useEffect(() => {
    window.electronAPI
      .getInterviewMetadata()
      .then((result) => {
        const loadedMetadata = result.success ? result.metadata || null : null;

        setMetadata(loadedMetadata);
        setAnswerDepth(loadedMetadata?.answerDepth || 'short');
      })
      .catch(console.error);
  }, []);

  const handleChange = (nextDepth: AnswerDepth) => {
    setAnswerDepth(nextDepth);

    const nextMetadata: InterviewMetadata = {
      ...metadata,
      companyName: metadata?.companyName || '',
      interviewerName: metadata?.interviewerName || '',
      answerDepth: nextDepth,
    };

    setMetadata(nextMetadata);

    window.electronAPI
      .setInterviewMetadata(nextMetadata)
      .then(() => {
        window.dispatchEvent(
          new CustomEvent('vedha-answer-depth-changed', {
            detail: nextDepth,
          }),
        );
      })
      .catch(console.error);
  };

  return (
    <div className={compact ? 'flex items-center gap-2' : 'mb-3 px-2 space-y-1'}>
      <div className={compact ? 'text-[11px] font-medium uppercase tracking-wide text-zinc-400' : 'text-[13px] font-medium text-white/90'}>
        Answer depth
      </div>
      <div
        className={
          compact
            ? 'inline-flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950/70 p-1'
            : 'grid grid-cols-2 gap-1 rounded-sm border border-white/10 bg-white/5 p-1'
        }
        role="group"
        aria-label="Answer depth"
      >
        {depths.map((depth) => (
          <button
            key={depth}
            type="button"
            aria-pressed={answerDepth === depth}
            onClick={() => handleChange(depth)}
            className={`${compact ? 'rounded-md px-2.5 py-1.5 text-[11px]' : 'rounded-sm px-2 py-1 text-[11px]'} font-medium transition-colors ${
              answerDepth === depth
                ? 'bg-cyan-500 text-zinc-950'
                : compact
                  ? 'text-zinc-300 hover:bg-zinc-800'
                  : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            {ANSWER_DEPTH_LABELS[depth]}
          </button>
        ))}
      </div>
    </div>
  );
};
