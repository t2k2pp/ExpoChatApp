/**
 * Message Parser Utility
 * Parses AI response to extract thinking/analysis sections and final response
 */

export interface ParsedMessage {
    analysis?: string;
    response: string;
}

/**
 * Parse AI response to extract analysis/thinking section and final response
 */
export function parseMessageContent(content: string): ParsedMessage {
    const result: ParsedMessage = {
        response: content,
    };

    // Pattern 1: <|analysis|>...<|message|> or similar tags
    const tagPattern = /<\|analysis\|>([\s\S]*?)<\|(?:message|final|end)\|>/i;
    const tagMatch = content.match(tagPattern);

    if (tagMatch) {
        result.analysis = tagMatch[1].trim();
        result.response = content.replace(tagPattern, '').trim();
        return result;
    }

    // Pattern 2: "analysis" or "analysisText" at the beginning
    const analysisPrefix = /^analysis\s*[:：]?\s*([\s\S]*?)(?:\n\n|\r\n\r\n)([^]*)/i;
    const prefixMatch = content.match(analysisPrefix);

    if (prefixMatch) {
        result.analysis = prefixMatch[1].trim();
        result.response = prefixMatch[2].trim();
        return result;
    }

    // Pattern 3: English reasoning text before actual response
    const reasoningPattern = /^((?:The user|We have|User says|analysis)[^]*?)\n\n([^]*)/i;
    const reasoningMatch = content.match(reasoningPattern);

    if (reasoningMatch && reasoningMatch[1].length < content.length * 0.5) {
        // Only treat as analysis if it's less than 50% of total content
        const potentialAnalysis = reasoningMatch[1].trim();
        const potentialResponse = reasoningMatch[2].trim();

        // Check if it looks like reasoning (contains English explanation keywords)
        if (/(?:user|conversation|respond|should|probably|means)/i.test(potentialAnalysis)) {
            result.analysis = potentialAnalysis;
            result.response = potentialResponse;
            return result;
        }
    }

    return result;
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
