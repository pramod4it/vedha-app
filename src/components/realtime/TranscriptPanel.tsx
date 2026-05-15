// ============================================================
// FILE: src/components/realtime/TranscriptPanel.tsx
// ============================================================

interface Props {

  transcript: string;

  listening?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export default function TranscriptPanel({

                                          transcript,

                                          listening = false

                                        }: Props) {

  return (

      <div
          className="
                rounded-2xl
                border
                border-white/10
                bg-white/5
                p-4
                flex
                flex-col
                gap-3
            "
      >

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div
            className="
                    flex
                    items-center
                    justify-between
                "
        >

          <div
              className="
                        text-sm
                        text-white/60
                        font-medium
                    "
          >
            Interviewer
          </div>

          <div
              className="
                        flex
                        items-center
                        gap-2
                    "
          >

            <div
                className={`
                            w-2.5
                            h-2.5
                            rounded-full
                            ${
                    listening

                        ? "bg-green-500 animate-pulse"

                        : "bg-gray-500"
                }
                        `}
            />

            <span
                className="
                            text-[11px]
                            uppercase
                            text-white/40
                        "
            >

                        {listening

                            ? "Listening"

                            : "Idle"}

                    </span>

          </div>

        </div>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <div
            className="
                    min-h-[120px]
                    max-h-[240px]
                    overflow-y-auto
                    rounded-xl
                    bg-black/20
                    p-4
                    text-white
                    whitespace-pre-wrap
                    leading-7
                    text-[15px]
                "
        >

          {transcript

              ? transcript

              : (

                  <span
                      className="
                                text-white/30
                            "
                  >
                            Waiting for interviewer speech...
                        </span>
              )}

        </div>

      </div>
  );
}