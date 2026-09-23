import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpActionClient } from '../src/client/http-action-client.js';
import { ActionConflict, ActionError } from '../src/client/action-error.js';

describe('HttpActionClient', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sends the widget decision with the original token', async () => {
        const result = {
            id: '10000000-0000-4000-8000-000000000003',
            status: 'APPROVED',
            kind: 'calendar.create_event',
            connector: 'fake-calendar',
            payload: {
                title: 'Встреча',
                startAt: '2030-09-08T12:00:00+03:00',
                endAt: '2030-09-08T12:30:00+03:00',
                timeZone: 'Europe/Moscow',
            },
            payloadHash: 'a'.repeat(64),
            createdAt: '2030-09-01T10:00:00Z',
            updatedAt: '2030-09-01T10:01:00Z',
        };
        const fetchMock = vi.fn().mockResolvedValue(Response.json(result, { status: 202 }));
        vi.stubGlobal('fetch', fetchMock);
        const client = new HttpActionClient('http://action:8080', 1000);
        const command = { decision: 'CONFIRM' as const, payloadHash: 'a'.repeat(64) };

        await expect(client.decide(result.id, command, 'user-token')).resolves.toEqual(result);
        expect(fetchMock).toHaveBeenCalledWith(
            `http://action:8080/api/v1/actions/${result.id}/decisions`,
            expect.objectContaining({
                method: 'POST',
                headers: {
                    authorization: 'Bearer user-token',
                    'content-type': 'application/json',
                },
                body: JSON.stringify(command),
            }),
        );
    });

    it('maps a conflict without exposing its body', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private payload', { status: 409 })));
        const client = new HttpActionClient('http://action:8080', 1000);

        await expect(
            client.decide(
                '10000000-0000-4000-8000-000000000003',
                { decision: 'CONFIRM', payloadHash: 'a'.repeat(64) },
                'user-token',
            ),
        ).rejects.toBeInstanceOf(ActionConflict);
    });

    it('hides a network error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private network error')));
        const client = new HttpActionClient('http://action:8080', 1000);

        await expect(
            client.decide(
                '10000000-0000-4000-8000-000000000003',
                { decision: 'CANCEL', payloadHash: 'a'.repeat(64) },
                'user-token',
            ),
        ).rejects.toBeInstanceOf(ActionError);
    });
});
