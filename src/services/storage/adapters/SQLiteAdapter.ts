/**
 * SQLite Adapter for Native Platforms (iOS/Android)
 * Implements IDatabaseStorage using expo-sqlite
 */

import * as SQLite from 'expo-sqlite';
import { IDatabaseStorage } from './IStorageAdapter';

export class SQLiteAdapter implements IDatabaseStorage {
    private db: SQLite.SQLiteDatabase | null = null;
    private readonly dbName = 'chat.db';

    async initialize(): Promise<void> {
        try {
            this.db = await SQLite.openDatabaseAsync(this.dbName);

            // Create tables
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS chats (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    chat_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
                CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
            `);

            console.log('SQLite Database initialized successfully');
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    async query<T>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            const result = await this.db.getAllAsync<T>(sql, params);
            return result;
        } catch (error) {
            console.error('SQLite query error:', error);
            throw error;
        }
    }

    async execute(sql: string, params: any[] = []): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            await this.db.runAsync(sql, params);
        } catch (error) {
            console.error('SQLite execute error:', error);
            throw error;
        }
    }

    async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            await this.db.withTransactionAsync(async () => {
                for (const query of queries) {
                    await this.db!.runAsync(query.sql, query.params || []);
                }
            });
        } catch (error) {
            console.error('SQLite transaction error:', error);
            throw error;
        }
    }
}
