import type { ActionResult, DecisionCommand } from '../model/action.js';

export interface ActionClient {
    decide(actionId: string, command: DecisionCommand, token: string): Promise<ActionResult>;
}
