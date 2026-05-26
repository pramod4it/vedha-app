import type React from 'react';
import type { ProgrammingLanguage } from '../../../shared/api';

interface SolutionContentProps {
  title: string;
  content: React.ReactNode;
  isLoading: boolean;
  currentLanguage?: ProgrammingLanguage;
  type?: 'code' | 'text';
}

const SolutionContent: React.FC<SolutionContentProps> = ({
  title,
  content,
  isLoading,
  type = 'text',
}) => {
  return (
    <div className="min-w-0 rounded-lg bg-[#1E2530]/70 p-3 backdrop-blur">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <h2 className="text-xs font-semibold text-white tracking-wide">{title}</h2>
      </div>

      {isLoading ? (
        <div className="mt-4 flex">
          <p className="text-xs bg-linear-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
            Loading...
          </p>
        </div>
      ) : (
        <div className={`min-w-0 overflow-x-hidden text-xs leading-[1.45] ${type === 'text' ? 'text-gray-100' : ''}`}>
          {content}
        </div>
      )}
    </div>
  );
};

export default SolutionContent;
