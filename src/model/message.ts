import type { operations } from '../generated/channel-api.js';

export type Message = operations['createMessage']['requestBody']['content']['application/json'];
export type MessageContext = Message['context'];

export type AgentMessage = {
    text: string;
    context: MessageContext & {
        availableConnectors: string[];
    };
};

export type ProposalResult = operations['createMessage']['responses'][200]['content']['application/json'];
