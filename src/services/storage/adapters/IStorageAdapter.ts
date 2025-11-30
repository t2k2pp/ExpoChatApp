/**
 * Storage Adapter Interfaces
 * Defines contracts for key-value storage adapters across platforms
 */

export interface IKeyValueStorage {
    /**
     * Get a value by key
     */
    getItem(key: string): Promise<string | null>;

    /**
     * Set a value for a key
     */
    setItem(key: string, value: string): Promise<void>;

    /**
     * Remove a key
     */
    removeItem(key: string): Promise<void>;

    /**
     * Clear all keys
     */
    clear(): Promise<void>;

    /**
     * Get all keys
     */
    getAllKeys(): Promise<string[]>;
}

export interface IDatabaseStorage {
    /**
     * Initialize the database
     */
    initialize(): Promise<void>;

    /**
     * Execute a query that returns results
     */
    query<T>(sql: string, params?: any[]): Promise<T[]>;

    /**
     * Execute a query that doesn't return results (INSERT, UPDATE, DELETE)
     */
    execute(sql: string, params?: any[]): Promise<void>;

    /**
     * Execute multiple queries in a transaction
     */
    transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<void>;
}
