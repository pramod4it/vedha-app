import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import type {
    DebugResponse,
    SolveResponse,
} from '../../shared/api';

import {
    SolutionProvider,
    useSolutionContext,
} from './SolutionContext';

interface WrapperProps {
    children: ReactNode;
}

const Wrapper = ({
                     children,
                 }: WrapperProps) => (
    <SolutionProvider>
        {children}
    </SolutionProvider>
);

const solveResponse: SolveResponse = {
    thoughts: ['t'],
    code: 'print(1)',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    problemStatement: 'p',
    conversationId: 'c',
};

const debugResponse: DebugResponse = {
    code: 'fixed',
    thoughts: ['t'],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    conversationId: 'c',
};

describe('SolutionContext', () => {

    const setup = () =>
        renderHook(
            () => useSolutionContext(),
            {
                wrapper: Wrapper,
            },
        );

    describe('setSolution', () => {

        test(
            'should set solution state',
            () => {

                const { result } =
                    setup();

                act(() => {
                    result.current.setSolution(
                        solveResponse,
                    );
                });

                expect(
                    result.current.state.solution,
                ).toMatchObject(
                    {
                        ...solveResponse,
                        displaySequence: 1,
                    },
                );

            },
        );

        test(
            'should keep all current chat solutions with newest first',
            () => {

                const { result } =
                    setup();

                const makeSolution = (
                    conversationId: string,
                ): SolveResponse => ({
                    ...solveResponse,
                    conversationId,
                    problemStatement: `Q-${conversationId}`,
                    answerText: `A-${conversationId}`,
                });

                act(() => {
                    result.current.setSolution(
                        makeSolution('first'),
                    );
                    result.current.setSolution(
                        makeSolution('second'),
                    );
                    result.current.setSolution(
                        makeSolution('third'),
                    );
                    result.current.setSolution(
                        makeSolution('fourth'),
                    );
                    result.current.setSolution(
                        makeSolution('fifth'),
                    );
                    result.current.setSolution(
                        makeSolution('sixth'),
                    );
                });

                expect(
                    result.current.state.solutionHistory.map(
                        (solution) => [
                            solution.problemStatement,
                            solution.answerText,
                            solution.displaySequence,
                        ],
                    ),
                ).toEqual([
                    ['Q-sixth', 'A-sixth', 6],
                    ['Q-fifth', 'A-fifth', 5],
                    ['Q-fourth', 'A-fourth', 4],
                    ['Q-third', 'A-third', 3],
                    ['Q-second', 'A-second', 2],
                    ['Q-first', 'A-first', 1],
                ]);

            },
        );

        test(
            'should keep every live solution when backend omits conversation ids',
            () => {

                const { result } =
                    setup();

                const makeSolution = (
                    question: string,
                    answer: string,
                ): SolveResponse => ({
                    ...solveResponse,
                    conversationId: '',
                    problemStatement: question,
                    answerText: answer,
                });

                act(() => {
                    result.current.setSolution(
                        makeSolution('Q1', 'A1'),
                    );
                    result.current.setSolution(
                        makeSolution('Q2', 'A2'),
                    );
                    result.current.setSolution(
                        makeSolution('Q3', 'A3'),
                    );
                    result.current.setSolution(
                        makeSolution('Q4', 'A4'),
                    );
                    result.current.setSolution(
                        makeSolution('Q5', 'A5'),
                    );
                    result.current.setSolution(
                        makeSolution('Q6', 'A6'),
                    );
                });

                expect(
                    result.current.state.solutionHistory.map(
                        (solution) => [
                            solution.problemStatement,
                            solution.answerText,
                            solution.displaySequence,
                        ],
                    ),
                ).toEqual([
                    ['Q6', 'A6', 6],
                    ['Q5', 'A5', 5],
                    ['Q4', 'A4', 4],
                    ['Q3', 'A3', 3],
                    ['Q2', 'A2', 2],
                    ['Q1', 'A1', 1],
                ]);

                expect(
                    result.current.state.solutionHistory.every(
                        (solution) => Boolean(solution.conversationId),
                    ),
                ).toBe(true);

            },
        );

    });

    describe('setNewSolution', () => {

        test(
            'should set newSolution state',
            () => {

                const { result } =
                    setup();

                act(() => {
                    result.current.setNewSolution(
                        debugResponse,
                    );
                });

                expect(
                    result.current.state.newSolution,
                ).toEqual(
                    debugResponse,
                );

            },
        );

    });

    describe('clearSolution', () => {

        test(
            'should clear solution state',
            () => {

                const { result } =
                    setup();

                act(() => {
                    result.current.setSolution(
                        solveResponse,
                    );
                });

                act(() => {
                    result.current.clearSolution();
                });

                expect(
                    result.current.state.solution,
                ).toBeNull();
                expect(
                    result.current.state.solutionHistory,
                ).toEqual([]);

            },
        );

    });

    describe('clearNewSolution', () => {

        test(
            'should clear newSolution state',
            () => {

                const { result } =
                    setup();

                act(() => {
                    result.current.setNewSolution(
                        debugResponse,
                    );
                });

                act(() => {
                    result.current.clearNewSolution();
                });

                expect(
                    result.current.state.newSolution,
                ).toBeNull();

            },
        );

    });

    describe('clearAll', () => {

        test(
            'should clear both solution and newSolution',
            () => {

                const { result } =
                    setup();

                act(() => {

                    result.current.setSolution(
                        solveResponse,
                    );

                    result.current.setNewSolution(
                        debugResponse,
                    );

                });

                act(() => {
                    result.current.clearAll();
                });

                expect(
                    result.current.state,
                ).toEqual({
                    solution: null,
                    solutionHistory: [],
                    newSolution: null,
                    answerSequence: 0,
                });

            },
        );

    });

});
