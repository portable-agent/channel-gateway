import type { ActionClient } from '../client/action-client.js';
import type { ActionResult, ActionStatusView, DecisionCommand } from '../model/action.js';

export class ActionService {
    public constructor(private readonly client: ActionClient) {}

    public decide(actionId: string, command: DecisionCommand, token: string): Promise<ActionResult> {
        return this.client.decide(actionId, command, token);
    }

    public async getStatus(actionId: string, token: string): Promise<ActionStatusView> {
        const action = await this.client.get(actionId, token);
        return {
            actionId: action.id,
            status: action.status,
            kind: action.kind,
            title: action.payload.title,
        };
    }
}
