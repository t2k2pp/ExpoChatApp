/**
 * Provider configuration models
 * Defines AI provider types and their configurations
 */

export type ProviderType =
    | 'openai-compatible'
    | 'claude'
    | 'gemini'
    | 'azure-openai';

export interface BaseProviderConfig {
    type: ProviderType;
    model: string;
    temperature?: number;
    maxTokens?: number;
}

export interface OpenAICompatibleConfig extends BaseProviderConfig {
    type: 'openai-compatible';
    baseUrl: string;
    apiKey?: string;
}

export interface ClaudeConfig extends BaseProviderConfig {
    type: 'claude';
    apiKey: string;
}

export interface GeminiConfig extends BaseProviderConfig {
    type: 'gemini';
    apiKey: string;
}

export interface AzureOpenAIConfig extends BaseProviderConfig {
    type: 'azure-openai';
    endpoint: string;
    apiKey: string;
    deployment: string;
}

export type ProviderConfig =
    | OpenAICompatibleConfig
    | ClaudeConfig
    | GeminiConfig
    | AzureOpenAIConfig;
