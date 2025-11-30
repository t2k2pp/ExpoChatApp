/**
 * IndexedDB Adapter for Web
 * Implements IDatabaseStorage using browser's IndexedDB
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { IDatabaseStorage } from './IStorageAdapter';

interface ChatDB extends DBSchema {
    chats: {
        key: string;
        value: {
            id: string;
            title: string;
            created_at: number;
            updated_at: number;
        };
        indexes: { 'by-updated': number };
    };
    messages: {
        key: string;
        value: {
            id: string;
            chat_id: string;
            role: string;
            content: string;
            timestamp: number;
        };
        indexes: { 'by-chat': string };
    };
}

export class IndexedDBAdapter implements IDatabaseStorage {
    private db: IDBPDatabase<ChatDB> | null = null;
    private readonly dbName = 'ChatClientDB';
    private readonly version = 1;

    async initialize(): Promise<void> {
        try {
            this.db = await openDB<ChatDB>(this.dbName, this.version, {
                upgrade(db) {
                    // Create chats store
                    if (!db.objectStoreNames.contains('chats')) {
                        const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
                        chatStore.createIndex('by-updated', 'updated_at');
                    }

                    // Create messages store
                    if (!db.objectStoreNames.contains('messages')) {
                        const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
                        messageStore.createIndex('by-chat', 'chat_id');
                    }
                },
            });
            console.log('IndexedDB initialized successfully');
        } catch (error) {
            console.error('IndexedDB initialization error:', error);
            throw error;
        }
    }

    async query<T>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            // Parse the SQL-like query and execute appropriate IndexedDB operation
            const result = await this.executeQuery(sql, params);
            return result as T[];
        } catch (error) {
            console.error('IndexedDB query error:', error);
            throw error;
        }
    }

    async execute(sql: string, params: any[] = []): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            await this.executeQuery(sql, params);
        } catch (error) {
            console.error('IndexedDB execute error:', error);
            throw error;
        }
    }

    async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            // Execute all queries sequentially
            for (const query of queries) {
                await this.executeQuery(query.sql, query.params || []);
            }
        } catch (error) {
            console.error('IndexedDB transaction error:', error);
            throw error;
        }
    }

    private async executeQuery(sql: string, params: any[]): Promise<any[]> {
        if (!this.db) throw new Error('Database not initialized');

        const sqlUpper = sql.trim().toUpperCase();

        // SELECT queries
        if (sqlUpper.startsWith('SELECT')) {
            if (sql.includes('FROM chats')) {
                return await this.selectChats(sql, params);
            } else if (sql.includes('FROM messages')) {
                return await this.selectMessages(sql, params);
            }
        }

        // INSERT queries
        if (sqlUpper.startsWith('INSERT INTO chats')) {
            await this.insertChat(params);
            return [];
        }

        if (sqlUpper.startsWith('INSERT INTO messages')) {
            await this.insertMessage(params);
            return [];
        }

        // UPDATE queries
        if (sqlUpper.startsWith('UPDATE chats')) {
            await this.updateChat(params);
            return [];
        }

        // DELETE queries
        if (sqlUpper.startsWith('DELETE FROM chats')) {
            await this.deleteChat(params);
            return [];
        }

        if (sqlUpper.startsWith('DELETE FROM messages')) {
            await this.deleteMessages(params);
            return [];
        }

        console.warn('Unhandled SQL query:', sql);
        return [];
    }

    private async selectChats(sql: string, params: any[]): Promise<any[]> {
        const tx = this.db!.transaction('chats', 'readonly');
        const store = tx.objectStore('chats');

        // SELECT * FROM chats WHERE id = ?
        if (sql.includes('WHERE id')) {
            const chat = await store.get(params[0]);
            return chat ? [chat] : [];
        }

        // SELECT * FROM chats ORDER BY updated_at DESC
        const index = store.index('by-updated');
        const chats = await index.getAll();
        return chats.reverse(); // DESC order
    }

    private async selectMessages(sql: string, params: any[]): Promise<any[]> {
        const tx = this.db!.transaction('messages', 'readonly');
        const store = tx.objectStore('messages');

        // SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC
        if (sql.includes('WHERE chat_id')) {
            const index = store.index('by-chat');
            const messages = await index.getAll(params[0]);
            return messages.sort((a, b) => a.timestamp - b.timestamp);
        }

        return [];
    }

    private async insertChat(params: any[]): Promise<void> {
        const [id, title, createdAt, updatedAt] = params;
        await this.db!.put('chats', {
            id,
            title,
            created_at: createdAt,
            updated_at: updatedAt,
        });
    }

    private async insertMessage(params: any[]): Promise<void> {
        const [id, chatId, role, content, timestamp] = params;
        await this.db!.put('messages', {
            id,
            chat_id: chatId,
            role,
            content,
            timestamp,
        });
    }

    private async updateChat(params: any[]): Promise<void> {
        // UPDATE chats SET title = ?, updated_at = ? WHERE id = ?
        const [title, updatedAt, id] = params;
        const chat = await this.db!.get('chats', id);
        if (chat) {
            chat.title = title;
            chat.updated_at = updatedAt;
            await this.db!.put('chats', chat);
        }
    }

    private async deleteChat(params: any[]): Promise<void> {
        const [id] = params;
        await this.db!.delete('chats', id);
    }

    private async deleteMessages(params: any[]): Promise<void> {
        // DELETE FROM messages WHERE chat_id = ?
        const [chatId] = params;
        const tx = this.db!.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');
        const index = store.index('by-chat');
        const messages = await index.getAll(chatId);

        for (const message of messages) {
            await store.delete(message.id);
        }
    }
}
