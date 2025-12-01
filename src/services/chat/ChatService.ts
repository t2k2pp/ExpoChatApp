/**
 * Chat Service
 * Manages chat conversations and AI interactions
 */

import { v4 as uuidv4 } from 'uuid';
import { Chat, CreateMessageDTO, Message } from '../../models';
import { DatabaseService } from '../database';
import { StorageService } from '../storage';
import { IAIProvider } from '../../providers/types';
import { SearXNGService } from '../search';

export class ChatService {
    private static instance: ChatService;
    private databaseService: DatabaseService;
    private storageService: StorageService;
    private aiProvider: IAIProvider | null = null;

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

    setAIProvider(provider: IAIProvider): void {
        this.aiProvider = provider;
    }

    async createChat(title: string = 'New Chat'): Promise<Chat> {
        return await this.databaseService.createChat(title);
    }

    async getChat(id: number): Promise<Chat | null> {
        return await this.databaseService.getChat(id);
    }

    async getAllChats(): Promise<Chat[]> {
        return await this.databaseService.getAllChats();
    }

    async deleteChat(id: number): Promise<void> {
        return await this.databaseService.deleteChat(id);
    }

    async updateChatTitle(id: number, title: string): Promise<void> {
        return await this.databaseService.updateChatTitle(id, title);
    }

    async getChatMessages(chatId: number): Promise<Message[]> {
        return await this.databaseService.getChatMessages(chatId);
    }

    async searchChats(query: string): Promise<Chat[]> {
        return await this.databaseService.searchChats(query);
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
        onToken: (token: string) => void,
        webSearchEnabled: boolean = false
    ): Promise<Message> {
        if (!this.aiProvider) {
            throw new Error('AI provider not initialized');
        }

        // Create and save user message
        const message = this.createMessage(userMessage);
        await this.databaseService.saveMessage(chatId, message);

        // Get chat history
        const previousMessages = await this.databaseService.getChatMessages(chatId);
        const messages = previousMessages.some(m => m.id === message.id)
            ? previousMessages
            : [...previousMessages, message];

        let systemPrompt = await this.storageService.getSystemPrompt();

        console.log('[ChatService] Sending to LLM:', {
            messageCount: messages.length,
            lastMessage: messages[messages.length - 1],
            webSearchEnabled,
        });

        // Web Search Integration (Agentic Approach)
        if (webSearchEnabled) {
            const searxngConfig = await this.storageService.getSearXNGConfig();

            if (searxngConfig.enabled) {
                try {
                    // Phase 1: Ask LLM if search is needed
                    const searchDecisionPrompt = systemPrompt + `\n\nWeb Search Available: You can search the web for current information.

IMPORTANT: If the user explicitly asks to search the web (e.g., "search for...", "look up online..."), you MUST use web search.

Analyze the user's question and decide:
1. Does this require current/real-time information?
2. Did the user explicitly request a web search?
3. Can you answer with your existing knowledge?

If search is needed, respond ONLY with:
<|search_needed|>yes<|/search_needed|>
<|search_query|>your optimized search query here<|/search_query|>

If NO search needed, respond normally.`;

                    let decisionResponse = '';
                    await this.aiProvider.sendMessageStream(
                        messages,
                        searchDecisionPrompt,
                        (token) => {
                            decisionResponse += token;
                        }
                    );

                    // Check if search is needed
                    const needsSearch = /<\|search_needed\|>yes<\|\/search_needed\|>/.test(decisionResponse);

                    if (needsSearch) {
                        const queryMatch = decisionResponse.match(/<\|search_query\|>(.*?)<\|\/search_query\|>/);

                        if (queryMatch && queryMatch[1]) {
                            const searchQuery = queryMatch[1].trim();
                            console.log('[ChatService] Performing web search:', searchQuery);

                            // Phase 2: Perform search
                            const searxng = new SearXNGService(searxngConfig.baseUrl);
                            const results = await searxng.search(searchQuery, 5);
                            const searchContext = searxng.formatForContext(results);

                            // Phase 3: Generate final answer with search results
                            const enhancedPrompt = systemPrompt + `\n\nSearch Results for "${searchQuery}":\n\n${searchContext}\n\nUse these search results to answer the user's question accurately.`;

                            let fullResponse = '';
                            await this.aiProvider.sendMessageStream(
                                messages,
                                enhancedPrompt,
                                (token) => {
                                    fullResponse += token;
                                    onToken(token);
                                }
                            );

                            // Save and return
                            const assistantMessage = this.createMessage({
                                role: 'assistant',
                                content: fullResponse,
                            });
                            await this.databaseService.saveMessage(chatId, assistantMessage);
                            return assistantMessage;
                        }
                    }

                    // If no search needed, use the decision response
                    onToken(decisionResponse);
                    const assistantMessage = this.createMessage({
                        role: 'assistant',
                        content: decisionResponse,
                    });
                    await this.databaseService.saveMessage(chatId, assistantMessage);
                    return assistantMessage;

                } catch (searchError) {
                    console.error('[ChatService] Web search error:', searchError);
                    // Fall through to normal chat
                }
            }
        }

        // Normal chat flow (no web search)
        let fullResponse = '';
        await this.aiProvider.sendMessageStream(
            messages,
            systemPrompt,
            (token) => {
                fullResponse += token;
                onToken(token);
            }
        );

        // Create and save assistant message
        const assistantMessage = this.createMessage({
            role: 'assistant',
            content: fullResponse,
        });
        await this.databaseService.saveMessage(chatId, assistantMessage);

        return assistantMessage;
    }
}
