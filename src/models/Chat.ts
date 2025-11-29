/**
 * Chat model
 * Represents a chat conversation with messages
 */

import { Message } from './Message';

export interface Chat {
    id: number;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages?: Message[];
}

export interface CreateChatDTO {
    title: string;
}
