import type React from 'react';
import type { ReactNode } from 'react';

interface LiveInterviewLayoutProps {
  screenshotSection?: ReactNode;
  commandSection?: ReactNode;
  solutionSection?: ReactNode;
  className?: string;
}

export const LiveInterviewLayout: React.FC<LiveInterviewLayoutProps> = ({
  screenshotSection,
  commandSection,
  solutionSection,
  className = '',
}) => {
  return (
    <div className={`flex w-full items-start gap-6 overflow-x-auto pb-2 pr-6 ${className}`}>
      {commandSection && <div className="w-fit max-w-full shrink-0">{commandSection}</div>}

      {screenshotSection && <div className="w-[240px] shrink-0">{screenshotSection}</div>}

      {solutionSection && <div className="min-w-0 flex-1">{solutionSection}</div>}
    </div>
  );
};
