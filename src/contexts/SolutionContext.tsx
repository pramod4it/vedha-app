import type {
  DebugResponse,
  SolveResponse,
} from '@shared/api.ts';
import { LATEST_ANSWER_LIMIT } from '@shared/constants.ts';
import React, { createContext, type ReactNode, useContext, useReducer } from 'react';

interface SolutionState {
  solution: SolutionHistoryItem | null;
  solutionHistory: SolutionHistoryItem[];
  newSolution: DebugResponse | null;
  answerSequence: number;
}

export type SolutionHistoryItem = SolveResponse & {
  displaySequence: number;
};

type SolutionAction =
  | { type: 'SET_SOLUTION'; payload: SolveResponse }
  | { type: 'SET_NEW_SOLUTION'; payload: DebugResponse }
  | { type: 'CLEAR_SOLUTION' }
  | { type: 'CLEAR_NEW_SOLUTION' }
  | { type: 'CLEAR_ALL' };

const initialState: SolutionState = {
  solution: null,
  solutionHistory: [],
  newSolution: null,
  answerSequence: 0,
};

let fallbackConversationCounter =
  0;

function withStableConversationId(solution: SolveResponse): SolveResponse {
  if (solution.conversationId) {
    return solution;
  }

  fallbackConversationCounter += 1;

  return {
    ...solution,
    conversationId: `local-${Date.now()}-${fallbackConversationCounter}`,
  };
}

function trimSolutionHistory(
  history: SolutionHistoryItem[],
): SolutionHistoryItem[] {
  if (LATEST_ANSWER_LIMIT === 0) {
    return history;
  }

  return history.slice(0, LATEST_ANSWER_LIMIT);
}

function solutionReducer(state: SolutionState, action: SolutionAction): SolutionState {
  switch (action.type) {
    case 'SET_SOLUTION': {
      const stableSolution =
        withStableConversationId(action.payload);
      const existingSolution =
        state.solutionHistory.find(
          (solution) =>
            solution.conversationId === stableSolution.conversationId,
        );
      const isNewSolution =
        !existingSolution;
      const nextAnswerSequence =
        isNewSolution
          ? state.answerSequence + 1
          : state.answerSequence;
      const nextSolution: SolutionHistoryItem = {
        ...stableSolution,
        displaySequence:
          existingSolution?.displaySequence || nextAnswerSequence,
      };

      const nextHistory = [
        nextSolution,
        ...state.solutionHistory.filter(
          (solution) =>
            !solution.conversationId ||
            solution.conversationId !== nextSolution.conversationId,
        ),
      ];

      return {
        ...state,
        solution: nextSolution,
        solutionHistory: trimSolutionHistory(nextHistory),
        answerSequence: nextAnswerSequence,
      };
    }
    case 'SET_NEW_SOLUTION':
      return { ...state, newSolution: action.payload };
    case 'CLEAR_SOLUTION':
      return { ...state, solution: null, solutionHistory: [], answerSequence: 0 };
    case 'CLEAR_NEW_SOLUTION':
      return { ...state, newSolution: null };
    case 'CLEAR_ALL':
      return initialState;
    default:
      return state;
  }
}

interface SolutionContextType {
  state: SolutionState;
  setSolution: (solution: SolveResponse) => void;
  setNewSolution: (solution: DebugResponse) => void;
  clearSolution: () => void;
  clearNewSolution: () => void;
  clearAll: () => void;
}

const SolutionContext = createContext<SolutionContextType | undefined>(undefined);

export function SolutionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(solutionReducer, initialState);

  const setSolution = (solution: SolveResponse) => {
    dispatch({ type: 'SET_SOLUTION', payload: solution });
  };

  const setNewSolution = (solution: DebugResponse) => {
    dispatch({ type: 'SET_NEW_SOLUTION', payload: solution });
  };

  const clearSolution = () => {
    dispatch({ type: 'CLEAR_SOLUTION' });
  };

  const clearNewSolution = () => {
    dispatch({ type: 'CLEAR_NEW_SOLUTION' });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  return (
    <SolutionContext.Provider
      value={{
        state,
        setSolution,
        setNewSolution,
        clearSolution,
        clearNewSolution,
        clearAll,
      }}
    >
      {children}
    </SolutionContext.Provider>
  );
}

export function useSolutionContext() {
  const context = useContext(SolutionContext);
  if (!context) {
    throw new Error('useSolutionContext must be used within a SolutionProvider');
  }

  return context;
}
