/**
 * Message Bubble Component
 * Displays a single chat message with role-based styling
 * Supports collapsible analysis/thinking sections
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../models';
import { parseMessageContent, cleanControlTokens } from '../../utils/messageParser';

interface MessageBubbleProps {
    message: Message;
}

// デバッグモード：trueにすると生レスポンスを表示
const DEBUG_RAW_RESPONSE = true;

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
    const [isDebugExpanded, setIsDebugExpanded] = useState(false);
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) {
        return (
            <View style={styles.systemContainer}>
                <Text style={styles.systemText}>{message.content}</Text>
            </View>
        );
    }

    // Parse message to extract analysis and response
    const parsed = parseMessageContent(message.content);
    const hasAnalysis = !!parsed.analysis && parsed.analysis.length > 0;

    return (
        <View style={[styles.container, isUser && styles.userContainer]}>
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                {/* Debug Section (only for assistant) */}
                {!isUser && DEBUG_RAW_RESPONSE && (
                    <>
                        <TouchableOpacity
                            style={styles.debugHeader}
                            onPress={() => setIsDebugExpanded(!isDebugExpanded)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.debugLabel}>
                                🔍 Raw Response
                            </Text>
                            <Ionicons
                                name={isDebugExpanded ? 'chevron-up' : 'chevron-down'}
                                size={14}
                                color="#999"
                            />
                        </TouchableOpacity>
                        {isDebugExpanded && (
                            <View style={styles.debugContent}>
                                <Text style={styles.debugText} selectable>
                                    {message.content}
                                </Text>
                            </View>
                        )}
                    </>
                )}

                {/* Analysis Section (only for assistant) */}
                {!isUser && hasAnalysis && (
                    <TouchableOpacity
                        style={styles.analysisHeader}
                        onPress={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.analysisLabel}>
                            analysis
                        </Text>
                        <Ionicons
                            name={isAnalysisExpanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#666"
                        />
                    </TouchableOpacity>
                )}

                {/* Expanded Analysis Content */}
                {!isUser && hasAnalysis && isAnalysisExpanded && (
                    <View style={styles.analysisContent}>
                        <Text style={styles.analysisText}>
                            {cleanControlTokens(parsed.analysis || '')}
                        </Text>
                    </View>
                )}

                {/* Main Response */}
                <Text style={[styles.text, isUser && styles.userText]}>
                    {cleanControlTokens(parsed.response)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        paddingHorizontal: 16,
        flexDirection: 'row',
    },
    userContainer: {
        justifyContent: 'flex-end',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: '#E5E5EA',
        borderBottomLeftRadius: 4,
    },
    text: {
        fontSize: 16,
        lineHeight: 22,
        color: '#000',
    },
    userText: {
        color: '#FFF',
    },
    systemContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignItems: 'center',
    },
    systemText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    analysisHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#CCC',
    },
    analysisLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginRight: 6,
        fontStyle: 'italic',
    },
    analysisContent: {
        backgroundColor: '#F5F5F5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    analysisText: {
        fontSize: 13,
        lineHeight: 18,
        color: '#555',
        fontStyle: 'italic',
    },
    debugHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 6,
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#DDD',
    },
    debugLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#999',
        marginRight: 4,
    },
    debugContent: {
        backgroundColor: '#FAFAFA',
        padding: 8,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    debugText: {
        fontSize: 11,
        lineHeight: 16,
        color: '#666',
        fontFamily: 'monospace',
    },
});
