import { RealtimeSocket } from './RealtimeSocket';

describe('RealtimeSocket', () => {
  function extractTranscript(payload: string): string {
    const socket = new RealtimeSocket(
      {
        realtimeUrl: 'ws://localhost:9090/ws/interview/manual',
      },
      {},
    );

    return (socket as unknown as { extractTranscript: (value: string) => string })
      .extractTranscript(payload);
  }

  test('extracts backend transcript update text', () => {
    expect(
      extractTranscript(
        JSON.stringify({
          type: 'transcriptUpdate',
          text: 'Explain virtual destructors in C++',
        }),
      ),
    ).toBe('Explain virtual destructors in C++');
  });

  test('extracts external audio transcript values', () => {
    expect(
      extractTranscript(
        JSON.stringify({
          type: 'cppInterviewerAudioTranscript',
          value: {
            transcript: 'Implement LRU cache in C++',
          },
        }),
      ),
    ).toBe('Implement LRU cache in C++');
  });

  test('ignores answer payloads', () => {
    expect(
      extractTranscript(
        JSON.stringify({
          problemStatement: 'Manual question',
          answerText: 'Use a map and doubly linked list.',
        }),
      ),
    ).toBe('');
  });
});
