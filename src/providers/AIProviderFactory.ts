/**
 * AI Provider Factory
 * Creates appropriate AI provider instances based on configuration
 */

import { AIProvider } from './base/AIProvider';
import { OpenAIProvider } from './openai/OpenAIProvider';
import { ProviderConfig } from '../models';

export class AIProviderFactory {
    /**
     * Create an AI provider instance based on configuration
     * @param config - Provider configuration
     * @returns AIProvider instance
     * @throws Error if provider type is unknown
     */
    static createProvider(config: ProviderConfig): AIProvider {
        switch (config.type) {
            case 'openai-compatible':
                return new OpenAIProvider(config);

            // Future providers
            // case 'claude':
            //   return new ClaudeProvider(config);
            // case 'gemini':
            //   return new GeminiProvider(config);
            // case 'azure-openai':
            //   return new AzureOpenAIProvider(config);

            default:
                throw new Error(`Unknown provider type: ${config.type}`);
        }
    }

    /**
     * Get list of supported provider types
     */
    static getSupportedProviders(): string[] {
        return ['openai-compatible'];
        // Future: return ['openai-compatible', 'claude', 'gemini', 'azure-openai'];
    }
}
