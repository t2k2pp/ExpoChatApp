/**
 * Message Parser Utility
 * Parses AI response to extract thinking/analysis sections and final response
 */

export interface ParsedMessage {
    thinkingSteps: string[];
    response: string;
}

/**
 * Parse AI response to extract analysis/thinking sections and final response
 * Supports the format: <|channel|>analysis...<|channel|>final...
 */
export function parseMessageContent(content: string): ParsedMessage {
    const thinkingSteps: string[] = [];

    // Extract all <|channel|>analysis sections
    const analysisPattern = /<\|channel\|>analysis<\|message\|>([\s\S]*?)(?=<\|end\|>|<\|channel\|>|$)/gi;
    let match;

    while ((match = analysisPattern.exec(content)) !== null) {
        const step = match[1].trim();
        if (step.length > 0) {
            thinkingSteps.push(step);
        }
    }

    // Extract <|channel|>final content
    const finalPattern = /<\|channel\|>final<\|message\|>([\s\S]*?)$/i;
    const finalMatch = content.match(finalPattern);

    if (finalMatch && finalMatch[1]) {
        return {
            thinkingSteps,
            response: finalMatch[1].trim()
        };
    }

    // Fallback: if no final tag, use the whole content
    return {
        thinkingSteps,
        response: content
    };
}

/**
 * Clean control tokens from text
 */
export function cleanControlTokens(text: string): string {
    let cleaned = text;

    // Remove angle bracket tokens
    cleaned = cleaned.replace(/<\|[^|]+\|>/g, '');

    // Remove XML-like tags
    cleaned = cleaned.replace(/<\/?(?:channel|message|start|end|final|analysis|assistant)>/gi, '');

    // Remove markdown metadata
    cleaned = cleaned.replace(/\*\*意味\*\*/g, '');

    // Trim
    cleaned = cleaned.trim();

    return cleaned;
}
