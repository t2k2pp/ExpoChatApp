/**
 * SearXNG Settings Component
 * Manages SearXNG web search configuration
 */

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
    View,
    Text,
    Switch,
    StyleSheet,
    Platform,
} from 'react-native';
import { Input } from '../common';
import { StorageService } from '../../services';

export interface SearXNGSettingsRef {
    saveConfig: () => Promise<void>;
}

export const SearXNGSettings = forwardRef<SearXNGSettingsRef>((props, ref) => {
    const [enabled, setEnabled] = useState(false);
    const [url, setUrl] = useState('http://192.168.1.24:8081');
    const storageService = StorageService.getInstance();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const config = await storageService.getSearXNGConfig();
            setEnabled(config.enabled);
            setUrl(config.baseUrl);
        } catch (error) {
            console.error('Failed to load SearXNG config:', error);
        }
    };

    const saveConfig = async () => {
        try {
            await storageService.setSearXNGConfig({
                enabled,
                baseUrl: url.trim(),
            });
            console.log('[SearXNGSettings] Config saved:', { enabled, baseUrl: url.trim() });
        } catch (error) {
            console.error('Failed to save SearXNG config:', error);
            throw error;
        }
    };

    // Expose saveConfig to parent via ref
    useImperativeHandle(ref, () => ({
        saveConfig,
    }));

    return (
        <>
            <Text style={styles.sectionTitle}>Web Search (SearXNG)</Text>

            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Enable Web Search</Text>
                <Switch
                    value={enabled}
                    onValueChange={setEnabled}
                    trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                    thumbColor={Platform.OS === 'android' ? '#FFF' : undefined}
                />
            </View>

            {enabled && (
                <Input
                    label="SearXNG Instance URL"
                    value={url}
                    onChangeText={setUrl}
                    placeholder="http://192.168.1.24:8081"
                    autoCapitalize="none"
                    keyboardType="url"
                />
            )}
        </>
    );
});

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginTop: 16,
        marginBottom: 12,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginBottom: 16,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
});
