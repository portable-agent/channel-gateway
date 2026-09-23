import { z } from 'zod';
import type { ActionResult, DecisionCommand } from '../model/action.js';
import type { ActionClient } from './action-client.js';
import { ActionConflict, ActionError } from './action-error.js';

const payloadSchema = z
    .object({
        title: z.string().min(1),
        startAt: z.string().min(1),
        endAt: z.string().min(1),
        timeZone: z.string().min(1),
        description: z.string().optional(),
        attendees: z.array(z.string()).optional(),
    })
    .strict();

const resultSchema = z
    .object({
        id: z.uuid(),
        status: z.enum(['PROPOSED', 'AWAITING_APPROVAL', 'APPROVED', 'EXECUTING', 'SUCCEEDED', 'FAILED', 'CANCELLED']),
        kind: z.string().min(1),
        connector: z.string().min(1),
        payload: payloadSchema,
        payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
        result: z
            .object({ eventId: z.string().min(1) })
            .strict()
            .optional(),
        createdAt: z.string().min(1),
        updatedAt: z.string().min(1),
    })
    .strict();

export class HttpActionClient implements ActionClient {
    public constructor(
        private readonly url: string,
        private readonly timeoutMs: number,
    ) {}

    public async decide(actionId: string, command: DecisionCommand, token: string): Promise<ActionResult> {
        try {
            const response = await fetch(`${this.url}/api/v1/actions/${actionId}/decisions`, {
                method: 'POST',
                headers: {
                    authorization: `Bearer ${token}`,
                    'content-type': 'application/json',
                },
                body: JSON.stringify(command),
                signal: AbortSignal.timeout(this.timeoutMs),
            });
            if (response.status === 409) {
                throw new ActionConflict();
            }
            if (response.status !== 202) {
                throw new ActionError();
            }
            return resultSchema.parse(await response.json()) as ActionResult;
        } catch (error) {
            if (error instanceof ActionConflict || error instanceof ActionError) {
                throw error;
            }
            throw new ActionError();
        }
    }
}
