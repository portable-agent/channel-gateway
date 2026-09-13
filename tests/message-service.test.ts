import { describe, expect, it, vi } from 'vitest';
import type { AgentClient } from '../src/client/agent-client.js';
import { MessageService } from '../src/service/message-service.js';

describe('MessageService', () => {
    it('sends trusted connectors and keeps the request key', async () => {
        const create = vi.fn().mockResolvedValue({ proposal: null, clarification: null });
        const client: AgentClient = { create };
        const service = new MessageService(client, ['fake-calendar']);

        await service.create(
            {
                requestKey: 'message:1',
                text: 'Создай встречу',
                context: { locale: 'ru-RU', timeZone: 'Europe/Moscow' },
            },
            'token',
        );

        expect(create).toHaveBeenCalledWith(
            {
                text: 'Создай встречу',
                context: {
                    locale: 'ru-RU',
                    timeZone: 'Europe/Moscow',
                    availableConnectors: ['fake-calendar'],
                },
            },
            'token',
            'message:1',
        );
    });
});
