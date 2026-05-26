import type { AnswerDepth, InterviewMetadata } from '@shared/api.ts';
import type React from 'react';
import { useEffect, useState } from 'react';

function normalizeManualAnswerDepth(answerDepth?: AnswerDepth | null): AnswerDepth {
  return answerDepth === 'short' ? 'short' : 'medium';
}

export const ShortAnswerCheckbox: React.FC = () => {
  const [checked, setChecked] = useState(true);
  const [metadata, setMetadata] = useState<InterviewMetadata | null>(null);

  useEffect(() => {
    window.electronAPI
      .getInterviewMetadata()
      .then((result) => {
        const loadedMetadata = result.success ? result.metadata || null : null;
        const nextAnswerDepth = normalizeManualAnswerDepth(loadedMetadata?.answerDepth);

        setMetadata(loadedMetadata);
        setChecked(nextAnswerDepth === 'short');

        if (loadedMetadata && loadedMetadata.answerDepth !== nextAnswerDepth) {
          return window.electronAPI.setInterviewMetadata({
            ...loadedMetadata,
            answerDepth: nextAnswerDepth,
          });
        }

        return undefined;
      })
      .catch(console.error);
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextChecked = event.target.checked;
    const nextDepth: AnswerDepth = nextChecked ? 'short' : 'medium';

    setChecked(nextChecked);

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
    <label className="inline-flex h-7 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/70 px-2.5 text-[11px] font-medium text-zinc-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="h-3.5 w-3.5 accent-cyan-400"
        aria-label="Short Answer"
      />
      <span>Short Answer</span>
    </label>
  );
};
