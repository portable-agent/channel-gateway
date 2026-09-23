import { describe, expect, it } from 'vitest';
import { readSettings } from '../src/config/settings.js';

const env = {
    PORT: '8080',
    HOST: '127.0.0.1',
    AGENT_URL: 'http://agent:8080',
    AGENT_TIMEOUT_MS: '5000',
    AGENT_AVAILABLE_CONNECTORS: '["fake-calendar"]',
    CONVERSATION_URL: 'http://conversation:8080',
    CONVERSATION_TIMEOUT_MS: '10000',
    OIDC_ISSUER_URL: 'http://keycloak:8080/realms/portable-agent',
    OIDC_JWKS_URL: 'http://keycloak:8080/realms/portable-agent/protocol/openid-connect/certs',
    OIDC_AUDIENCE: 'channel-gateway',
};

describe('readSettings', () => {
    it('reads explicit settings', () => {
        expect(readSettings(env)).toEqual({
            port: 8080,
            host: '127.0.0.1',
            agentUrl: 'http://agent:8080',
            agentTimeoutMs: 5000,
            connectors: ['fake-calendar'],
            conversationUrl: 'http://conversation:8080',
            conversationTimeoutMs: 10000,
            issuer: env.OIDC_ISSUER_URL,
            jwksUrl: env.OIDC_JWKS_URL,
            audience: 'channel-gateway',
        });
    });

    it('rejects invalid connector JSON', () => {
        expect(() => readSettings({ ...env, AGENT_AVAILABLE_CONNECTORS: 'fake-calendar' })).toThrow();
    });
});
