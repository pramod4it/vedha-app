import type { AnswerDepth, InterviewMetadata } from '@shared/api.ts';
import type React from 'react';
import { useEffect, useState } from 'react';

const ANSWER_DEPTH_LABELS: Record<AnswerDepth, string> = {
  short: 'Short',
  medium: 'Medium',
  systemdesign: 'System Design',
};

const ANSWER_DEPTHS = Object.keys(ANSWER_DEPTH_LABELS) as AnswerDepth[];

export const AnswerDepthSelector: React.FC = () => {
  const [answerDepth, setAnswerDepth] = useState<AnswerDepth>('medium');
  const [metadata, setMetadata] = useState<InterviewMetadata | null>(null);

  useEffect(() => {
    window.electronAPI
      .getInterviewMetadata()
      .then((result) => {
        const loadedMetadata = result.success ? result.metadata || null : null;

        setMetadata(loadedMetadata);
        setAnswerDepth(loadedMetadata?.answerDepth || 'medium');
      })
      .catch(console.error);
  }, []);

  const handleChange = (nextDepth: AnswerDepth) => {
    setAnswerDepth(nextDepth);

    const nextMetadata: InterviewMetadata = {
      ...metadata,
      companyName: metadata?.companyName || '',
      interviewerName: metadata?.interviewerName || '',
      interviewRound: metadata?.interviewRound || '',
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
    <div className="mb-3 px-2 space-y-1">
      <div className="text-[13px] font-medium text-white/90">Answer depth</div>
      <div
        className="grid grid-cols-2 gap-1 rounded-sm border border-white/10 bg-white/5 p-1"
        role="group"
        aria-label="Answer depth"
      >
        {ANSWER_DEPTHS.map((depth) => (
          <button
            key={depth}
            type="button"
            aria-pressed={answerDepth === depth}
            onClick={() => handleChange(depth)}
            className={`rounded-sm px-2 py-1 text-[11px] font-medium transition-colors ${
              answerDepth === depth
                ? 'bg-cyan-600/80 text-white'
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
