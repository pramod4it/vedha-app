// ============================================================
// FILE: src/components/realtime/AIResponsePanel.tsx
// ============================================================

interface Props {

    response: string;

    responding?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export default function AIResponsePanel({

                                            response,

                                            responding = false

                                        }: Props) {

    return (

        <div
            className="
                rounded-2xl
                border
                border-green-500/20
                bg-green-500/5
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
                        text-green-400
                        font-medium
                    "
                >
                    AI Assistant
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
                            responding

                                ? "bg-cyan-400 animate-pulse"

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

                        {responding

                            ? "Responding"

                            : "Waiting"}

                    </span>

                </div>

            </div>

            {/* ================================================= */}
            {/* CONTENT */}
            {/* ================================================= */}

            <div
                className="
                    min-h-[220px]
                    max-h-[420px]
                    overflow-y-auto
                    rounded-xl
                    bg-black/20
                    p-4
                    whitespace-pre-wrap
                    leading-7
                    text-[15px]
                    text-white
                "
            >

                {response

                    ? response

                    : (

                        <span
                            className="
                                text-white/30
                            "
                        >
                            Waiting for AI response...
                        </span>
                    )}

            </div>

        </div>
    );
}