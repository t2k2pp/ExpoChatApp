/**
 * Chat Screen
 * Main chat interface for conversations with AI
 */

import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    Platform,
    Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Message } from '../models';
import { ChatService } from '../services';
import { MessageBubble, ChatInput, TypingIndicator } from '../components/chat';
import { AIProviderFactory } from '../providers';
import { StorageService } from '../services';

interface ChatScreenProps {
    route: any;
    navigation: any;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
    const { chatId } = route.params;
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [currentResponse, setCurrentResponse] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const chatService = ChatService.getInstance();
    const storageService = StorageService.getInstance();

    useEffect(() => {
        initializeChat();
    }, [chatId]);

    const initializeChat = async () => {
        try {
            // Load chat messages
            const chat = await chatService.getChat(chatId);
            if (chat && chat.messages) {
                setMessages(chat.messages);
                if (chat.title !== 'New Chat') {
                    navigation.setOptions({ title: chat.title });
                }
            }

            // Initialize AI provider
            const config = await storageService.getProviderConfig();
            const provider = AIProviderFactory.createProvider(config);
            chatService.setAIProvider(provider);
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            Alert.alert('Error', 'Failed to load chat');
        }
    };

    const handleSendMessage = async (content: string) => {
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsTyping(true);
        setCurrentResponse('');

        try {
            let fullResponse = '';

            await chatService.sendMessageStream(
                chatId,
                { role: 'user', content },
                (token) => {
                    fullResponse += token;
                    setCurrentResponse(fullResponse);
                }
            );

            // Clear streaming response and add final message
            setCurrentResponse('');
            const assistantMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: fullResponse,
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, assistantMessage]);

            // Update chat title if it's the first message
            const chat = await chatService.getChat(chatId);
            if (chat && chat.title === 'New Chat' && messages.length === 0) {
                const newTitle = content.substring(0, 30) + (content.length > 30 ? '...' : '');
                await chatService.updateChatTitle(chatId, newTitle);
                navigation.setOptions({ title: newTitle });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message. Please check your settings.');
        } finally {
            setIsTyping(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <MessageBubble message={item} />
    );

    const renderStreamingMessage = () => {
        if (!currentResponse) return null;

        const streamingMessage: Message = {
            id: 'streaming',
            role: 'assistant',
            content: currentResponse,
            timestamp: Date.now(),
        };

        return <MessageBubble message={streamingMessage} />;
    };

    return (
        <View style={styles.container}>
            <KeyboardAwareScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                enableOnAndroid={true}
                enableAutomaticScroll={true}
                extraScrollHeight={20}
                keyboardShouldPersistTaps="handled"
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageList}
                    scrollEnabled={false}
                    ListFooterComponent={() => (
                        <>
                            {renderStreamingMessage()}
                            {isTyping && !currentResponse && <TypingIndicator />}
                        </>
                    )}
                />
            </KeyboardAwareScrollView>
            <ChatInput onSend={handleSendMessage} disabled={isTyping} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    messageList: {
        paddingVertical: 16,
        flexGrow: 1,
    },
});
