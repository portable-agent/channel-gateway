import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentError } from '../src/client/agent-error.js';
import { HttpAgentClient } from '../src/client/http-agent-client.js';

describe('HttpAgentClient', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('calls the contract endpoint with token and request key', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ proposal: null, clarification: null }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);
        const client = new HttpAgentClient('http://agent:8080', 1000);
        const message = {
            text: 'Создай встречу',
            context: { locale: 'ru-RU', timeZone: 'Europe/Moscow', availableConnectors: ['fake-calendar'] },
        };

        await expect(client.create(message, 'secret', 'message:1')).resolves.toEqual({
            proposal: null,
            clarification: null,
        });
        expect(fetchMock).toHaveBeenCalledWith(
            'http://agent:8080/api/v1/proposals',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    authorization: 'Bearer secret',
                    'content-type': 'application/json',
                    'x-request-key': 'message:1',
                },
            }),
        );
    });

    it('hides an upstream error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private error', { status: 500 })));
        const client = new HttpAgentClient('http://agent:8080', 1000);

        await expect(
            client.create(
                {
                    text: 'text',
                    context: { locale: 'ru-RU', timeZone: 'Europe/Moscow', availableConnectors: [] },
                },
                'secret',
                'message:1',
            ),
        ).rejects.toBeInstanceOf(AgentError);
    });
});
