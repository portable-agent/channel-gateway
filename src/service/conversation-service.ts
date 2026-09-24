import type { ConversationClient } from '../client/conversation-client.js';
import type { ConversationMessage, ConversationResult } from '../model/message.js';

export class ConversationService {
    public constructor(private readonly client: ConversationClient) {}

    public create(message: ConversationMessage, token: string): Promise<ConversationResult> {
        return this.client.create(message, token);
    }
}
