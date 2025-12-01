/**
 * Chat Input Component
 * Text input field with send button and web search toggle for chat messages
 */

import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputProps {
    onSend: (message: string, webSearchEnabled: boolean) => void;
    disabled?: boolean;
    placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    disabled = false,
    placeholder = 'Type a message...',
}) => {
    const [message, setMessage] = useState('');
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim(), webSearchEnabled);
            setMessage('');
        }
    };

    const toggleWebSearch = () => {
        setWebSearchEnabled(!webSearchEnabled);
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TouchableOpacity
                    style={styles.webSearchButton}
                    onPress={toggleWebSearch}
                    disabled={disabled}
                >
                    <Ionicons
                        name="globe-outline"
                        size={24}
                        color={webSearchEnabled ? '#007AFF' : '#999'}
                    />
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={setMessage}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    multiline
                    maxLength={2000}
                    editable={!disabled}
                    onSubmitEditing={handleSend}
                    blurOnSubmit={false}
                />

                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!message.trim() || disabled) && styles.sendButtonDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={!message.trim() || disabled}
                >
                    <Ionicons
                        name="send"
                        size={20}
                        color={message.trim() && !disabled ? '#007AFF' : '#CCC'}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        backgroundColor: '#FFF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    webSearchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 20,
        fontSize: 16,
        backgroundColor: '#F8F8F8',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F0F0',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
