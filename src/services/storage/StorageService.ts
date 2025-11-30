/**
 * Storage Service
 * Manages key-value storage for app settings using platform-specific adapters
 */

import { AppSettings, DEFAULT_SETTINGS, ProviderConfig } from '../../models';
import { IKeyValueStorage, AsyncStorageAdapter, LocalStorageAdapter } from './adapters';
import { isWeb } from '../../utils/platformUtils';

const KEYS = {
    SETTINGS: '@chat_app_settings',
    SYSTEM_PROMPT: '@chat_app_system_prompt',
    PROVIDER_CONFIG: '@chat_app_provider_config',
};

export class StorageService {
    private static instance: StorageService;
    private adapter: IKeyValueStorage;

    private constructor() {
        // Select adapter based on platform
        this.adapter = isWeb() ? new LocalStorageAdapter() : new AsyncStorageAdapter();
    }

    static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    async getSettings(): Promise<AppSettings> {
        try {
            const settingsJson = await this.adapter.getItem(KEYS.SETTINGS);
            if (settingsJson) {
                return JSON.parse(settingsJson);
            }
            return DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Failed to get settings:', error);
            return DEFAULT_SETTINGS;
        }
    }

    async saveSettings(settings: AppSettings): Promise<void> {
        try {
            await this.adapter.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    }

    async getSystemPrompt(): Promise<string> {
        try {
            const prompt = await this.adapter.getItem(KEYS.SYSTEM_PROMPT);
            return prompt || DEFAULT_SETTINGS.systemPrompt;
        } catch (error) {
            console.error('Failed to get system prompt:', error);
            return DEFAULT_SETTINGS.systemPrompt;
        }
    }

    async saveSystemPrompt(prompt: string): Promise<void> {
        try {
            await this.adapter.setItem(KEYS.SYSTEM_PROMPT, prompt);
        } catch (error) {
            console.error('Failed to save system prompt:', error);
            throw error;
        }
    }

    async getProviderConfig(): Promise<ProviderConfig> {
        try {
            const configJson = await this.adapter.getItem(KEYS.PROVIDER_CONFIG);
            console.log('[StorageService] getProviderConfig - raw value:', configJson);
            if (configJson) {
                const parsed = JSON.parse(configJson);
                console.log('[StorageService] getProviderConfig - parsed:', parsed);
                return parsed;
            }
            console.log('[StorageService] getProviderConfig - no config found, using DEFAULT');
            return DEFAULT_SETTINGS.providerConfig;
        } catch (error) {
            console.error('Failed to get provider config:', error);
            return DEFAULT_SETTINGS.providerConfig;
        }
    }

    async saveProviderConfig(config: ProviderConfig): Promise<void> {
        try {
            await this.adapter.setItem(KEYS.PROVIDER_CONFIG, JSON.stringify(config));
        } catch (error) {
            console.error('Failed to save provider config:', error);
            throw error;
        }
    }

    async clearAllData(): Promise<void> {
        try {
            const keys = Object.values(KEYS);
            for (const key of keys) {
                await this.adapter.removeItem(key);
            }
        } catch (error) {
            console.error('Failed to clear all data:', error);
            throw error;
        }
    }
}
