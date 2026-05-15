// ============================================================
// FILE: src/realtime/transcriptStore.ts
// ============================================================

export interface TranscriptMessage {

    id: string;

    role:
        | "interviewer"
        | "assistant"
        | "system";

    text: string;

    timestamp: number;
}

export interface ConversationContext {

    messages:
        TranscriptMessage[];

    lastTranscript: string;

    lastResponse: string;
}

// ============================================================
// TRANSCRIPT STORE
// ============================================================

export class TranscriptStore {

    private messages:
        TranscriptMessage[] = [];

    private maxMessages =
        100;

    // ========================================================
    // ADD INTERVIEWER MESSAGE
    // ========================================================

    addTranscript(
        transcript: string
    ) {

        if (
            !transcript ||
            !transcript.trim()
        ) {
            return;
        }

        const message:
            TranscriptMessage = {

            id:
                this.generateId(),

            role:
                "interviewer",

            text:
                transcript.trim(),

            timestamp:
                Date.now()
        };

        this.messages.push(
            message
        );

        this.trimMessages();

        console.log(
            "🎤 Transcript added:",
            transcript
        );
    }

    // ========================================================
    // ADD AI RESPONSE
    // ========================================================

    addAssistantResponse(
        response: string
    ) {

        if (
            !response ||
            !response.trim()
        ) {
            return;
        }

        const message:
            TranscriptMessage = {

            id:
                this.generateId(),

            role:
                "assistant",

            text:
                response.trim(),

            timestamp:
                Date.now()
        };

        this.messages.push(
            message
        );

        this.trimMessages();

        console.log(
            "🤖 Assistant response added"
        );
    }

    // ========================================================
    // ADD SYSTEM MESSAGE
    // ========================================================

    addSystemMessage(
        text: string
    ) {

        if (
            !text ||
            !text.trim()
        ) {
            return;
        }

        const message:
            TranscriptMessage = {

            id:
                this.generateId(),

            role:
                "system",

            text:
                text.trim(),

            timestamp:
                Date.now()
        };

        this.messages.push(
            message
        );

        this.trimMessages();
    }

    // ========================================================
    // GET ALL MESSAGES
    // ========================================================

    getMessages():
        TranscriptMessage[] {

        return [
            ...this.messages
        ];
    }

    // ========================================================
    // GET LAST MESSAGE
    // ========================================================

    getLastMessage():
        TranscriptMessage | null {

        if (
            this.messages.length === 0
        ) {
            return null;
        }

        return this.messages[
        this.messages.length - 1
            ];
    }

    // ========================================================
    // GET LAST TRANSCRIPT
    // ========================================================

    getLastTranscript():
        string {

        const transcript =
            [...this.messages]

                .reverse()

                .find(

                    message =>
                        message.role ===
                        "interviewer"
                );

        return transcript?.text || "";
    }

    // ========================================================
    // GET LAST RESPONSE
    // ========================================================

    getLastResponse():
        string {

        const response =
            [...this.messages]

                .reverse()

                .find(

                    message =>
                        message.role ===
                        "assistant"
                );

        return response?.text || "";
    }

    // ========================================================
    // GET CONTEXT
    // ========================================================

    getConversationContext():
        ConversationContext {

        return {

            messages:
                this.getMessages(),

            lastTranscript:
                this.getLastTranscript(),

            lastResponse:
                this.getLastResponse()
        };
    }

    // ========================================================
    // GET RECENT CONTEXT
    // ========================================================

    getRecentMessages(
        limit = 10
    ): TranscriptMessage[] {

        return this.messages.slice(
            -limit
        );
    }

    // ========================================================
    // BUILD PROMPT CONTEXT
    // ========================================================

    buildPromptContext(
        limit = 10
    ): string {

        const recent =
            this.getRecentMessages(
                limit
            );

        return recent

            .map(message => {

                return `
${message.role.toUpperCase()}:
${message.text}
                `;
            })

            .join("\n");
    }

    // ========================================================
    // CLEAR
    // ========================================================

    clear() {

        this.messages = [];

        console.log(
            "🧹 Transcript store cleared"
        );
    }

    // ========================================================
    // REMOVE OLD MESSAGES
    // ========================================================

    private trimMessages() {

        if (
            this.messages.length <=
            this.maxMessages
        ) {
            return;
        }

        this.messages =
            this.messages.slice(
                this.messages.length
                - this.maxMessages
            );
    }

    // ========================================================
    // GENERATE ID
    // ========================================================

    private generateId():
        string {

        return (

            Date.now().toString(36)

            +

            Math.random()
                .toString(36)
                .substring(2, 8)
        );
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const transcriptStore =
    new TranscriptStore();