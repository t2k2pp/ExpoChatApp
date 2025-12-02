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

# 重要指示：Web検索結果の統合と回答生成

あなたは情報統合の専門家です。以下のWeb検索結果を**必ず使用**して、ユーザーの質問に答えてください。

**絶対に守るべきルール：**
1. 「ニュースサイトを見てください」のような回答は禁止
2. 検索結果から具体的な情報を抽出して回答に含める
3. 各ニュースの具体的な内容を要約する
4. ソースを明記する

## ユーザーの質問
${userMessage.content}

## 検索クエリ
${searchQuery}

## Web検索結果（これを必ず使用）
${searchContext}

## 回答形式（この形式に従って必ず出力）

### 要約
今日の主なニュースは以下の通りです。[検索結果から2-3文で具体的に]

### 詳細
[検索結果から得られた各ニュースの具体的な内容を詳しく説明]

例：
1. **[ニュース1のタイトル]**
   - 内容: [具体的な内容]
   - 出典: [URL]

2. **[ニュース2のタイトル]**
   - 内容: [具体的な内容]
   - 出典: [URL]

### 主要なポイント
- [検索結果から抽出したポイント1]
- [検索結果から抽出したポイント2]
- [検索結果から抽出したポイント3]

### 参照ソース
- [ニュース1タイトル](URL1)
- [ニュース2タイトル](URL2)
- [ニュース3タイトル](URL3)

**重要：上記のWeb検索結果に含まれる具体的な情報を必ず使用してください。「ニュースサイトを確認してください」のような回答は不可です。**
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
