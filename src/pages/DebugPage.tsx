import type React from 'react';

import {
  CommandSection,
  ScreenshotSection,
  SolutionSection,
} from '../components/sections';

import { useDebug } from '../hooks';

import {
  LiveInterviewLayout,
} from '../layouts';

interface DebugPageProps {
  isProcessing: boolean;

  setIsProcessing:
      (isProcessing: boolean) => void;
}

const DebugPage:
    React.FC<DebugPageProps> = ({
                                  isProcessing,
                                  setIsProcessing,
                                }) => {

  const {
    screenshots,
    newCode,
    thoughtsData,
    contentRef,
    handleDeleteScreenshot,
  } = useDebug(
      isProcessing,
      setIsProcessing,
  );

  const screenshotSection =
      screenshots.length > 0
          ? (
              <ScreenshotSection
                  screenshots={screenshots}
                  onDeleteScreenshot={
                    handleDeleteScreenshot
                  }
                  isLoading={
                    isProcessing
                  }
              />
          )
          : null;

  const commandSection = (
      <CommandSection
          mode="debug"
          isProcessing={
            isProcessing
          }
          screenshots={
            screenshots
          }
      />
  );

  const solutionSection = (
      <SolutionSection
          solutionData={newCode}
          thoughtsData={thoughtsData}
          title="Solution"
      />
  );

  return (
      <div
          ref={contentRef}
          className="relative space-y-3 px-4 py-3"
      >
        <LiveInterviewLayout
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

export default DebugPage;
