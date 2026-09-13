import type { AgentMessage, ProposalResult } from '../model/message.js';

export interface AgentClient {
    create(message: AgentMessage, token: string, requestKey: string): Promise<ProposalResult>;
}
