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

    if (tagMatch && tagMatch[1]) {
        result.analysis = tagMatch[1].trim();
        result.response = content.replace(tagPattern, '').trim();
        return result;
    }

    // Pattern 2: "analysisText..." format (no colon, direct text)
    //  Example: "analysisThe user writes in Japanese..."
    const analysisNoColonPattern = /^analysis([^]*?)(?:\n\n|\r\n\r\n)([^]*)/i;
    const noColonMatch = content.match(analysisNoColonPattern);

    if (noColonMatch && noColonMatch[1] && noColonMatch[2]) {
        result.analysis = noColonMatch[1].trim();
        result.response = noColonMatch[2].trim();
        return result;
    }

    // Pattern 3: English reasoning text before actual response
    // Matches patterns like "The user writes...", "We have a conversation..."
    const reasoningPattern = /^((?:The user|We have|User says)[^]*?)(?:\n\n|\r\n\r\n)([^]*)/i;
    const reasoningMatch = content.match(reasoningPattern);

    if (reasoningMatch && reasoningMatch[1] && reasoningMatch[2]) {
        const potentialAnalysis = reasoningMatch[1].trim();
        const potentialResponse = reasoningMatch[2].trim();

        // Only treat as analysis if it contains reasoning keywords and is reasonable length
        if (potentialAnalysis.length < content.length * 0.6 &&
            /(?:user|conversation|respond|should|probably|means|writes|says)/i.test(potentialAnalysis)) {
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
