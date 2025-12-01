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
    Platform,
    TouchableOpacity,
} from 'react-native';
import { Button, Input } from '../components/common';
import { SearXNGSettings } from '../components/settings';
import { StorageService } from '../services';
import { OpenAICompatibleConfig, SearXNGConfig } from '../models';
import { AIProviderFactory } from '../providers';

export const SettingsScreen: React.FC = () => {
    const [systemPrompt, setSystemPrompt] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('');
    const [temperature, setTemperature] = useState('0.7');
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ message: string; success: boolean } | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [showModelPicker, setShowModelPicker] = useState(false);
    const storageService = StorageService.getInstance();

    useEffect(() => {
        loadSettings();
    }, []);

    const cleanModelName = (rawName: string): string => {
        // Extract model name from full path like:
        // "/home/user/models/model-name/model-name-00001.gguf" -> "model-name"

        // Remove file extension
        let cleaned = rawName.replace(/\.gguf$/i, '');

        // Extract filename from path
        const parts = cleaned.split('/');
        const filename = parts[parts.length - 1] || cleaned;

        // Remove part numbers like "-00001-of-00002"
        cleaned = filename.replace(/-\d{5}(-of-\d{5})?$/i, '');

        return cleaned;
    };

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

            // Load SearXNG config
            const searxngConfig = await storageService.getSearXNGConfig();
            setSearxngEnabled(searxngConfig.enabled);
            setSearxngUrl(searxngConfig.baseUrl);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setTestResult(null);

        try {
            // Validate inputs
            if (!baseUrl.trim()) {
                setTestResult({ message: 'Base URL is required', success: false });
                setLoading(false);
                return;
            }

            if (!model.trim()) {
                setTestResult({ message: 'Model name is required', success: false });
                setLoading(false);
                return;
            }

            // Validate temperature
            const tempValue = parseFloat(temperature);
            if (isNaN(tempValue) || tempValue < 0 || tempValue > 2) {
                setTestResult({ message: 'Temperature must be between 0 and 2', success: false });
                setLoading(false);
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

            // Save SearXNG config
            const searxngConfig: SearXNGConfig = {
                enabled: searxngEnabled,
                baseUrl: searxngUrl.trim(),
            };
            await storageService.setSearXNGConfig(searxngConfig);

            console.log('Settings saved successfully:', config);
            setTestResult({ message: '✓ Settings saved successfully!', success: true });
            Alert.alert('Success', 'Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            setTestResult({ message: '✗ Failed to save settings', success: false });
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

    const handleLoadModels = async () => {
        if (!baseUrl.trim()) {
            setTestResult({ message: 'Please enter Base URL first', success: false });
            return;
        }

        setLoadingModels(true);
        setTestResult(null);

        try {
            const config: OpenAICompatibleConfig = {
                type: 'openai-compatible',
                baseUrl: baseUrl.trim(),
                apiKey: apiKey.trim() || undefined,
                model: model.trim() || 'temp', // Temporary model for API call
                temperature: 0.7,
            };

            const provider = AIProviderFactory.createProvider(config);
            const models = await provider.getAvailableModels();

            if (models.length > 0) {
                // Clean model names to remove paths and extensions
                const cleanedModels = models.map(cleanModelName);
                // Remove duplicates
                const uniqueModels = Array.from(new Set(cleanedModels));
                setAvailableModels(uniqueModels);
                setTestResult({
                    message: `✓ Loaded ${uniqueModels.length} model(s) from server`,
                    success: true
                });
                console.log('Raw models:', models);
                console.log('Cleaned models:', uniqueModels);
            } else {
                setTestResult({
                    message: '✗ No models found. Check server connection.',
                    success: false
                });
            }
        } catch (error) {
            console.error('Failed to load models:', error);
            setTestResult({
                message: `✗ Failed to load models: ${(error as Error).message}`,
                success: false
            });
        } finally {
            setLoadingModels(false);
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

            <View style={styles.modelSection}>
                <Text style={styles.label}>Model</Text>
                <View style={styles.modelInputRow}>
                    <Input
                        value={model}
                        onChangeText={setModel}
                        placeholder="Select from list or type manually"
                        autoCapitalize="none"
                        style={styles.modelInput}
                    />
                    <Button
                        title="Load Models"
                        onPress={handleLoadModels}
                        variant="secondary"
                        loading={loadingModels}
                        style={styles.loadModelsButton}
                    />
                </View>

                {availableModels.length > 0 && (
                    <View style={styles.modelListContainer}>
                        <Text style={styles.modelListTitle}>📋 Available Models ({availableModels.length}) - Click to select:</Text>
                        <View style={styles.modelList}>
                            {availableModels.map((modelName) => (
                                <TouchableOpacity
                                    key={modelName}
                                    style={[
                                        styles.modelItem,
                                        model === modelName && styles.modelItemSelected
                                    ]}
                                    onPress={() => setModel(modelName)}
                                >
                                    <View style={styles.modelItemContent}>
                                        <Text style={[
                                            styles.modelItemText,
                                            model === modelName && styles.modelItemTextSelected
                                        ]}>
                                            {modelName}
                                        </Text>
                                        {model === modelName && (
                                            <Text style={styles.checkmark}>✓</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <Input
                label="Temperature (0-2)"
                value={temperature}
                onChangeText={setTemperature}
                placeholder="0.7"
                keyboardType="decimal-pad"
            />

            <SearXNGSettings />

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
    modelSection: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        marginBottom: 8,
    },
    modelInputRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
    },
    modelInput: {
        flex: 1,
    },
    loadModelsButton: {
        minWidth: 120,
        marginTop: 0,
    },
    modelListContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    modelListTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    modelList: {
        gap: 6,
    },
    modelItem: {
        padding: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    modelItemSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    modelItemText: {
        fontSize: 13,
        color: '#333',
    },
    modelItemTextSelected: {
        color: '#1976D2',
        fontWeight: '600',
    },
    modelItemContent: {
                        </View >
                    </View >
                )}
            </View >

            <Input
                label="Temperature (0-2)"
                value={temperature}
                onChangeText={setTemperature}
                placeholder="0.7"
                keyboardType="decimal-pad"
            />

            <Text style={styles.sectionTitle}>Web Search (SearXNG)</Text>

            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Enable Web Search</Text>
                <Switch
                    value={searxngEnabled}
                    onValueChange={setSearxngEnabled}
                    trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                    thumbColor={Platform.OS === 'android' ? '#FFF' : undefined}
                />
            </View>

{
    searxngEnabled && (
        <Input
            label="SearXNG Instance URL"
            value={searxngUrl}
            onChangeText={setSearxngUrl}
            placeholder="http://192.168.1.24:8081"
            autoCapitalize="none"
            keyboardType="url"
        />
    )
}

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

{
    testResult && (
        <View style={[
            styles.resultBox,
            testResult.success ? styles.resultSuccess : styles.resultError
        ]}>
            <Text style={styles.resultText}>{testResult.message}</Text>
        </View>
    )
}

<View style={styles.infoContainer}>
    <Text style={styles.infoTitle}>📖 Quick Setup Guide</Text>
    <Text style={styles.infoText}>
        • For Llama.cpp: http://localhost:8080/v1{'\n'}
        • For Ollama: http://localhost:11434/v1{'\n'}
        • For LM Studio: http://localhost:1234/v1{'\n'}
        • For OpenAI: https://api.openai.com/v1
    </Text>
</View>
        </ScrollView >
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
    modelSection: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        marginBottom: 8,
    },
    modelInputRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
    },
    modelInput: {
        flex: 1,
    },
    loadModelsButton: {
        minWidth: 120,
        marginTop: 0,
    },
    modelListContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    modelListTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    modelList: {
        gap: 6,
    },
    modelItem: {
        padding: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    modelItemSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    modelItemText: {
        fontSize: 13,
        color: '#333',
    },
    modelItemTextSelected: {
        color: '#1976D2',
        fontWeight: '600',
    },
    modelItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    checkmark: {
        fontSize: 18,
        color: '#1976D2',
        fontWeight: 'bold',
        marginLeft: 8,
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
