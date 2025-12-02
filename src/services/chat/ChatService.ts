/**
 * Chat Service
 * Orchestrates AI provider and database operations for chat functionality
 */

import { v4 as uuidv4 } from 'uuid';
import { Message, CreateMessageDTO, Chat, CreateChatDTO } from '../../models';
import { AIProvider } from '../../providers';
import { DatabaseService } from '../database';
import { StorageService } from '../storage';
import { SearXNGService } from '../search';

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

        // Get chat history and ensure new message is included
        const previousMessages = await this.databaseService.getChatMessages(chatId);
        const messages = previousMessages.some(m => m.id === message.id)
            ? previousMessages
            : [...previousMessages, message];
        const systemPrompt = await this.storageService.getSystemPrompt();

        console.log('[ChatService] Sending to LLM:', {
            messageCount: messages.length,
            lastMessage: messages[messages.length - 1],
            webSearchEnabled,
        });

        // Web Search Integration (Agentic Approach)
        if (webSearchEnabled) {
            console.log('[ChatService] Web search is ENABLED by user toggle');
            const searxngConfig = await this.storageService.getSearXNGConfig();
            console.log('[ChatService] SearXNG config:', searxngConfig);

            if (searxngConfig.enabled) {
                console.log('[ChatService] SearXNG is enabled in settings, starting search flow');
                try {
                    // Phase 1: Ask LLM if search is needed
                    const searchDecisionPrompt = systemPrompt + `\n\nWeb Search Available: You can search the web for current information.

IMPORTANT: If the user explicitly asks to search the web (e.g., "search for...", "look up online...", "今日のニュース"), you MUST use web search.

Analyze the user's question and decide:
1. Does this require current/real-time information?
2. Did the user explicitly request a web search?
3. Can you answer with your existing knowledge?

If search is needed, respond ONLY with:
<|search_needed|>yes</|/search_needed|>
<|search_query|>your optimized search query here</|/search_query|>

If NO search needed, respond normally.`;

                    let decisionResponse = '';
                    await this.aiProvider.sendMessageStream(
                        messages,
                        searchDecisionPrompt,
                        (token: string) => {
                            decisionResponse += token;
                        }
                    );

                    console.log('[ChatService] LLM decision response:', decisionResponse.substring(0, 200));

                    // Check if search is needed
                    const needsSearch = true; // TEMP FIX: LLMがタグを正しく生成できないため常に検索
                    console.log('[ChatService] Search needed?', needsSearch);

                    if (needsSearch) {
                        //const queryMatch = decisionResponse.match(/<\|search_query\|>(.*?)<\|\/search_query\|>/);

                        //if (queryMatch && queryMatch[1]) {
                        const searchQuery = userMessage.content; // ユーザーの質問をそのまま使用
                        console.log('[ChatService] Performing web search:', searchQuery);

                        // Phase 2: Perform search
                        const searxng = new SearXNGService(searxngConfig.baseUrl);
                        const results = await searxng.search(searchQuery, 5);
                        const searchContext = searxng.formatForContext(results);

                        // Phase 3: Generate final answer with search results
                        const enhancedPrompt = systemPrompt + `

# Web検索結果を使用した回答生成

あなたは情報統合の専門家です。以下のWeb検索結果を使用して、ユーザーの質問に正確に答えてください。

## ユーザーの質問
${userMessage.content}

## Web検索クエリ
${searchQuery}

## 検索結果
${searchContext}

## 回答の要件
1. すべての重要な情報を含める
2. 各情報のソースを明記する
3. 矛盾する情報がある場合は両方を提示
4. 簡潔で分かりやすく説明
5. 以下の形式で構造化して出力する

## 出力形式
### 要約
[質問に対する簡潔な回答（2-3文）]

### 詳細
[詳細な説明。検索結果から得られた具体的な情報を含める]

### 主要なポイント
- ポイント1
- ポイント2
- ポイント3

### 参照ソース
- [タイトル1](URL1)
- [タイトル2](URL2)

上記のWeb検索結果を活用して、ユーザーの質問に構造化された回答を提供してください。
`;

                        let fullResponse = '';
                        await this.aiProvider.sendMessageStream(
                            messages,
                            enhancedPrompt,
                            (token: string) => {
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

                    // If no search needed, use the decision response
                    console.log('[ChatService] No search needed, using LLM response directly');
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
            } else {
                console.log('[ChatService] SearXNG is DISABLED in settings, skipping search');
            }
        } else {
            console.log('[ChatService] Web search toggle is OFF');
        }

        // Normal chat flow (no web search)
        let fullResponse = '';
        await this.aiProvider.sendMessageStream(
            messages,
            systemPrompt,
            (token: string) => {
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
