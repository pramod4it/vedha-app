import { useEffect, useRef, useState } from 'react';
import type { DebugResponse } from '@shared/api.ts';
import { useSolutionContext } from '../contexts/SolutionContext';
import { useToast } from '../contexts/toast';
import { useScreenshotEvents } from './useScreenshotEvents';
import { useScreenshots } from './useScreenshots';

type DebugWithApiAliases = DebugResponse & {
  time_complexity?: string;
  space_complexity?: string;
  data?: Partial<DebugWithApiAliases>;
  solution?: Partial<DebugWithApiAliases>;
};

function getTimeComplexity(solution: DebugWithApiAliases): string | null {
  return (
    solution.timeComplexity ||
    solution.time_complexity ||
    solution.data?.timeComplexity ||
    solution.data?.time_complexity ||
    solution.solution?.timeComplexity ||
    solution.solution?.time_complexity ||
    null
  );
}

function getSpaceComplexity(solution: DebugWithApiAliases): string | null {
  return (
    solution.spaceComplexity ||
    solution.space_complexity ||
    solution.data?.spaceComplexity ||
    solution.data?.space_complexity ||
    solution.solution?.spaceComplexity ||
    solution.solution?.space_complexity ||
    null
  );
}

export function useDebug(isProcessing: boolean, setIsProcessing: (processing: boolean) => void) {
  const { showToast } = useToast();
  const { state: solutionState } = useSolutionContext();
  const contentRef = useRef<HTMLDivElement>(null);

  const { screenshots, refetch, handleDeleteScreenshot: deleteScreenshot } = useScreenshots();

  const [newCode, setNewCode] = useState<string | null>(null);
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null);
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(null);
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(null);

  const handleDeleteScreenshot = async (index: number) => {
    await deleteScreenshot(index);
  };

  const updateDimensions = () => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const contentWidth = contentRef.current.scrollWidth;

      window.electronAPI
        .updateContentDimensions({
          width: contentWidth,
          height: contentHeight,
          source: 'useDebug',
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    if (solutionState.newSolution) {
      const solution = solutionState.newSolution as DebugWithApiAliases;
      setNewCode(solution.code || null);
      setThoughtsData(
        'thoughts' in solution ? solution.thoughts || null : null,
      );
      setTimeComplexityData(getTimeComplexity(solution));
      setSpaceComplexityData(getSpaceComplexity(solution));
      setIsProcessing(false);
    }

    const cleanupFunctions = [
      window.electronAPI.onDebugSuccess(() => setIsProcessing(false)),
      window.electronAPI.onDebugStart(() => setIsProcessing(true)),
      window.electronAPI.onDebugError((error: string) => {
        showToast('Processing Failed', 'There was an error debugging your code.', 'error');
        setIsProcessing(false);
        console.error('Processing error:', error);
      }),
    ];

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    updateDimensions();

    return () => {
      resizeObserver.disconnect();
      cleanupFunctions.forEach((cleanup) => {
        cleanup();
      });
    };
  }, [solutionState.newSolution, setIsProcessing, showToast]);

  useScreenshotEvents({ refetch });

  return {
    screenshots,
    newCode,
    thoughtsData,
    timeComplexityData,
    spaceComplexityData,
    contentRef,
    handleDeleteScreenshot,
    refetch,
  };
}
