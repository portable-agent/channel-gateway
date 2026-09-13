import { z } from 'zod';
import type { AgentMessage, ProposalResult } from '../model/message.js';
import type { AgentClient } from './agent-client.js';
import { AgentError } from './agent-error.js';

const payloadSchema = z
    .object({
        title: z.string(),
        startAt: z.string(),
        endAt: z.string(),
        timeZone: z.string(),
        description: z.string().optional(),
        attendees: z.array(z.string()).optional(),
    })
    .strict();

const proposalSchema = z
    .object({
        proposalId: z.uuid(),
        kind: z.literal('calendar.create_event'),
        connector: z.literal('fake-calendar'),
        payload: payloadSchema,
        explanation: z.string(),
        risk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        requiresApproval: z.literal(true),
    })
    .strict();

const clarificationSchema = z
    .object({
        question: z.string(),
        missingFields: z.array(z.enum(['title', 'startAt', 'endAt', 'timeZone'])),
    })
    .strict();

const resultSchema = z
    .object({
        proposal: proposalSchema.nullable(),
        clarification: clarificationSchema.nullable(),
    })
    .strict();

export class HttpAgentClient implements AgentClient {
    public constructor(
        private readonly url: string,
        private readonly timeoutMs: number,
    ) {}

    public async create(message: AgentMessage, token: string, requestKey: string): Promise<ProposalResult> {
        try {
            const response = await fetch(`${this.url}/api/v1/proposals`, {
                method: 'POST',
                headers: {
                    authorization: `Bearer ${token}`,
                    'content-type': 'application/json',
                    'x-request-key': requestKey,
                },
                body: JSON.stringify(message),
                signal: AbortSignal.timeout(this.timeoutMs),
            });
            if (!response.ok) {
                throw new AgentError();
            }
            return resultSchema.parse(await response.json()) as ProposalResult;
        } catch (error) {
            if (error instanceof AgentError) {
                throw error;
            }
            throw new AgentError();
        }
    }
}
