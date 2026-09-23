import type { ConversationMessage, ConversationResult } from '../model/message.js';

export interface ConversationClient {
    create(message: ConversationMessage, token: string): Promise<ConversationResult>;
}
