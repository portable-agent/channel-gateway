export class ActionError extends Error {
    public constructor() {
        super('Action Service is unavailable');
        this.name = 'ActionError';
    }
}

export class ActionConflict extends Error {
    public constructor() {
        super('Action decision conflicts with saved state');
        this.name = 'ActionConflict';
    }
}
