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
    <div className={`flex w-full min-w-0 items-start gap-3 overflow-x-hidden pb-2 ${className}`}>
      {commandSection && <div className="w-full max-w-full shrink-0">{commandSection}</div>}

      {screenshotSection && <div className="w-[240px] shrink-0">{screenshotSection}</div>}

      {solutionSection && <div className="w-full min-w-0 flex-1">{solutionSection}</div>}
    </div>
  );
};
