import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConversationError } from '../src/client/conversation-error.js';
import { HttpConversationClient } from '../src/client/http-conversation-client.js';

describe('HttpConversationClient', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('calls Conversation Service with the original token and message', async () => {
        const result = {
            messageId: '10000000-0000-4000-8000-000000000001',
            conversationId: '10000000-0000-4000-8000-000000000002',
            reply: { type: 'text', text: 'Когда начать?' },
        };
        const fetchMock = vi.fn().mockResolvedValue(Response.json(result));
        vi.stubGlobal('fetch', fetchMock);
        const client = new HttpConversationClient('http://conversation:8080', 1000);
        const message = {
            requestKey: 'message:1',
            text: 'Создай встречу',
            context: { locale: 'ru-RU', timeZone: 'Europe/Moscow' },
        };

        await expect(client.create(message, 'user-token')).resolves.toEqual(result);
        expect(fetchMock).toHaveBeenCalledWith(
            'http://conversation:8080/api/v1/messages',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    authorization: 'Bearer user-token',
                    'content-type': 'application/json',
                },
                body: JSON.stringify(message),
            }),
        );
    });

    it('hides a dependency error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private error', { status: 500 })));
        const client = new HttpConversationClient('http://conversation:8080', 1000);

        await expect(
            client.create(
                {
                    requestKey: 'message:1',
                    text: 'Создай встречу',
                    context: { locale: 'ru-RU', timeZone: 'Europe/Moscow' },
                },
                'user-token',
            ),
        ).rejects.toBeInstanceOf(ConversationError);
    });

    it('hides a network error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private network error')));
        const client = new HttpConversationClient('http://conversation:8080', 1000);

        await expect(
            client.create(
                {
                    requestKey: 'message:1',
                    text: 'Создай встречу',
                    context: { locale: 'ru-RU', timeZone: 'Europe/Moscow' },
                },
                'user-token',
            ),
        ).rejects.toBeInstanceOf(ConversationError);
    });
});
