import type { ActionResult, DecisionCommand } from '../model/action.js';

export interface ActionClient {
    decide(actionId: string, command: DecisionCommand, token: string): Promise<ActionResult>;
    get(actionId: string, token: string): Promise<ActionResult>;
}
