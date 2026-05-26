import { ProgrammingLanguage } from '@shared/api.ts';
import type React from 'react';
import CodeBlock from './CodeBlock';

interface MarkdownAnswerProps {
  content: string;
  language: ProgrammingLanguage;
}

type MarkdownPart =
  | {
      type: 'text';
      content: string;
    }
  | {
      type: 'code';
      content: string;
      language?: string;
    };

function parseMarkdownParts(content: string): MarkdownPart[] {
  const parts: MarkdownPart[] = [];
  const fencePattern = /```([\w-]*)?\r?\n([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = fencePattern.exec(content)) !== null) {
    if (match.index > cursor) {
      parts.push({
        type: 'text',
        content: content.slice(cursor, match.index),
      });
    }

    parts.push({
      type: 'code',
      language: match[1],
      content: match[2],
    });

    cursor = match.index + match[0].length;
  }

  if (cursor < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(cursor),
    });
  }

  return parts.length > 0
    ? parts
    : [
        {
          type: 'text',
          content,
        },
      ];
}

function normalizeText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .trim();
}

const MarkdownAnswer: React.FC<MarkdownAnswerProps> = ({ content, language }) => {
  const parts = parseMarkdownParts(content);

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={`${part.type}-${index}`}
              code={part.content}
              language={(part.language as ProgrammingLanguage) || language}
              showCopyButton={false}
            />
          );
        }

        const text = normalizeText(part.content);

        if (!text) {
          return null;
        }

        return (
          <p
            key={`${part.type}-${index}`}
            className="whitespace-pre-wrap text-sm leading-6 text-zinc-100"
          >
            {text}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownAnswer;
