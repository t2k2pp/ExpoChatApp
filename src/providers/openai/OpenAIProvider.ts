/**
 * OpenAI-compatible AI Provider
 * Supports OpenAI API, Llama.cpp, Ollama, LM Studio, Azure OpenAI, etc.
 */

import axios, { AxiosInstance } from 'axios';
import { AIProvider } from '../base/AIProvider';
import { Message, OpenAICompatibleConfig } from '../../models';

export class OpenAIProvider extends AIProvider {
    private client: AxiosInstance;
    private config: OpenAICompatibleConfig;

    constructor(config: OpenAICompatibleConfig) {
        super();
        this.config = config;

        this.client = axios.create({
            baseURL: config.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
            },
            timeout: 60000, // 60 seconds
        });
    }

    getName(): string {
        return 'OpenAI Compatible';
    }

    async sendMessage(
        messages: Message[],
        systemPrompt?: string
    ): Promise<string> {
        const formattedMessages = this.formatMessages(messages, systemPrompt);

        try {
            const response = await this.client.post('/chat/completions', {
                model: this.config.model,
                messages: formattedMessages,
                temperature: this.config.temperature ?? 0.7,
                max_tokens: this.config.maxTokens,
                stream: false,
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `API Error: ${error.response?.data?.error?.message || error.message}`
                );
            }
            throw error;
        }
    }

    async sendMessageStream(
        messages: Message[],
        systemPrompt?: string,
        onToken?: (token: string) => void
    ): Promise<void> {
        const formattedMessages = this.formatMessages(messages, systemPrompt);

        try {
            // React Native has limited ReadableStream support
            // Fall back to non-streaming mode with simulated token delivery
            const response = await this.client.post('/chat/completions', {
                model: this.config.model,
                messages: formattedMessages,
                temperature: this.config.temperature ?? 0.7,
                max_tokens: this.config.maxTokens,
                stream: false,
            });

            const fullContent = response.data.choices[0].message.content;

            // Simulate streaming by chunking the response
            if (onToken && fullContent) {
                const words = fullContent.split(' ');
                for (let i = 0; i < words.length; i++) {
                    const token = i === words.length - 1 ? words[i] : words[i] + ' ';
                    onToken(token);
                    // Small delay to simulate streaming
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Streaming Error: ${error.response?.data?.error?.message || error.message}`
                );
            }
            throw error;
        }
    }

    async validateConnection(): Promise<boolean> {
        try {
            const response = await this.client.get('/models');
            return response.status === 200;
        } catch (error) {
            console.error('Connection validation failed:', error);
            return false;
        }
    }

    private formatMessages(
        messages: Message[],
        systemPrompt?: string
    ): Array<{ role: string; content: string }> {
        const formatted = messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));

        if (systemPrompt) {
            formatted.unshift({
                role: 'system',
                content: systemPrompt,
            });
        }

        return formatted;
    }
}
