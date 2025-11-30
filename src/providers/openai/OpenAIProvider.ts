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
            // Validate URL format first
            try {
                new URL(this.config.baseUrl);
            } catch (urlError) {
                console.error('Invalid URL format:', this.config.baseUrl);
                return false;
            }

            // Must start with http:// or https://
            if (!this.config.baseUrl.startsWith('http://') && !this.config.baseUrl.startsWith('https://')) {
                console.error('URL must start with http:// or https://');
                return false;
            }

            console.log('Attempting to connect to:', this.config.baseUrl);
            const response = await this.client.get('/models', {
                timeout: 10000, // 10 second timeout
                validateStatus: (status) => status === 200, // Only 200 is success
            });

            console.log('Connection response status:', response.status);
            return response.status === 200;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Connection validation failed:', {
                    message: error.message,
                    code: error.code,
                    response: error.response?.status,
                });
            } else {
                console.error('Connection validation failed:', error);
            }
            return false;
        }
    }

    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await this.client.get('/models');
            if (response.status === 200 && response.data.data) {
                // OpenAI compatible API returns { data: [{ id: "model-name", ... }] }
                return response.data.data.map((model: any) => model.id);
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch models:', error);
            return [];
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
