/**
 * Chat Service
 * Orchestrates AI provider and database operations for chat functionality
 */

import { v4 as uuidv4 } from 'uuid';
import { Message, CreateMessageDTO, Chat, CreateChatDTO } from '../../models';
import { AIProvider } from '../../providers';
import { DatabaseService } from '../database';
import { StorageService } from '../storage';

export class ChatService {
    private static instance: ChatService;
    private databaseService: DatabaseService;
    private storageService: StorageService;
    private aiProvider: AIProvider | null = null;

    private constructor() {
        this.databaseService = DatabaseService.getInstance();
        this.storageService = StorageService.getInstance();
    }

    static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    async initialize(): Promise<void> {
        await this.databaseService.initDatabase();
    }

    setAIProvider(provider: AIProvider): void {
        this.aiProvider = provider;
    }

    async createChat(dto: CreateChatDTO): Promise<Chat> {
        return await this.databaseService.createChat(dto);
    }

    async getAllChats(): Promise<Chat[]> {
        return await this.databaseService.getAllChats();
    }

    async getChat(chatId: number): Promise<Chat | null> {
        const chat = await this.databaseService.getChat(chatId);
        if (chat) {
            chat.messages = await this.databaseService.getChatMessages(chatId);
        }
        return chat;
    }

    async updateChatTitle(chatId: number, title: string): Promise<void> {
        await this.databaseService.updateChatTitle(chatId, title);
    }

    async deleteChat(chatId: number): Promise<void> {
        await this.databaseService.deleteChat(chatId);
    }

    async searchChats(query: string): Promise<Chat[]> {
        return await this.databaseService.search
        Chats(query);
    }

    private createMessage(dto: CreateMessageDTO): Message {
        return {
            id: uuidv4(),
            role: dto.role,
            content: dto.content,
            timestamp: Date.now(),
        };
    }

    async sendMessage(
        chatId: number,
        userMessage: CreateMessageDTO
    ): Promise<Message> {
        if (!this.aiProvider) {
            throw new Error('AI provider not initialized');
        }

        // Create and save user message
        const message = this.createMessage(userMessage);
        await this.databaseService.saveMessage(chatId, message);

        // Get chat history and ensure the new message is included
        const previousMessages = await this.databaseService.getChatMessages(chatId);
        const messages = previousMessages.some(m => m.id === message.id)
            ? previousMessages
            : [...previousMessages, message];
        const systemPrompt = await this.storageService.getSystemPrompt();

        // Get AI response
        const responseContent = await this.aiProvider.sendMessage(
            messages,
            systemPrompt
        );

        // Create and save assistant message
        const assistantMessage = this.createMessage({
            role: 'assistant',
            content: responseContent,
        });
        await this.databaseService.saveMessage(chatId, assistantMessage);

        return assistantMessage;
    }

    async sendMessageStream(
        chatId: number,
        userMessage: CreateMessageDTO,
        onToken: (token: string) => void
    ): Promise<Message> {
        if (!this.aiProvider) {
            throw new Error('AI provider not initialized');
            /**
             * Chat Service
             * Orchestrates AI provider and database operations for chat functionality
             */

            import { v4 as uuidv4 } from 'uuid';
            import { Message, CreateMessageDTO, Chat, CreateChatDTO } from '../../models';
            import { AIProvider } from '../../providers';
            import { DatabaseService } from '../database';
            import { StorageService } from '../storage';

            export class ChatService {
                private static instance: ChatService;
                private databaseService: DatabaseService;
                private storageService: StorageService;
                private aiProvider: AIProvider | null = null;

                private constructor() {
                    this.databaseService = DatabaseService.getInstance();
                    this.storageService = StorageService.getInstance();
                }

                static getInstance(): ChatService {
                    if (!ChatService.instance) {
                        ChatService.instance = new ChatService();
                    }
                    return ChatService.instance;
                }

                async initialize(): Promise<void> {
                    await this.databaseService.initDatabase();
                }

                setAIProvider(provider: AIProvider): void {
                    this.aiProvider = provider;
                }

                async createChat(dto: CreateChatDTO): Promise<Chat> {
                    return await this.databaseService.createChat(dto);
                }

                async getAllChats(): Promise<Chat[]> {
                    return await this.databaseService.getAllChats();
                }

                async getChat(chatId: number): Promise<Chat | null> {
                    const chat = await this.databaseService.getChat(chatId);
                    if (chat) {
                        chat.messages = await this.databaseService.getChatMessages(chatId);
                    }
                    return chat;
                }

                async updateChatTitle(chatId: number, title: string): Promise<void> {
                    await this.databaseService.updateChatTitle(chatId, title);
                }

                async deleteChat(chatId: number): Promise<void> {
                    await this.databaseService.deleteChat(chatId);
                }

                async searchChats(query: string): Promise<Chat[]> {
                    return await this.databaseService.search
                    Chats(query);
                }

                private createMessage(dto: CreateMessageDTO): Message {
                    return {
                        id: uuidv4(),
                        role: dto.role,
                        content: dto.content,
                        timestamp: Date.now(),
                    };
                }

                async sendMessage(
                    chatId: number,
                    userMessage: CreateMessageDTO
                ): Promise<Message> {
                    if (!this.aiProvider) {
                        throw new Error('AI provider not initialized');
                    }

                    // Create and save user message
                    const message = this.createMessage(userMessage);
                    await this.databaseService.saveMessage(chatId, message);

                    // Get chat history
                    const messages = await this.databaseService.getChatMessages(chatId);
                    const systemPrompt = await this.storageService.getSystemPrompt();

                    // Get AI response
                    const responseContent = await this.aiProvider.sendMessage(
                        messages,
                        systemPrompt
                    );

                    // Create and save assistant message
                    const assistantMessage = this.createMessage({
                        role: 'assistant',
                        content: responseContent,
                    });
                    await this.databaseService.saveMessage(chatId, assistantMessage);

                    return assistantMessage;
                }

                async sendMessageStream(
                    chatId: number,
                    userMessage: CreateMessageDTO,
                    onToken: (token: string) => void
                ): Promise<Message> {
                    if (!this.aiProvider) {
                        throw new Error('AI provider not initialized');
                    }

                    // Create and save user message
                    const message = this.createMessage(userMessage);
                    await this.databaseService.saveMessage(chatId, message);

                    // Get chat history and include the new message
                    const previousMessages = await this.databaseService.getChatMessages(chatId);
                    // Ensure the new message is included (it might not be in DB yet due to async)
                    const messages = previousMessages.some(m => m.id === message.id)
                        ? previousMessages
                        : [...previousMessages, message];

                    const systemPrompt = await this.storageService.getSystemPrompt();

                    // Get AI response with streaming
                    let fullResponse = '';
                    await this.aiProvider.sendMessageStream(
                        messages,
                        systemPrompt,
                        (token) => {
                            fullResponse += token;
                            onToken(token);
                        }
                    );

                    // Save assistant's response
                    const assistantMessage = this.createMessage({
                        role: 'assistant',
                        content: fullResponse,
                    });
                    await this.databaseService.saveMessage(chatId, assistantMessage);
                    await this.databaseService.updateChatTimestamp(chatId);

                    return assistantMessage;
                }
            }
