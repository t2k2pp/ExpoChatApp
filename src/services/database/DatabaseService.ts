/**
 * Database Service 
 * Manages SQLite database operations for chat history
 */

import * as SQLite from 'expo-sqlite';
import { Chat, Message, CreateChatDTO } from '../../models';
import { DATABASE_NAME, CREATE_TABLES_SQL } from './schema';

export class DatabaseService {
    private static instance: DatabaseService;
    private db: SQLite.SQLiteDatabase | null = null;
    private initialized: boolean = false;

    private constructor() { }

    static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    async initDatabase(): Promise<void> {
        if (this.initialized) return;

        try {
            this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
            await this.db.execAsync(CREATE_TABLES_SQL);
            this.initialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    private ensureInitialized(): SQLite.SQLiteDatabase {
        if (!this.db || !this.initialized) {
            throw new Error(
                'Database not initialized. Call initDatabase() first.'
            );
        }
        return this.db;
    }

    async createChat(dto: CreateChatDTO): Promise<Chat> {
        const db = this.ensureInitialized();
        const now = Date.now();

        try {
            const result = await db.runAsync(
                'INSERT INTO chats (title, created_at, updated_at) VALUES (?, ?, ?)',
                [dto.title, now, now]
            );

            return {
                id: result.lastInsertRowId,
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
        const db = this.ensureInitialized();

        try {
            const rows = await db.getAllAsync<Chat>(
                'SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM chats ORDER BY updated_at DESC'
            );
            return rows;
        } catch (error) {
            console.error('Failed to get all chats:', error);
            throw error;
        }
    }

    async getChat(chatId: number): Promise<Chat | null> {
        const db = this.ensureInitialized();

        try {
            const chat = await db.getFirstAsync<Chat>(
                'SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM chats WHERE id = ?',
                [chatId]
            );
            return chat || null;
        } catch (error) {
            console.error('Failed to get chat:', error);
            throw error;
        }
    }

    async updateChatTitle(chatId: number, title: string): Promise<void> {
        const db = this.ensureInitialized();

        try {
            await db.runAsync(
                'UPDATE chats SET title = ?, updated_at = ? WHERE id = ?',
                [title, Date.now(), chatId]
            );
        } catch (error) {
            console.error('Failed to update chat title:', error);
            throw error;
        }
    }

    async deleteChat(chatId: number): Promise<void> {
        const db = this.ensureInitialized();

        try {
            await db.runAsync('DELETE FROM chats WHERE id = ?', [chatId]);
        } catch (error) {
            console.error('Failed to delete chat:', error);
            throw error;
        }
    }

    async saveMessage(chatId: number, message: Message): Promise<void> {
        const db = this.ensureInitialized();

        try {
            await db.runAsync(
                'INSERT INTO messages (id, chat_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)',
                [message.id, chatId, message.role, message.content, message.timestamp]
            );

            // Update chat's updated_at timestamp
            await db.runAsync(
                'UPDATE chats SET updated_at = ? WHERE id = ?',
                [message.timestamp, chatId]
            );
        } catch (error) {
            console.error('Failed to save message:', error);
            throw error;
        }
    }

    async getChatMessages(chatId: number): Promise<Message[]> {
        const db = this.ensureInitialized();

        try {
            const rows = await db.getAllAsync<Message>(
                'SELECT id, role, content, timestamp FROM messages WHERE chat_id = ? ORDER BY timestamp ASC',
                [chatId]
            );
            return rows;
        } catch (error) {
            console.error('Failed to get chat messages:', error);
            throw error;
        }
    }

    async searchChats(query: string): Promise<Chat[]> {
        const db = this.ensureInitialized();

        try {
            const rows = await db.getAllAsync<Chat>(
                `SELECT DISTINCT c.id, c.title, c.created_at as createdAt, c.updated_at as updatedAt 
         FROM chats c 
         LEFT JOIN messages m ON c.id = m.chat_id 
         WHERE c.title LIKE ? OR m.content LIKE ? 
         ORDER BY c.updated_at DESC`,
                [`%${query}%`, `%${query}%`]
            );
            return rows;
        } catch (error) {
            console.error('Failed to search chats:', error);
            throw error;
        }
    }
}
