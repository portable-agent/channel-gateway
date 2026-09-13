import type { AgentClient } from '../client/agent-client.js';
import type { Message, ProposalResult } from '../model/message.js';

export class MessageService {
    public constructor(
        private readonly client: AgentClient,
        private readonly connectors: string[],
    ) {}

    public create(message: Message, token: string): Promise<ProposalResult> {
        return this.client.create(
            {
                text: message.text,
                context: {
                    ...message.context,
                    availableConnectors: [...this.connectors],
                },
            },
            token,
            message.requestKey,
        );
    }
}
