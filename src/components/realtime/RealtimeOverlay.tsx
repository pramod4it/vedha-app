// ============================================================
// FILE: src/components/realtime/RealtimeOverlay.tsx
// ============================================================

import { useEffect, useRef, useState } from "react";

import {
  startRealtimeAssistant,
  stopRealtimeAssistant
} from "../../realtime/realtimeInterviewAssistant";

import {
  ASSISTANT_STATUS
} from "../../realtime/constants";
import type {
  AssistantStatus
} from "../../realtime/types";

// ============================================================
// COMPONENT
// ============================================================

export default function RealtimeOverlay() {

  const mountedRef =
      useRef(true);

  const [running, setRunning] =
      useState(false);

  const [loading, setLoading] =
      useState(false);

  const [minimized, setMinimized] =
      useState(false);

  const [status, setStatus] =
      useState<AssistantStatus>(
          ASSISTANT_STATUS.IDLE
      );

  const [transcript, setTranscript] =
      useState("");

  const [response, setResponse] =
      useState("");

  const [error, setError] =
      useState("");

  // ========================================================
  // START
  // ========================================================

  const handleStart = async () => {

    try {

      setLoading(true);

      setError("");

      setTranscript("");

      setResponse("");

      await startRealtimeAssistant({

        onTranscript: (
            text: string
        ) => {

          if (
              !mountedRef.current
          ) {
            return;
          }

          setTranscript(text);
        },

        onResponse: (
            text: string
        ) => {

          if (
              !mountedRef.current
          ) {
            return;
          }

          setResponse(text);
        },

        onStatusChange: (
            nextStatus
        ) => {

          if (
              !mountedRef.current
          ) {
            return;
          }

          setStatus(nextStatus);
        },

        onError: (
            err: any
        ) => {

          console.error(err);

          setError(

              err?.message ||

              "Realtime assistant failed"
          );
        }
      });

      setRunning(true);

    } catch (e: any) {

      console.error(e);

      setError(

          e?.message ||

          "Failed to start assistant"
      );

    } finally {

      setLoading(false);
    }
  };

  // ========================================================
  // STOP
  // ========================================================

  const handleStop = () => {

    stopRealtimeAssistant();

    setRunning(false);

    setStatus(
        ASSISTANT_STATUS.DISCONNECTED
    );
  };

  // ========================================================
  // CLEANUP
  // ========================================================

  useEffect(() => {

    mountedRef.current = true;

    return () => {

      mountedRef.current = false;

      stopRealtimeAssistant();
    };

  }, []);

  // ========================================================
  // STATUS COLOR
  // ========================================================

  const getStatusColor = () => {

    switch (status) {

      case ASSISTANT_STATUS.CONNECTING:
        return "bg-yellow-500";

      case ASSISTANT_STATUS.CONNECTED:
        return "bg-blue-500";

      case ASSISTANT_STATUS.LISTENING:
        return "bg-green-500";

      case ASSISTANT_STATUS.RESPONDING:
        return "bg-cyan-500";

      case ASSISTANT_STATUS.ERROR:
        return "bg-red-500";

      default:
        return "bg-gray-500";
    }
  };

  // ========================================================
  // UI
  // ========================================================

  return (

      <div
          className={`
                fixed
                top-4
                right-4
                z-[999999]
                rounded-2xl
                border
                border-white/10
                bg-black/90
                backdrop-blur-xl
                shadow-2xl
                overflow-hidden
                transition-all
                duration-300
                ${
              minimized

                  ? "w-[320px] h-[72px]"

                  : "w-[440px] h-[85vh]"
          }
            `}
      >

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div
            className="
                    h-[72px]
                    px-5
                    border-b
                    border-white/10
                    flex
                    items-center
                    justify-between
                "
        >

          <div>

            <h1
                className="
                            text-white
                            text-lg
                            font-bold
                        "
            >
              AI Interview Assistant
            </h1>

            <div
                className="
                            flex
                            items-center
                            gap-2
                            mt-1
                        "
            >

              <div
                  className={`
                                w-2.5
                                h-2.5
                                rounded-full
                                ${getStatusColor()}
                            `}
              />

              <span
                  className="
                                text-xs
                                text-white/60
                                uppercase
                            "
              >
                            {status}
                        </span>

            </div>

          </div>

          <div
              className="
                        flex
                        items-center
                        gap-2
                    "
          >

            <button
                onClick={() =>
                    setMinimized(
                        prev => !prev
                    )
                }
                className="
                            w-8
                            h-8
                            rounded-lg
                            bg-white/10
                            hover:bg-white/20
                            text-white
                            text-sm
                        "
            >

              {minimized ? "□" : "—"}

            </button>

          </div>

        </div>

        {/* ================================================= */}
        {/* MINIMIZED */}
        {/* ================================================= */}

        {minimized && (

            <div
                className="
                        h-[calc(72px-72px)]
                    "
            />
        )}

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        {!minimized && (

            <div
                className="
                        h-[calc(85vh-72px)]
                        flex
                        flex-col
                    "
            >

              {/* ========================================= */}
              {/* CONTROLS */}
              {/* ========================================= */}

              <div
                  className="
                            p-4
                            border-b
                            border-white/10
                            flex
                            gap-3
                        "
              >

                {!running ? (

                    <button
                        onClick={
                          handleStart
                        }
                        disabled={
                          loading
                        }
                        className="
                                    flex-1
                                    py-3
                                    rounded-xl
                                    bg-green-600
                                    hover:bg-green-700
                                    disabled:opacity-50
                                    text-white
                                    font-medium
                                "
                    >

                      {loading

                          ? "Starting..."

                          : "Start Assistant"}

                    </button>

                ) : (

                    <button
                        onClick={
                          handleStop
                        }
                        className="
                                    flex-1
                                    py-3
                                    rounded-xl
                                    bg-red-600
                                    hover:bg-red-700
                                    text-white
                                    font-medium
                                "
                    >
                      Stop Assistant
                    </button>
                )}

              </div>

              {/* ========================================= */}
              {/* ERROR */}
              {/* ========================================= */}

              {error && (

                  <div
                      className="
                                mx-4
                                mt-4
                                p-3
                                rounded-xl
                                bg-red-500/10
                                border
                                border-red-500/20
                                text-red-300
                                text-sm
                            "
                  >
                    {error}
                  </div>
              )}

              {/* ========================================= */}
              {/* SCROLL AREA */}
              {/* ========================================= */}

              <div
                  className="
                            flex-1
                            overflow-y-auto
                            p-4
                            space-y-4
                        "
              >

                {/* ===================================== */}
                {/* INTERVIEWER */}
                {/* ===================================== */}

                <div
                    className="
                                rounded-2xl
                                border
                                border-white/10
                                bg-white/5
                                p-4
                            "
                >

                  <div
                      className="
                                    text-sm
                                    text-white/50
                                    mb-2
                                "
                  >
                    Interviewer
                  </div>

                  <div
                      className="
                                    text-white
                                    whitespace-pre-wrap
                                    leading-7
                                    min-h-[80px]
                                "
                  >

                    {transcript ||

                        "Waiting for speech..."}

                  </div>

                </div>

                {/* ===================================== */}
                {/* AI RESPONSE */}
                {/* ===================================== */}

                <div
                    className="
                                rounded-2xl
                                border
                                border-green-500/20
                                bg-green-500/5
                                p-4
                            "
                >

                  <div
                      className="
                                    text-sm
                                    text-green-400
                                    mb-2
                                "
                  >
                    AI Assistant
                  </div>

                  <div
                      className="
                                    text-white
                                    whitespace-pre-wrap
                                    leading-7
                                    min-h-[200px]
                                "
                  >

                    {response ||

                        "Waiting for AI response..."}

                  </div>

                </div>

              </div>

            </div>
        )}

      </div>
  );
}
