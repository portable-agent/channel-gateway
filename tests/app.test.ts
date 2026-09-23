import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AgentClient } from '../src/client/agent-client.js';
import { AgentError } from '../src/client/agent-error.js';
import type { ConversationClient } from '../src/client/conversation-client.js';
import { ConversationError } from '../src/client/conversation-error.js';
import type { TokenVerifier } from '../src/config/token-verifier.js';
import { buildApp } from '../src/controller/app.js';

const message = {
    requestKey: 'message:1',
    text: 'Создай встречу',
    context: { locale: 'ru-RU', timeZone: 'Europe/Moscow' },
};

describe('app', () => {
    const apps: Array<ReturnType<typeof buildApp>> = [];

    afterEach(async () => {
        await Promise.all(apps.splice(0).map(async (app) => app.close()));
    });

    const createApp = (
        client: AgentClient,
        verifier: TokenVerifier,
        conversationClient: ConversationClient = { create: vi.fn() },
    ) => {
        const app = buildApp({ client, conversationClient, verifier, connectors: ['fake-calendar'] });
        apps.push(app);
        return app;
    };

    it('reports liveness without a token', async () => {
        const client: AgentClient = { create: vi.fn() };
        const verifier: TokenVerifier = { verify: vi.fn() };
        const app = createApp(client, verifier);

        const response = await app.inject({ method: 'GET', url: '/health/live' });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ status: 'UP' });
    });

    it('returns the Agent Runtime result', async () => {
        const result = { proposal: null, clarification: { question: 'Когда?', missingFields: ['startAt'] } };
        const client: AgentClient = { create: vi.fn().mockResolvedValue(result) };
        const verifier: TokenVerifier = { verify: vi.fn().mockResolvedValue(undefined) };
        const app = createApp(client, verifier);

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/messages',
            headers: { authorization: 'Bearer token' },
            payload: message,
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual(result);
    });

    it('rejects identity in JSON', async () => {
        const create = vi.fn();
        const client: AgentClient = { create };
        const verifier: TokenVerifier = { verify: vi.fn().mockResolvedValue(undefined) };
        const app = createApp(client, verifier);

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/messages',
            headers: { authorization: 'Bearer token' },
            payload: { ...message, userId: 'unsafe' },
        });

        expect(response.statusCode).toBe(422);
        expect(create).not.toHaveBeenCalled();
    });

    it('requires a verified bearer token', async () => {
        const client: AgentClient = { create: vi.fn() };
        const verify = vi.fn();
        const verifier: TokenVerifier = { verify };
        const app = createApp(client, verifier);

        const response = await app.inject({ method: 'POST', url: '/api/v1/messages', payload: message });

        expect(response.statusCode).toBe(401);
        expect(verify).not.toHaveBeenCalled();
    });

    it('returns a safe error when Agent Runtime is unavailable', async () => {
        const client: AgentClient = { create: vi.fn().mockRejectedValue(new AgentError()) };
        const verifier: TokenVerifier = { verify: vi.fn().mockResolvedValue(undefined) };
        const app = createApp(client, verifier);

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/messages',
            headers: { authorization: 'Bearer token' },
            payload: message,
        });

        expect(response.statusCode).toBe(502);
        expect(response.json()).toEqual({ detail: 'Agent Runtime временно недоступен.' });
    });

    it('returns the Conversation Service result from the conversation route', async () => {
        const result = {
            messageId: '10000000-0000-4000-8000-000000000001',
            conversationId: '10000000-0000-4000-8000-000000000002',
            reply: { type: 'text' as const, text: 'Когда начать?' },
        };
        const create = vi.fn().mockResolvedValue(result);
        const conversationClient: ConversationClient = { create };
        const verifier: TokenVerifier = { verify: vi.fn().mockResolvedValue(undefined) };
        const app = createApp({ create: vi.fn() }, verifier, conversationClient);

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/conversations/messages',
            headers: { authorization: 'Bearer token' },
            payload: { ...message, conversationId: result.conversationId },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual(result);
        expect(create).toHaveBeenCalledWith({ ...message, conversationId: result.conversationId }, 'token');
    });

    it('returns a safe error when Conversation Service is unavailable', async () => {
        const conversationClient: ConversationClient = {
            create: vi.fn().mockRejectedValue(new ConversationError()),
        };
        const verifier: TokenVerifier = { verify: vi.fn().mockResolvedValue(undefined) };
        const app = createApp({ create: vi.fn() }, verifier, conversationClient);

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/conversations/messages',
            headers: { authorization: 'Bearer token' },
            payload: message,
        });

        expect(response.statusCode).toBe(502);
        expect(response.json()).toEqual({ detail: 'Conversation Service временно недоступен.' });
    });

    it('requires a token for the conversation route', async () => {
        const verify = vi.fn();
        const app = createApp({ create: vi.fn() }, { verify });

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/conversations/messages',
            payload: message,
        });

        expect(response.statusCode).toBe(401);
        expect(verify).not.toHaveBeenCalled();
    });

    it('rejects an invalid token on the conversation route', async () => {
        const verifier: TokenVerifier = { verify: vi.fn().mockRejectedValue(new Error('invalid')) };
        const app = createApp({ create: vi.fn() }, verifier);

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/conversations/messages',
            headers: { authorization: 'Bearer token' },
            payload: message,
        });

        expect(response.statusCode).toBe(401);
    });

    it('rejects an invalid conversation message', async () => {
        const create = vi.fn();
        const verifier: TokenVerifier = { verify: vi.fn().mockResolvedValue(undefined) };
        const app = createApp({ create: vi.fn() }, verifier, { create });

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/conversations/messages',
            headers: { authorization: 'Bearer token' },
            payload: { ...message, conversationId: 'not-a-uuid' },
        });

        expect(response.statusCode).toBe(422);
        expect(create).not.toHaveBeenCalled();
    });
});
