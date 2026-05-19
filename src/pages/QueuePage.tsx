import React from 'react';

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
                                  setView,
                                }) => {

  const {
    screenshots,
    handleDeleteScreenshot,
    handleTooltipVisibilityChange,
    contentRef,
  } = useQueue();

  const openManualQuestionScreen = () => {
      setView('solutions');
  };

  React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
          if (
              (event.ctrlKey || event.metaKey) &&
              (
                  event.key.toLowerCase() === 'm' ||
                  event.code === 'KeyM'
              )
          ) {
              event.preventDefault();
              openManualQuestionScreen();
          }
      };

      window.addEventListener(
          'keydown',
          handleKeyDown,
      );

      return () => {
          window.removeEventListener(
              'keydown',
              handleKeyDown,
          );
      };
  }, []);

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
          onManualQuestionOpen={
            openManualQuestionScreen
          }
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
