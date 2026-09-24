import { z } from 'zod';
import type { ConversationMessage, ConversationResult } from '../model/message.js';
import type { ConversationClient } from './conversation-client.js';
import { ConversationError } from './conversation-error.js';

const fieldSchema = z
    .object({
        label: z.string().min(1),
        value: z.string().min(1),
        sensitive: z.boolean().default(false),
    })
    .strict();

const actionSchema = z
    .object({
        id: z.enum(['confirm', 'cancel']),
        label: z.string().min(1),
    })
    .strict();

const cardSchema = z
    .object({
        schemaVersion: z.literal(1),
        widget: z.literal('action_confirmation'),
        actionId: z.uuid(),
        payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
        title: z.string().min(1),
        fields: z.array(fieldSchema).min(1),
        actions: z.array(actionSchema).min(2),
    })
    .strict();

const resultSchema = z
    .object({
        messageId: z.uuid(),
        conversationId: z.uuid(),
        reply: z.discriminatedUnion('type', [
            z.object({ type: z.literal('text'), text: z.string().min(1) }).strict(),
            z.object({ type: z.literal('confirmation'), card: cardSchema }).strict(),
        ]),
    })
    .strict();

export class HttpConversationClient implements ConversationClient {
    public constructor(
        private readonly url: string,
        private readonly timeoutMs: number,
    ) {}

    public async create(message: ConversationMessage, token: string): Promise<ConversationResult> {
        try {
            const response = await fetch(`${this.url}/api/v1/messages`, {
                method: 'POST',
                headers: {
                    authorization: `Bearer ${token}`,
                    'content-type': 'application/json',
                },
                body: JSON.stringify(message),
                signal: AbortSignal.timeout(this.timeoutMs),
            });
            if (!response.ok) {
                throw new ConversationError();
            }
            return resultSchema.parse(await response.json());
        } catch (error) {
            if (error instanceof ConversationError) {
                throw error;
            }
            throw new ConversationError();
        }
    }
}
