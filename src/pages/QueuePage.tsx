import type React from 'react';

import {
  CommandSection,
  ScreenshotSection,
} from '../components/sections';

import { useQueue } from '../hooks';

import {
  LiveInterviewLayout,
} from '../layouts';

interface QueuePageProps {
  setView: (
      view:
          | 'queue'
          | 'solutions'
          | 'debug',
  ) => void;
}

const QueuePage:
    React.FC<QueuePageProps> = ({
                                  setView: _setView,
                                }) => {

  const {
    screenshots,
    handleDeleteScreenshot,
    handleTooltipVisibilityChange,
    contentRef,
  } = useQueue();

  const screenshotSection =
      screenshots.length > 0
          ? (
              <ScreenshotSection
                  screenshots={screenshots}
                  onDeleteScreenshot={
                    handleDeleteScreenshot
                  }
                  isLoading={false}
              />
          )
          : null;

  const commandSection = (
      <CommandSection
          mode="queue"
          onTooltipVisibilityChange={
            handleTooltipVisibilityChange
          }
          screenshotCount={
            screenshots.length
          }
      />
  );

    return (
        <div
            ref={contentRef}
            className="w-full bg-transparent"
        >

            <div className="px-5 py-5">

                <div className="w-full space-y-5">

                    <LiveInterviewLayout
                        className="justify-center pr-0"
                        screenshotSection={
                            screenshotSection
                        }
                        commandSection={
                            commandSection
                        }
                    />

                </div>

            </div>

        </div>
    );
};

export default QueuePage;
