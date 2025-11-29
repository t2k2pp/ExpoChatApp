/**
 * Application settings model
 */

import { ProviderConfig } from './Provider';

export interface AppSettings {
    systemPrompt: string;
    providerConfig: ProviderConfig;
    theme?: 'light' | 'dark';
    fontSize?: number;
}

export interface UIPreferences {
    theme: 'light' | 'dark';
    fontSize: number;
    enableStreaming: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
    systemPrompt: 'You are a helpful assistant.',
    providerConfig: {
        type: 'openai-compatible',
        baseUrl: 'http://localhost:8080/v1',
        model: 'llama-3',
        temperature: 0.7,
    },
    theme: 'light',
    fontSize: 14,
};
