import type React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAppModeLayout } from '../../layouts';
import CodeBlock from '../Solutions/CodeBlock';
import MermaidDiagram from '../Solutions/MermaidDiagram';
import SolutionContent from '../Solutions/SolutionContent';
import ThoughtsList from '../Solutions/ThoughtsList';

interface SolutionSectionProps {
  solutionData?: string | null;
  answerTextData?: string | null;
  diagramData?: string | null;
  thoughtsData?: string[] | null;
  followUpQuestions?: string[] | null;
  sayThis?: string | null;
  example?: string | null;
  title?: string;
  isGenerating?: boolean;
  className?: string;
}

function formatAnswerLines(answer: string): string[] {
  return normalizeAnswerText(answer)
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^[-*•]\s*/, '')
        .replace(/^\d+[.)]\s*/, ''),
    )
    .filter(Boolean);
}

function normalizeAnswerText(answer: string): string {
  return answer
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}

const SolutionSectionInner: React.FC<SolutionSectionProps> = ({
  solutionData,
  answerTextData,
  diagramData,
  thoughtsData,
  followUpQuestions,
  sayThis,
  example,
  title = 'Solution',
  isGenerating = false,
  className = '',
}) => {
  const { solutionLanguage } = useSettings();
  const currentLanguage = solutionLanguage;

  if (isGenerating) {
    return (
      <div className={className}>
        <SolutionContent title="Generating solution" content="..." isLoading={true} />
      </div>
    );
  }

  if (
    !solutionData &&
    !answerTextData &&
    !diagramData &&
    !thoughtsData &&
    !followUpQuestions?.length &&
    !sayThis &&
    !example
  ) {
    return null;
  }

  if (title === 'Answer') {
    return (
      <div className={`space-y-4 ${className}`}>
        {answerTextData && (
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-100">
            {normalizeAnswerText(answerTextData)}
          </p>
        )}

        {diagramData && (
          <MermaidDiagram chart={diagramData} />
        )}

        {solutionData && (
          <CodeBlock code={solutionData} language={currentLanguage} showCopyButton={false} />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {thoughtsData && (
        <SolutionContent
          title={title === 'Solution' ? 'How I would explain it' : 'What I changed'}
          content={<ThoughtsList thoughts={thoughtsData} />}
          isLoading={!thoughtsData}
        />
      )}

      {answerTextData && (
        <SolutionContent
          title="Answer"
          content={
            <ul className="list-disc space-y-2 pl-5 text-zinc-100">
              {formatAnswerLines(answerTextData).map((line, index) => (
                <li
                  key={`${line}-${index}`}
                  className="whitespace-pre-wrap leading-6"
                >
                  {line}
                </li>
              ))}
            </ul>
          }
          isLoading={!answerTextData}
        />
      )}

      {sayThis && (
        <SolutionContent
          title="Say this"
          content={<p className="whitespace-pre-wrap leading-6 text-zinc-100">{normalizeAnswerText(sayThis)}</p>}
          isLoading={!sayThis}
        />
      )}

      {example && (
        <SolutionContent
          title="Example"
          content={<p className="whitespace-pre-wrap leading-6 text-zinc-100">{normalizeAnswerText(example)}</p>}
          isLoading={!example}
        />
      )}

      {followUpQuestions && followUpQuestions.length > 0 && (
        <SolutionContent
          title="Possible follow-ups"
          content={
            <ul className="list-disc space-y-2 pl-5 text-zinc-100">
              {followUpQuestions.map((question, index) => (
                <li key={`${question}-${index}`} className="whitespace-pre-wrap leading-6">
                  {question}
                </li>
              ))}
            </ul>
          }
          isLoading={false}
        />
      )}

      {diagramData && (
        <SolutionContent
          title="Diagram"
          content={<MermaidDiagram chart={diagramData} />}
          isLoading={!diagramData}
        />
      )}

      {solutionData && (
        <SolutionContent
          title={title}
          content={
            <CodeBlock code={solutionData} language={currentLanguage} showCopyButton={false} />
          }
          isLoading={!solutionData}
          type="code"
        />
      )}

    </div>
  );
};

export const SolutionSection: React.FC<SolutionSectionProps> = SolutionSectionInner;
