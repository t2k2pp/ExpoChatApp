/**
 * AsyncStorage Adapter for Native Platforms (iOS/Android)
 * Implements IKeyValueStorage using React Native's AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { IKeyValueStorage } from './IStorageAdapter';

export class AsyncStorageAdapter implements IKeyValueStorage {
    async getItem(key: string): Promise<string | null> {
        return await AsyncStorage.getItem(key);
    }

    async setItem(key: string, value: string): Promise<void> {
        await AsyncStorage.setItem(key, value);
    }

    async removeItem(key: string): Promise<void> {
        await AsyncStorage.removeItem(key);
    }

    async clear(): Promise<void> {
        await AsyncStorage.clear();
    }

    async getAllKeys(): Promise<string[]> {
        const keys = await AsyncStorage.getAllKeys();
        return Array.from(keys);
    }
}
