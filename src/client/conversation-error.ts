export class ConversationError extends Error {
    public constructor() {
        super('Conversation Service request failed');
    }
}
