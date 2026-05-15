import type React from 'react';

interface ThoughtsListProps {
  thoughts: string[];
}

export function formatCandidateThought(thought: string): string {
  const trimmedThought = thought.trim();

  if (/^brute force:/i.test(trimmedThought)) {
    return `A simple first idea: ${trimmedThought.replace(/^brute force:\s*/i, '')}`;
  }

  if (/^optimized:/i.test(trimmedThought)) {
    return `A better approach: ${trimmedThought.replace(/^optimized:\s*/i, '')}`;
  }

  if (/^optimized approach works/i.test(trimmedThought)) {
    return trimmedThought.replace(
      /^optimized approach works as it/i,
      'This is faster because it',
    );
  }

  if (/^edge cases:/i.test(trimmedThought)) {
    return `Remember to mention edge cases: ${trimmedThought.replace(/^edge cases:\s*/i, '')}`;
  }

  if (/^describe the solution:/i.test(trimmedThought)) {
    return `When explaining it, ${trimmedThought
      .replace(/^describe the solution:\s*/i, '')
      .replace(/^start/i, 'start')}`;
  }

  return trimmedThought;
}

const ThoughtsList: React.FC<ThoughtsListProps> = ({ thoughts }) => {
  return (
    <div className="space-y-2">
      {thoughts.map((thought, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
          <div className="text-xs leading-5 text-gray-100">
            {formatCandidateThought(thought)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ThoughtsList;
