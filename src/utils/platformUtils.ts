/**
 * Platform Detection Utility
 * Determines the current platform and provides appropriate adapters
 */

import { Platform } from 'react-native';

export type PlatformType = 'web' | 'ios' | 'android';

/**
 * Get the current platform
 */
export function getPlatform(): PlatformType {
    if (Platform.OS === 'web') return 'web';
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'web'; // fallback
}

/**
 * Check if running on web platform
 */
export function isWeb(): boolean {
    return Platform.OS === 'web';
}

/**
 * Check if running on native platform (iOS or Android)
 */
export function isNative(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
}
