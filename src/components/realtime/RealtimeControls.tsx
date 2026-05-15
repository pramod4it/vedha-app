// ============================================================
// FILE: src/components/realtime/RealtimeControls.tsx
// ============================================================

import {
  ASSISTANT_STATUS
} from "../../realtime/constants";

interface Props {

  running: boolean;

  loading: boolean;

  status: string;

  onStart: () => void;

  onStop: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function RealtimeControls({

                                           running,

                                           loading,

                                           status,

                                           onStart,

                                           onStop

                                         }: Props) {

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
          className="
                w-full
                rounded-2xl
                border
                border-white/10
                bg-black/80
                backdrop-blur-xl
                p-4
                flex
                items-center
                justify-between
                gap-4
            "
      >

        {/* ================================================= */}
        {/* STATUS */}
        {/* ================================================= */}

        <div
            className="
                    flex
                    items-center
                    gap-3
                "
        >

          <div
              className={`
                        w-3
                        h-3
                        rounded-full
                        animate-pulse
                        ${getStatusColor()}
                    `}
          />

          <div>

            <div
                className="
                            text-white
                            text-sm
                            font-medium
                        "
            >
              Realtime Assistant
            </div>

            <div
                className="
                            text-white/50
                            text-xs
                            uppercase
                            mt-0.5
                        "
            >
              {status}
            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* ACTIONS */}
        {/* ================================================= */}

        <div
            className="
                    flex
                    items-center
                    gap-3
                "
        >

          {!running ? (

              <button
                  onClick={onStart}
                  disabled={loading}
                  className="
                            px-5
                            py-2.5
                            rounded-xl
                            bg-green-600
                            hover:bg-green-700
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                            text-white
                            font-medium
                            transition-all
                        "
              >

                {loading

                    ? "Starting..."

                    : "Start"}

              </button>

          ) : (

              <button
                  onClick={onStop}
                  className="
                            px-5
                            py-2.5
                            rounded-xl
                            bg-red-600
                            hover:bg-red-700
                            text-white
                            font-medium
                            transition-all
                        "
              >
                Stop
              </button>
          )}

        </div>

      </div>
  );
}