import type { operations } from '../generated/channel-api.js';

export type DecisionCommand = operations['decideAction']['requestBody']['content']['application/json'];
export type ActionResult = operations['decideAction']['responses'][202]['content']['application/json'];
export type ActionStatusView = operations['getActionStatus']['responses'][200]['content']['application/json'];
