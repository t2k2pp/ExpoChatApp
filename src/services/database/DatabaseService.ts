/**
 * Database Service 
 * Manages database operations for chat history using platform-specific adapters
 */

import { Chat, Message, CreateChatDTO } from '../../models';
import { IDatabaseStorage, SQLiteAdapter, IndexedDBAdapter } from '../storage/adapters';
import { isWeb } from '../../utils/platformUtils';

export class DatabaseService {
    private static instance: DatabaseService;
    private adapter: IDatabaseStorage;
    private initialized: boolean = false;

    private constructor() {
        // Select adapter based on platform
        this.adapter = isWeb() ? new IndexedDBAdapter() : new SQLiteAdapter();
    }

    static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    async initDatabase(): Promise<void> {
        if (this.initialized) return;

        try {
            await this.adapter.initialize();
            this.initialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error(
                'Database not initialized. Call initDatabase() first.'
            );
        }
    }

    async createChat(dto: CreateChatDTO): Promise<Chat> {
        this.ensureInitialized();
        const now = Date.now();
        const id = `chat_${now}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            await this.adapter.execute(
                'INSERT INTO chats (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
                [id, dto.title, now, now]
            );

            return {
                id,
                title: dto.title,
                createdAt: now,
                updatedAt: now,
            };
        } catch (error) {
            console.error('Failed to create chat:', error);
            throw error;
        }
    }

    async getAllChats(): Promise<Chat[]> {
        this.ensureInitialized();

        try {
            const rows = await this.adapter.query<any>(
                'SELECT * FROM chats ORDER BY updated_at DESC'
            );

            return rows.map(row => ({
                id: row.id,
                title: row.title,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));
        } catch (error) {
            console.error('Failed to get all chats:', error);
            throw error;
        }
    }

    async getChat(chatId: string): Promise<Chat | null> {
        this.ensureInitialized();

        try {
            const rows = await this.adapter.query<any>(
                'SELECT * FROM chats WHERE id = ?',
                [chatId]
            );

            if (rows.length === 0) return null;

            const row = rows[0];
            return {
                id: row.id,
                title: row.title,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        } catch (error) {
            console.error('Failed to get chat:', error);
            throw error;
        }
    }

    async updateChatTitle(chatId: string, title: string): Promise<void> {
        this.ensureInitialized();

        try {
            await this.adapter.execute(
                'UPDATE chats SET title = ?, updated_at = ? WHERE id = ?',
                [title, Date.now(), chatId]
            );
        } catch (error) {
            console.error('Failed to update chat title:', error);
            throw error;
        }
    }

    async deleteChat(chatId: string): Promise<void> {
        this.ensureInitialized();

        try {
            // Delete messages first
            await this.adapter.execute('DELETE FROM messages WHERE chat_id = ?', [chatId]);
            // Then delete chat
            await this.adapter.execute('DELETE FROM chats WHERE id = ?', [chatId]);
        } catch (error) {
            console.error('Failed to delete chat:', error);
            throw error;
        }
    }

    async saveMessage(chatId: string, message: Message): Promise<void> {
        this.ensureInitialized();

        try {
            await this.adapter.transaction([
                {
                    sql: 'INSERT INTO messages (id, chat_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)',
                    params: [message.id, chatId, message.role, message.content, message.timestamp],
                },
                {
                    sql: 'UPDATE chats SET updated_at = ? WHERE id = ?',
                    params: [message.timestamp, chatId],
                },
            ]);
        } catch (error) {
            console.error('Failed to save message:', error);
            throw error;
        }
    }

    async getChatMessages(chatId: string): Promise<Message[]> {
        this.ensureInitialized();

        try {
            const rows = await this.adapter.query<any>(
                'SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC',
                [chatId]
            );

            return rows.map(row => ({
                id: row.id,
                role: row.role,
                content: row.content,
                timestamp: row.timestamp,
            }));
        } catch (error) {
            console.error('Failed to get chat messages:', error);
            throw error;
        }
    }

    async searchChats(query: string): Promise<Chat[]> {
        this.ensureInitialized();

        try {
            // Simplified search for cross-platform compatibility
            const chats = await this.getAllChats();
            return chats.filter(chat =>
                chat.title.toLowerCase().includes(query.toLowerCase())
            );
        } catch (error) {
            console.error('Failed to search chats:', error);
            throw error;
        }
    }
}
