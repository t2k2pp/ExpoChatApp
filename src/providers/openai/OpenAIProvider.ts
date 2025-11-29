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
            const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && {
                        Authorization: `Bearer ${this.config.apiKey}`,
                    }),
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: formattedMessages,
                    temperature: this.config.temperature ?? 0.7,
                    max_tokens: this.config.maxTokens,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const token = parsed.choices[0]?.delta?.content;
                            if (token && onToken) {
                                onToken(token);
                            }
                        } catch (e) {
                            // Ignore parse errors for incomplete chunks
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Streaming Error: ${error.message}`);
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
