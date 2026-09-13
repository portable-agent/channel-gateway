export class AgentError extends Error {
    public constructor() {
        super('Agent Runtime request failed');
        this.name = 'AgentError';
    }
}
