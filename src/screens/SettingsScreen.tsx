/**
 * Settings Screen  
 * Allows users to configure system prompt and AI provider settings
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    Switch,
} from 'react-native';
import { Button, Input } from '../components/common';
import { StorageService } from '../services';
import { OpenAICompatibleConfig } from '../models';
import { AIProviderFactory } from '../providers';

export const SettingsScreen: React.FC = () => {
    const [systemPrompt, setSystemPrompt] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('');
    const [temperature, setTemperature] = useState('0.7');
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ message: string; success: boolean } | null>(null);
    const storageService = StorageService.getInstance();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const prompt = await storageService.getSystemPrompt();
            const config = await storageService.getProviderConfig();

            setSystemPrompt(prompt);

            if (config.type === 'openai-compatible') {
                // Explicitly set values to prevent default concatenation
                setBaseUrl(config.baseUrl || '');
                setApiKey(config.apiKey || '');
                setModel(config.model || '');
                setTemperature(config.temperature?.toString() || '0.7');
            } else {
                // Set empty strings for new users
                setBaseUrl('');
                setApiKey('');
                setModel('');
                setTemperature('0.7');
            }

            console.log('Settings loaded - baseUrl:', config.baseUrl);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Validate temperature
            const tempValue = parseFloat(temperature);
            if (isNaN(tempValue) || tempValue < 0 || tempValue > 2) {
                Alert.alert('Error', 'Temperature must be between 0 and 2');
                return;
            }

            // Save system prompt
            await storageService.saveSystemPrompt(systemPrompt);

            // Save provider config
            const config: OpenAICompatibleConfig = {
                type: 'openai-compatible',
                baseUrl: baseUrl.trim(),
                apiKey: apiKey.trim() || undefined,
                model: model.trim(),
                temperature: tempValue,
            };
            await storageService.saveProviderConfig(config);

            Alert.alert('Success', 'Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            Alert.alert('Error', 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        setLoading(true);
        setTestResult(null); // Clear previous result

        try {
            // Validate inputs first
            if (!baseUrl.trim()) {
                setTestResult({ message: 'Base URL is required', success: false });
                console.error('Test Connection: Base URL is required');
                setLoading(false);
                return;
            }

            if (!model.trim()) {
                setTestResult({ message: 'Model name is required', success: false });
                console.error('Test Connection: Model name is required');
                setLoading(false);
                return;
            }

            const tempValue = parseFloat(temperature);
            if (isNaN(tempValue) || tempValue < 0 || tempValue > 2) {
                setTestResult({ message: 'Temperature must be between 0 and 2', success: false });
                console.error('Test Connection: Invalid temperature value');
                setLoading(false);
                return;
            }

            console.log('Testing connection to:', baseUrl.trim());

            const config: OpenAICompatibleConfig = {
                type: 'openai-compatible',
                baseUrl: baseUrl.trim(),
                apiKey: apiKey.trim() || undefined,
                model: model.trim(),
                temperature: tempValue,
            };

            const provider = AIProviderFactory.createProvider(config);
            const isValid = await provider.validateConnection();

            if (isValid) {
                console.log('✅ Connection test successful!');
                setTestResult({
                    message: '✓ Connection successful! Your AI server is responding.',
                    success: true
                });
                Alert.alert('Success', 'Connection successful! Your AI server is responding.');
            } else {
                console.error('❌ Connection test failed');
                setTestResult({
                    message: '✗ Connection failed. Please check your Base URL and ensure the server is running.',
                    success: false
                });
                Alert.alert(
                    'Connection Failed',
                    'Unable to connect to the AI server. Please check:\n\n' +
                    '• Base URL is correct\n' +
                    '• Server is running\n' +
                    '• Network connection is available'
                );
            }
        } catch (error) {
            console.error('Connection test error:', error);
            const errorMessage = (error as Error).message || 'Unknown error';
            setTestResult({
                message: `✗ Connection error: ${errorMessage}`,
                success: false
            });
            Alert.alert(
                'Connection Error',
                `Failed to connect: ${errorMessage}\n\nPlease verify your settings.`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>System Prompt</Text>
            <Input
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                placeholder="You are a helpful assistant..."
                multiline
                numberOfLines={4}
                style={styles.textArea}
            />

            <Text style={styles.sectionTitle}>Provider Configuration</Text>

            <Input
                label="Base URL"
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder="http://localhost:8080/v1"
                autoCapitalize="none"
                keyboardType="url"
            />

            <Input
                label="API Key (Optional)"
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-..."
                autoCapitalize="none"
                secureTextEntry
            />

            <Input
                label="Model"
                value={model}
                onChangeText={setModel}
                placeholder="llama-3"
                autoCapitalize="none"
            />

            <Input
                label="Temperature (0-2)"
                value={temperature}
                onChangeText={setTemperature}
                placeholder="0.7"
                keyboardType="decimal-pad"
            />

            <View style={styles.buttonContainer}>
                <Button
                    title="Test Connection"
                    onPress={handleTestConnection}
                    variant="secondary"
                    loading={loading}
                    style={styles.button}
                />
                <Button
                    title="Save Settings"
                    onPress={handleSave}
                    loading={loading}
                    style={styles.button}
                />
            </View>

            {testResult && (
                <View style={[
                    styles.resultBox,
                    testResult.success ? styles.resultSuccess : styles.resultError
                ]}>
                    <Text style={styles.resultText}>{testResult.message}</Text>
                </View>
            )}

            <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>📖 Quick Setup Guide</Text>
                <Text style={styles.infoText}>
                    • For Llama.cpp: http://localhost:8080/v1{'\n'}
                    • For Ollama: http://localhost:11434/v1{'\n'}
                    • For LM Studio: http://localhost:1234/v1{'\n'}
                    • For OpenAI: https://api.openai.com/v1
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginTop: 16,
        marginBottom: 12,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        marginTop: 24,
        gap: 12,
    },
    button: {
        marginBottom: 8,
    },
    infoContainer: {
        marginTop: 32,
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    resultBox: {
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
    },
    resultSuccess: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    resultError: {
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
    },
    resultText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
    },
});
