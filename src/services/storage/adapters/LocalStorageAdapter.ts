/**
 * LocalStorage Adapter for Web
 * Implements IKeyValueStorage using browser's localStorage
 */

import { IKeyValueStorage } from './IStorageAdapter';

export class LocalStorageAdapter implements IKeyValueStorage {
    async getItem(key: string): Promise<string | null> {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error('LocalStorage getItem error:', error);
            return null;
        }
    }

    async setItem(key: string, value: string): Promise<void> {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error('LocalStorage setItem error:', error);
            throw error;
        }
    }

    async removeItem(key: string): Promise<void> {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('LocalStorage removeItem error:', error);
            throw error;
        }
    }

    async clear(): Promise<void> {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('LocalStorage clear error:', error);
            throw error;
        }
    }

    async getAllKeys(): Promise<string[]> {
        try {
            return Object.keys(localStorage);
        } catch (error) {
            console.error('LocalStorage getAllKeys error:', error);
            return [];
        }
    }
}
