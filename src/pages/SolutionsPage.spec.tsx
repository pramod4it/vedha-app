import { fireEvent, render, screen } from '@testing-library/react';
import type { SolveResponse } from '@shared/api.ts';

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
    clearSolution: jest.fn(),
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

jest.mock('../components/shared/AnswerDepthSelector', () => ({
  AnswerDepthSelector: () => <div data-testid="answer-depth-selector" />,
}));

jest.mock('../components/shared/LanguageSelector', () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
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
    jest.clearAllMocks();
    window.electronAPI.updateContentDimensions =
      jest.fn().mockResolvedValue(undefined);
    window.electronAPI.getInterviewMetadata =
      jest.fn().mockResolvedValue({
        success: true,
        metadata: null,
      });
  });

  test('shows current chat question-answer pairs with newest first', () => {
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
    expect(screen.queryByText('Answer:')).not.toBeInTheDocument();
    expect(screen.getByTestId('language-selector')).toBeInTheDocument();
    expect(screen.getByTestId('answer-depth-selector')).toBeInTheDocument();
    expect(screen.getByText('Current chat questions and answers')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear chat/i })).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /clear/i })
        .some((button) => !button.hasAttribute('disabled')),
    ).toBe(true);
  });

  test('leaves manual question empty when interview metadata exists', () => {
    window.electronAPI.getInterviewMetadata =
      jest.fn().mockResolvedValue({
        success: true,
        metadata: {
          companyName: 'Acme',
          interviewerName: 'Priya',
          answerDepth: 'medium',
          resumeSummary: 'Built distributed APIs.',
        },
      });

    mockUseSolutions.mockReturnValue({
      debugProcessing: false,
      solutionData: null,
      answerTextData: null,
      diagramData: null,
      thoughtsData: null,
      solutionHistory: [],
      isResetting: false,
      screenshots: [],
      contentRef: { current: null },
      handleDeleteScreenshot: jest.fn(),
      setDebugProcessing: jest.fn(),
    });

    render(
      <SolutionsPage setView={jest.fn()} />,
    );

    const textarea =
      screen.getByLabelText('Manual question');

    expect(textarea).toHaveValue('');
    expect(window.electronAPI.getInterviewMetadata).not.toHaveBeenCalled();
  });

  test('clears manual question with Ctrl Backspace shortcut', () => {
    mockUseSolutions.mockReturnValue({
      debugProcessing: false,
      solutionData: null,
      answerTextData: null,
      diagramData: null,
      thoughtsData: null,
      solutionHistory: [],
      isResetting: false,
      screenshots: [],
      contentRef: { current: null },
      handleDeleteScreenshot: jest.fn(),
      setDebugProcessing: jest.fn(),
    });

    render(
      <SolutionsPage setView={jest.fn()} />,
    );

    const textarea =
      screen.getByLabelText('Manual question');

    fireEvent.change(textarea, {
      target: {
        value: 'What is Java?',
      },
    });
    expect(textarea).toHaveValue('What is Java?');

    fireEvent.keyDown(textarea, {
      key: 'Backspace',
      ctrlKey: true,
    });

    expect(textarea).toHaveValue('');
  });

  test('submits manual question with Ctrl M shortcut', () => {
    const onManualQuestionSubmit =
      jest.fn().mockReturnValue(true);

    mockUseSolutions.mockReturnValue({
      debugProcessing: false,
      solutionData: null,
      answerTextData: null,
      diagramData: null,
      thoughtsData: null,
      solutionHistory: [],
      isResetting: false,
      screenshots: [],
      contentRef: { current: null },
      handleDeleteScreenshot: jest.fn(),
      setDebugProcessing: jest.fn(),
    });

    render(
      <SolutionsPage
        setView={jest.fn()}
        onManualQuestionSubmit={onManualQuestionSubmit}
      />,
    );

    const textarea =
      screen.getByLabelText('Manual question');

    fireEvent.change(textarea, {
      target: {
        value: 'What is Java?',
      },
    });

    fireEvent.keyDown(textarea, {
      key: 'm',
      code: 'KeyM',
      ctrlKey: true,
    });

    expect(onManualQuestionSubmit).toHaveBeenCalledWith('What is Java?');
    expect(textarea).toHaveValue('');
  });
});
