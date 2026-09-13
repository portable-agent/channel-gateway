import { createRemoteJWKSet } from 'jose';
import { HttpAgentClient } from './client/http-agent-client.js';
import { readSettings } from './config/settings.js';
import { OidcTokenVerifier } from './config/token-verifier.js';
import { buildApp } from './controller/app.js';

const settings = readSettings(process.env);
const app = buildApp({
    client: new HttpAgentClient(settings.agentUrl, settings.agentTimeoutMs),
    verifier: new OidcTokenVerifier(settings.issuer, settings.audience, createRemoteJWKSet(new URL(settings.jwksUrl))),
    connectors: settings.connectors,
    logger: true,
});

const stop = async () => {
    await app.close();
    process.exit(0);
};

process.once('SIGINT', () => void stop());
process.once('SIGTERM', () => void stop());

await app.listen({ port: settings.port, host: settings.host });
