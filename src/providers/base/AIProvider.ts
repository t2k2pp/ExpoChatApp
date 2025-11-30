/**
 * Base AI Provider Abstract Class
 * All AI providers must extend this class
 */

import { Message } from '../../models';

export abstract class AIProvider {
    /**
     * Send a message and get a complete response
     * @param messages - Array of conversation messages
     * @param systemPrompt - Optional system prompt
     * @returns Promise with the assistant's response
     */
    abstract sendMessage(
        messages: Message[],
        systemPrompt?: string
    ): Promise<string>;

    /**
     * Send a message with streaming response
     * @param messages - Array of conversation messages
     * @param systemPrompt - Optional system prompt
     * @param onToken - Callback function called for each token received
     * @returns Promise that resolves when streaming completes
     */
    abstract sendMessageStream(
        messages: Message[],
        systemPrompt?: string,
        onToken?: (token: string) => void
    ): Promise<void>;

    /**
     * Validate connection to the AI provider
     * @returns Promise<boolean> indicating if connection is valid
     */
    abstract validateConnection(): Promise<boolean>;

    /**
     * Get available models from the AI provider
     * @returns Promise<string[]> array of model IDs
     */
    abstract getAvailableModels(): Promise<string[]>;

    /**
     * Get the provider name
     */
    abstract getName(): string;
}
