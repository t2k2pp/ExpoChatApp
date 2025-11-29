/**
 * Storage Service
 * Manages AsyncStorage operations for app settings
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS, ProviderConfig } from '../../models';

const KEYS = {
    SETTINGS: '@chat_app_settings',
    SYSTEM_PROMPT: '@chat_app_system_prompt',
    PROVIDER_CONFIG: '@chat_app_provider_config',
};

export class StorageService {
    private static instance: StorageService;

    private constructor() { }

    static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    async getSettings(): Promise<AppSettings> {
        try {
            const settingsJson = await AsyncStorage.getItem(KEYS.SETTINGS);
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
            await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    }

    async getSystemPrompt(): Promise<string> {
        try {
            const prompt = await AsyncStorage.getItem(KEYS.SYSTEM_PROMPT);
            return prompt || DEFAULT_SETTINGS.systemPrompt;
        } catch (error) {
            console.error('Failed to get system prompt:', error);
            return DEFAULT_SETTINGS.systemPrompt;
        }
    }

    async saveSystemPrompt(prompt: string): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.SYSTEM_PROMPT, prompt);
        } catch (error) {
            console.error('Failed to save system prompt:', error);
            throw error;
        }
    }

    async getProviderConfig(): Promise<ProviderConfig> {
        try {
            const configJson = await AsyncStorage.getItem(KEYS.PROVIDER_CONFIG);
            if (configJson) {
                return JSON.parse(configJson);
            }
            return DEFAULT_SETTINGS.providerConfig;
        } catch (error) {
            console.error('Failed to get provider config:', error);
            return DEFAULT_SETTINGS.providerConfig;
        }
    }

    async saveProviderConfig(config: ProviderConfig): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.PROVIDER_CONFIG, JSON.stringify(config));
        } catch (error) {
            console.error('Failed to save provider config:', error);
            throw error;
        }
    }

    async clearAllData(): Promise<void> {
        try {
            await AsyncStorage.multiRemove(Object.values(KEYS));
        } catch (error) {
            console.error('Failed to clear all data:', error);
            throw error;
        }
    }
}
