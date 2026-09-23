import type { ActionClient } from '../client/action-client.js';
import type { ActionResult, DecisionCommand } from '../model/action.js';

export class ActionService {
    public constructor(private readonly client: ActionClient) {}

    public decide(actionId: string, command: DecisionCommand, token: string): Promise<ActionResult> {
        return this.client.decide(actionId, command, token);
    }
}
