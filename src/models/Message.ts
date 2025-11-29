/**
 * Message model
 * Represents a single message in a chat conversation
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface CreateMessageDTO {
  role: MessageRole;
  content: string;
}
