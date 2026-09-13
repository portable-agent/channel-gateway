import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AgentClient } from '../src/client/agent-client.js';
import { AgentError } from '../src/client/agent-error.js';
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

    const createApp = (client: AgentClient, verifier: TokenVerifier) => {
        const app = buildApp({ client, verifier, connectors: ['fake-calendar'] });
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
});
