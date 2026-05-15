import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { InterviewMetadata } from '../../../shared/api';
import { DEFAULT_REALTIME_URL } from '../../realtime/constants';

type TestStatus = 'idle' | 'testing' | 'detected' | 'quiet' | 'error';

const TEST_DURATION_MS = 5000;
const SPEECH_THRESHOLD = 0.015;
const ALARM_LOW_FREQUENCY_HZ = 720;
const ALARM_HIGH_FREQUENCY_HZ = 1280;
const ALARM_TOGGLE_INTERVAL_MS = 180;
const TEST_TONE_VOLUME = 0.75;
const LIVE_RESUME_CONTEXT_LIMIT = 12000;

const dispatchAudioTestState = (eventName: string) => {
  window.dispatchEvent(new CustomEvent(eventName));
};

const appendInterviewMetadataToUrl = (
  realtimeUrl: string,
  metadata: InterviewMetadata | null | undefined,
): string => {
  if (!metadata) {
    return realtimeUrl;
  }

  const url = new URL(realtimeUrl);
  url.searchParams.set('companyName', metadata.companyName);
  url.searchParams.set('interviewerName', metadata.interviewerName);
  url.searchParams.set('interviewRound', metadata.interviewRound);
  url.searchParams.set('answerDepth', metadata.answerDepth || 'medium');

  return url.toString();
};

const limitText = (
  value: string | undefined,
  maxLength: number,
): string | undefined => {
  if (!value || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n\n[Resume context truncated for live audio test.]`;
};

const metadataForLiveSocket = (
  metadata: InterviewMetadata,
): InterviewMetadata => ({
  ...metadata,
  resumeSummary: limitText(
    metadata.resumeSummary,
    LIVE_RESUME_CONTEXT_LIMIT,
  ),
});

const connectBackendAudioTest = async (): Promise<WebSocket> => {
  const metadataResult = await window.electronAPI.getInterviewMetadata();
  const realtimeUrl = appendInterviewMetadataToUrl(
    DEFAULT_REALTIME_URL,
    metadataResult.success ? metadataResult.metadata : null,
  );

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(realtimeUrl);
    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
      if (metadataResult.success && metadataResult.metadata) {
        socket.send(
          JSON.stringify({
            type: 'interviewMetadata',
            value: metadataForLiveSocket(metadataResult.metadata),
          }),
        );
      }

      socket.send(
        JSON.stringify({
          type: 'audioTest',
          value: 'started',
        }),
      );
      resolve(socket);
    };

    socket.onerror = (event) => {
      reject(event);
    };
  });
};

const convertFloat32ToPCM16 = (buffer: Float32Array): ArrayBuffer => {
  const pcm16 = new Int16Array(buffer.length);

  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, buffer[i]));
    pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return pcm16.buffer;
};

export const InterviewerAudioTest: React.FC = () => {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [level, setLevel] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    dispatchAudioTestState('vedha-local-audio-test-ended');
  }, []);

  const runTest = async () => {
    cleanup();
    dispatchAudioTestState('vedha-local-audio-test-started');
    setStatus('testing');
    setLevel(0);

    let socket: WebSocket | null = null;

    try {
      socket = await connectBackendAudioTest();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const silentOutput = audioContext.createGain();
      const alarmTone = audioContext.createOscillator();
      const alarmToneGain = audioContext.createGain();

      analyser.fftSize = 1024;
      silentOutput.gain.value = 0;
      alarmTone.frequency.value = ALARM_LOW_FREQUENCY_HZ;
      alarmTone.type = 'square';
      alarmToneGain.gain.value = TEST_TONE_VOLUME;
      source.connect(analyser);
      source.connect(processor);
      processor.connect(silentOutput);
      silentOutput.connect(audioContext.destination);
      alarmTone.connect(alarmToneGain);
      alarmToneGain.connect(audioContext.destination);
      alarmTone.start();

      const data = new Float32Array(analyser.fftSize);
      let maxLevel = 0;
      let animationFrame = 0;
      let timeout: number | undefined;
      let alarmInterval: number | undefined;
      let useHighFrequency = false;

      alarmInterval = window.setInterval(() => {
        useHighFrequency = !useHighFrequency;
        alarmTone.frequency.setValueAtTime(
          useHighFrequency ? ALARM_HIGH_FREQUENCY_HZ : ALARM_LOW_FREQUENCY_HZ,
          audioContext.currentTime,
        );
      }, ALARM_TOGGLE_INTERVAL_MS);

      processor.onaudioprocess = (event) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = event.inputBuffer.getChannelData(0);
        socket.send(convertFloat32ToPCM16(inputData));
      };

      const stop = () => {
        window.clearTimeout(timeout);
        window.clearInterval(alarmInterval);
        window.cancelAnimationFrame(animationFrame);
        alarmTone.stop();
        alarmTone.disconnect();
        alarmToneGain.disconnect();
        processor.disconnect();
        silentOutput.disconnect();
        source.disconnect();
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        audioContext.close().catch(console.error);
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: 'audioTest',
              value: 'ended',
            }),
          );
          window.setTimeout(() => {
            if (socket?.readyState === WebSocket.OPEN) {
              socket.close(1000, 'audio test ended');
            }
          }, 1500);
        }
      };

      cleanupRef.current = stop;

      const tick = () => {
        analyser.getFloatTimeDomainData(data);

        const sum = data.reduce((total, sample) => total + sample * sample, 0);
        const rms = Math.sqrt(sum / data.length);
        maxLevel = Math.max(maxLevel, rms);
        setLevel(Math.min(100, Math.round(rms * 500)));

        animationFrame = window.requestAnimationFrame(tick);
      };

      tick();

      timeout = window.setTimeout(() => {
        stop();
        cleanupRef.current = null;
        dispatchAudioTestState('vedha-local-audio-test-ended');
        setStatus(maxLevel >= SPEECH_THRESHOLD ? 'detected' : 'quiet');
      }, TEST_DURATION_MS);
    } catch {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'audioTest',
            value: 'ended',
          }),
        );
        socket.close(1011, 'audio test failed');
      }
      cleanup();
      setStatus('error');
    }
  };

  useEffect(() => cleanup, [cleanup]);

  const statusText = {
    idle: 'Check interviewer audio before starting.',
    testing: 'Listening for audio...',
    detected: 'Audio detected.',
    quiet: 'No clear audio detected.',
    error: 'Audio permission or device failed.',
  }[status];

  return (
    <div className="mb-3 px-2 space-y-1">
      <div className="flex items-center justify-between text-[13px] font-medium text-white/90">
        <span>Interviewer audio</span>
        <button
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            runTest().catch(console.error);
          }}
          disabled={status === 'testing'}
          className="rounded-sm border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-gray-100 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'testing' ? 'Testing' : 'Test'}
        </button>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full transition-all ${
            status === 'quiet' || status === 'error' ? 'bg-red-400' : 'bg-cyan-400'
          }`}
          style={{ width: `${level}%` }}
        />
      </div>

      <p className="text-[10px] leading-relaxed text-gray-400">{statusText}</p>
    </div>
  );
};
