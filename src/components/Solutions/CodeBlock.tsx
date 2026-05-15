import { ProgrammingLanguage } from '@shared/api.ts';
import { Check, Copy } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
    code: string;
    language: ProgrammingLanguage;
    showCopyButton?: boolean;
}

function normalizeCode(code: string): string {
    let normalized = code.trim();

    if (
        normalized.length >= 2 &&
        normalized.startsWith('"') &&
        normalized.endsWith('"')
    ) {
        try {
            normalized = JSON.parse(normalized);
        } catch {
            // Keep the original text if it is not a JSON-encoded string.
        }
    }

    for (let index = 0; index < 4; index += 1) {
        normalized = normalized
            .replace(/\\\\r\\\\n/g, '\n')
            .replace(/\\\\n/g, '\n')
            .replace(/\\\\r/g, '\n')
            .replace(/\\r\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\n')
            .replace(/\\u000d\\u000a/gi, '\n')
            .replace(/\\u000a/gi, '\n')
            .replace(/\\u000d/gi, '\n')
            .replace(/&#10;|&#x0a;|&#xA;/gi, '\n')
            .replace(/&#13;|&#x0d;|&#xD;/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/\\t/g, '  ');
    }

    const fencedCodeMatch =
        normalized.match(/^```[\w-]*\n([\s\S]*?)\n```$/);

    if (fencedCodeMatch) {
        return fencedCodeMatch[1];
    }

    return normalized;
}

function formatSingleLineBracedCode(code: string): string {
    if (
        code.includes('\n') ||
        code.length < 120
    ) {
        return code;
    }

    const lines: string[] = [];
    let current = '';
    let indent = 0;
    let inString: '"' | "'" | '`' | null = null;
    let escaped = false;

    const pushLine = () => {
        const trimmed = current.trim();

        if (trimmed) {
            lines.push(`${'  '.repeat(Math.max(indent, 0))}${trimmed}`);
        }

        current = '';
    };

    for (const char of code) {
        current += char;

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === inString) {
                inString = null;
            }

            continue;
        }

        if (
            char === '"' ||
            char === "'" ||
            char === '`'
        ) {
            inString = char;
            continue;
        }

        if (char === '{') {
            pushLine();
            indent += 1;
            continue;
        }

        if (char === ';') {
            pushLine();
            continue;
        }

        if (char === '}') {
            current = current.slice(0, -1).trim();
            pushLine();
            indent = Math.max(indent - 1, 0);
            current = '}';
            pushLine();
        }
    }

    pushLine();

    return lines.join('\n');
}

const CodeBlock: React.FC<CodeBlockProps> = ({
                                                 code,
                                                 language,
                                                 showCopyButton = false,
                                             }) => {

    const displayCode =
        formatSingleLineBracedCode(
            normalizeCode(code),
        );

    const [copied, setCopied] =
        useState(false);

    const handleCopy = async () => {

        try {

            const result =
                await window.electronAPI.copyAndRefreshWindow(
                    displayCode,
                    250,
                );

            if (result.success) {

                setCopied(true);

                setTimeout(() => {
                    setCopied(false);
                }, 2000);

            } else {

                console.error(
                    'Failed to copy code:',
                    result.error,
                );
            }

        } catch (error) {

            console.error(
                'Copy failed:',
                error,
            );
        }
    };

    return (
        <div className="relative w-full rounded-3xl border border-zinc-700/70 bg-[#0d1117]/70 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">

            <div className="w-full overflow-x-auto overflow-y-hidden rounded-3xl">

                <SyntaxHighlighter
                    showLineNumbers
                    language={
                        language === ProgrammingLanguage.Go
                            ? 'go'
                            : language
                    }
                    style={a11yDark}
                    wrapLines={false}
                    wrapLongLines={false}
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        paddingRight: showCopyButton
                            ? '3.5rem'
                            : '1rem',
                        background: 'rgba(13, 17, 23, 0.7)',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        fontFamily:
                            'JetBrains Mono, monospace',
                        fontSize: '11px',
                        lineHeight: '1.45',
                        whiteSpace: 'pre',
                    }}
                    codeTagProps={{
                        style: {
                            whiteSpace: 'pre',
                        },
                    }}
                >
                    {displayCode}
                </SyntaxHighlighter>

            </div>

            {showCopyButton && (
                <button
                    onClick={() => {
                        handleCopy().catch(
                            console.error,
                        );
                    }}
                    className="absolute right-4 top-4 rounded-xl border border-zinc-700 bg-zinc-900/90 p-2.5 transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-800"
                    title="Copy code"
                >

                    {copied ? (
                        <Check
                            size={18}
                            className="text-green-400"
                        />
                    ) : (
                        <Copy
                            size={18}
                            className="text-zinc-400"
                        />
                    )}

                </button>
            )}

        </div>
    );
};

export default CodeBlock;
