import helmet from '@fastify/helmet';
import Fastify from 'fastify';
import { z } from 'zod';
import type { AgentClient } from '../client/agent-client.js';
import { AgentError } from '../client/agent-error.js';
import type { ActionClient } from '../client/action-client.js';
import { ActionConflict, ActionError } from '../client/action-error.js';
import type { ConversationClient } from '../client/conversation-client.js';
import { ConversationError } from '../client/conversation-error.js';
import type { TokenVerifier } from '../config/token-verifier.js';
import type { ConversationMessage } from '../model/message.js';
import { MessageService } from '../service/message-service.js';
import { ConversationService } from '../service/conversation-service.js';
import { ActionService } from '../service/action-service.js';

const contextSchema = z
    .object({
        locale: z.string().min(2).max(16),
        timeZone: z
            .string()
            .min(1)
            .max(100)
            .regex(/^(UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+)$/),
    })
    .strict();

const messageSchema = z
    .object({
        requestKey: z
            .string()
            .min(1)
            .max(200)
            .regex(/^[A-Za-z0-9._:-]+$/),
        text: z.string().min(1).max(10_000),
        context: contextSchema,
    })
    .strict();

const conversationMessageSchema = messageSchema.extend({ conversationId: z.uuid().optional() }).strict();

const decisionSchema = z
    .object({
        decision: z.enum(['CONFIRM', 'CANCEL']),
        payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict();

const actionParamsSchema = z.object({ actionId: z.uuid() }).strict();

type AppOptions = {
    client: AgentClient;
    conversationClient: ConversationClient;
    actionClient: ActionClient;
    verifier: TokenVerifier;
    connectors: string[];
    logger?: boolean;
};

const readToken = (authorization: string | undefined): string | null => {
    const match = authorization?.match(/^Bearer ([^ ]+)$/);
    return match?.[1] ?? null;
};

export const buildApp = ({ client, conversationClient, actionClient, verifier, connectors, logger }: AppOptions) => {
    const app = Fastify({
        bodyLimit: 16 * 1024,
        requestTimeout: 10_000,
        logger: logger ?? false,
    });
    const service = new MessageService(client, connectors);
    const conversationService = new ConversationService(conversationClient);
    const actionService = new ActionService(actionClient);

    void app.register(helmet);
    app.get('/health/live', () => ({ status: 'UP' }));
    app.post('/api/v1/messages', async (request, reply) => {
        const token = readToken(request.headers.authorization);
        if (!token) {
            return reply.code(401).send();
        }
        try {
            await verifier.verify(token);
        } catch {
            return reply.code(401).send();
        }

        const parsed = messageSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(422).send({ detail: 'Запрос не соответствует контракту.' });
        }

        try {
            const result = await service.create(parsed.data, token);
            return reply.code(200).send(result);
        } catch (error) {
            if (error instanceof AgentError) {
                return reply.code(502).send({ detail: 'Agent Runtime временно недоступен.' });
            }
            throw error;
        }
    });
    app.post('/api/v1/conversations/messages', async (request, reply) => {
        const token = readToken(request.headers.authorization);
        if (!token) {
            return reply.code(401).send();
        }
        try {
            await verifier.verify(token);
        } catch {
            return reply.code(401).send();
        }

        const parsed = conversationMessageSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(422).send({ detail: 'Запрос не соответствует контракту.' });
        }

        try {
            const message: ConversationMessage = parsed.data.conversationId
                ? { ...parsed.data, conversationId: parsed.data.conversationId }
                : { requestKey: parsed.data.requestKey, text: parsed.data.text, context: parsed.data.context };
            const result = await conversationService.create(message, token);
            return reply.code(200).send(result);
        } catch (error) {
            if (error instanceof ConversationError) {
                return reply.code(502).send({ detail: 'Conversation Service временно недоступен.' });
            }
            throw error;
        }
    });
    app.post('/api/v1/actions/:actionId/decisions', async (request, reply) => {
        const token = readToken(request.headers.authorization);
        if (!token) {
            return reply.code(401).send();
        }
        try {
            await verifier.verify(token);
        } catch {
            return reply.code(401).send();
        }

        const params = actionParamsSchema.safeParse(request.params);
        const command = decisionSchema.safeParse(request.body);
        if (!params.success || !command.success) {
            return reply.code(422).send({ detail: 'Запрос не соответствует контракту.' });
        }

        try {
            const result = await actionService.decide(params.data.actionId, command.data, token);
            return reply.code(202).send(result);
        } catch (error) {
            if (error instanceof ActionConflict) {
                return reply.code(409).send({ detail: 'Решение конфликтует с состоянием действия.' });
            }
            if (error instanceof ActionError) {
                return reply.code(502).send({ detail: 'Action Service временно недоступен.' });
            }
            throw error;
        }
    });

    return app;
};
