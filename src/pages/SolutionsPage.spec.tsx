import { render, screen } from '@testing-library/react';
import type { SolveResponse } from '@shared/api.ts';

jest.mock('@shared/constants.ts', () => ({
  LATEST_ANSWER_LIMIT: 5,
}));

import SolutionsPage from './SolutionsPage';

const mockUseSolutions = jest.fn();

jest.mock('../hooks', () => ({
  useSolutions: () => mockUseSolutions(),
}));

jest.mock('../contexts/SolutionContext', () => ({
  useSolutionContext: () => ({
    state: {
      solution: null,
      solutionHistory: [],
      newSolution: null,
    },
  }),
}));

jest.mock('../components/sections', () => ({
  CommandSection: () => <div data-testid="command-section" />,
  ScreenshotSection: () => <div data-testid="screenshot-section" />,
  SolutionSection: ({
    answerTextData,
    solutionData,
    diagramData,
    thoughtsData,
  }: {
    answerTextData?: string | null;
    solutionData?: string | null;
    diagramData?: string | null;
    thoughtsData?: string[] | null;
  }) => (
    <div>
      {answerTextData && <div>{answerTextData}</div>}
      {solutionData && <div>{solutionData}</div>}
      {diagramData && <div>{diagramData}</div>}
      {thoughtsData?.map((thought) => (
        <div key={thought}>{thought}</div>
      ))}
    </div>
  ),
}));

function solution(
  question: string,
  answer: string,
  conversationId: string,
): SolveResponse {
  return {
    thoughts: [],
    code: '',
    answerText: answer,
    diagramMermaid: '',
    messageType: 'NEW_QUESTION',
    answerDepth: 'medium',
    timeComplexity: 'N/A',
    spaceComplexity: 'N/A',
    problemStatement: question,
    conversationId,
  };
}

describe('SolutionsPage', () => {
  beforeEach(() => {
    window.electronAPI.updateContentDimensions =
      jest.fn().mockResolvedValue(undefined);
  });

  test('shows latest five question-answer pairs with newest first', () => {
    mockUseSolutions.mockReturnValue({
      debugProcessing: false,
      solutionData: null,
      answerTextData: null,
      diagramData: null,
      thoughtsData: null,
      solutionHistory: [
        solution('Q5', 'A5', 'c5'),
        solution('Q4', 'A4', 'c4'),
        solution('Q3', 'A3', 'c3'),
        solution('Q2', 'A2', 'c2'),
        solution('Q1', 'A1', 'c1'),
      ],
      isResetting: false,
      screenshots: [],
      contentRef: { current: null },
      handleDeleteScreenshot: jest.fn(),
      setDebugProcessing: jest.fn(),
    });

    const { container } = render(
      <SolutionsPage setView={jest.fn()} />,
    );

    expect(screen.getByText('5. Q5')).toBeInTheDocument();
    expect(screen.getByText('A5')).toBeInTheDocument();
    expect(screen.getByText('4. Q4')).toBeInTheDocument();
    expect(screen.getByText('A4')).toBeInTheDocument();
    expect(screen.getByText('3. Q3')).toBeInTheDocument();
    expect(screen.getByText('A3')).toBeInTheDocument();
    expect(screen.getByText('2. Q2')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('1. Q1')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();

    const text =
      container.textContent || '';

    expect(text.indexOf('5. Q5')).toBeLessThan(text.indexOf('4. Q4'));
    expect(text.indexOf('4. Q4')).toBeLessThan(text.indexOf('3. Q3'));
    expect(text.indexOf('3. Q3')).toBeLessThan(text.indexOf('2. Q2'));
    expect(text.indexOf('2. Q2')).toBeLessThan(text.indexOf('1. Q1'));
    expect(screen.getAllByText('Answer:')).toHaveLength(5);
  });
});
