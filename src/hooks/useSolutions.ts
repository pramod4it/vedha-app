import { useEffect, useRef, useState } from 'react';
import { useSolutionContext } from '../contexts/SolutionContext';
import { useToast } from '../contexts/toast';
import { useScreenshotEvents } from './useScreenshotEvents';
import { useScreenshots } from './useScreenshots';
import { SolveResponse } from '@shared/api.ts';

type SolutionWithApiAliases = SolveResponse & {
  time_complexity?: string;
  space_complexity?: string;
  data?: Partial<SolutionWithApiAliases>;
  solution?: Partial<SolutionWithApiAliases>;
};

function getTimeComplexity(solution: SolutionWithApiAliases): string | null {
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

function getSpaceComplexity(solution: SolutionWithApiAliases): string | null {
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

export function useSolutions() {
  const { state: solutionState, setSolution, setNewSolution, clearAll } = useSolutionContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const [debugProcessing, setDebugProcessing] = useState(false);
  const [solutionData, setSolutionData] = useState<string | null>(null);
  const [answerTextData, setAnswerTextData] = useState<string | null>(null);
  const [diagramData, setDiagramData] = useState<string | null>(null);
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null);
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(null);
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const {
    screenshots,
    handleDeleteScreenshot: deleteScreenshot,
    clearAllScreenshots,
    refetch,
  } = useScreenshots();

  const handleDeleteScreenshot = async (index: number) => {
    const success = await deleteScreenshot(index);
    if (!success) {
      showToast('Error', 'Failed to delete the screenshot', 'error');
    }
  };

  const updateDimensions = () => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const contentWidth = Math.max(contentRef.current.scrollWidth, 720);
      window.electronAPI
        .updateContentDimensions({
          width: contentWidth,
          height: contentHeight,
          source: 'useSolutions',
        })
        .catch(console.error);
    }
  };

  // Update local state when context solution changes
  useEffect(() => {
    if (solutionState.solution) {
      const solution = solutionState.solution as SolutionWithApiAliases;
      setSolutionData(solutionState.solution.code || null);
      setAnswerTextData(solutionState.solution.answerText || null);
      setDiagramData(solutionState.solution.diagramMermaid || null);
      setThoughtsData(
        'thoughts' in solutionState.solution ? solutionState.solution.thoughts || null : null,
      );
      setTimeComplexityData(getTimeComplexity(solution));
      setSpaceComplexityData(getSpaceComplexity(solution));
    }
  }, [solutionState.solution]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    const mutationObserver = new MutationObserver(updateDimensions);
    if (contentRef.current) {
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    updateDimensions();

    const cleanupFunctions = [
      window.electronAPI.onSolutionStart(() => {
        setSolutionData(null);
        setAnswerTextData(null);
        setDiagramData(null);
        setThoughtsData(null);
        setTimeComplexityData(null);
        setSpaceComplexityData(null);
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast('Processing Failed', error, 'error');
        // Restore previous solution data on error
        if (solutionState.solution) {
          const solution = solutionState.solution as SolutionWithApiAliases;
          setSolutionData(solutionState.solution.code || null);
          setAnswerTextData(solutionState.solution.answerText || null);
          setDiagramData(solutionState.solution.diagramMermaid || null);
          setThoughtsData(
            'thoughts' in solutionState.solution ? solutionState.solution.thoughts || null : null,
          );
          setTimeComplexityData(getTimeComplexity(solution));
          setSpaceComplexityData(getSpaceComplexity(solution));
        }
      }),
      window.electronAPI.onSolutionSuccess((data: SolveResponse) => {
        if (!data) {
          return;
        }
        const solution = data as SolutionWithApiAliases;
        setSolution(data);
        setSolutionData(data.code || null);
        setAnswerTextData(data.answerText || null);
        setDiagramData(data.diagramMermaid || null);
        setThoughtsData('thoughts' in data ? data.thoughts || null : null);
        setTimeComplexityData(getTimeComplexity(solution));
        setSpaceComplexityData(getSpaceComplexity(solution));
        void clearAllScreenshots();
      }),
      window.electronAPI.onDebugStart(() => setDebugProcessing(true)),
      window.electronAPI.onDebugSuccess((data: any) => {
        setNewSolution(data);
        setDebugProcessing(false);
        void clearAllScreenshots();
      }),
      window.electronAPI.onDebugError((error: string) => {
        showToast('Processing Failed', error, 'error');
        setDebugProcessing(false);
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast('No Screenshots', 'There are no screenshots to process.', 'neutral');
      }),
    ];

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      cleanupFunctions.forEach((cleanup) => {
        cleanup();
      });
    };
  }, [showToast, setSolution, setNewSolution, solutionState.solution, clearAllScreenshots]);

  useScreenshotEvents({
    refetch,
    onResetView: () => {
      setIsResetting(true);
      clearAll();
      setTimeout(() => setIsResetting(false), 0);
    },
  });

  return {
    debugProcessing,
    solutionData,
    answerTextData,
    diagramData,
    thoughtsData,
    solutionHistory: solutionState.solutionHistory,
    timeComplexityData,
    spaceComplexityData,
    isResetting,
    screenshots,
    contentRef,
    handleDeleteScreenshot,
    setDebugProcessing,
  };
}
