import { z } from 'zod';

const envSchema = z.object({
    PORT: z.coerce.number().int().min(1).max(65_535).default(8080),
    HOST: z.string().min(1).default('0.0.0.0'),
    AGENT_URL: z.url().transform((url) => url.replace(/\/$/, '')),
    AGENT_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(5000),
    AGENT_AVAILABLE_CONNECTORS: z.string().transform((value, context) => {
        try {
            return z.array(z.string().min(1)).max(100).parse(JSON.parse(value));
        } catch {
            context.addIssue({ code: 'custom', message: 'AGENT_AVAILABLE_CONNECTORS должен быть JSON-массивом.' });
            return z.NEVER;
        }
    }),
    OIDC_ISSUER_URL: z.url(),
    OIDC_JWKS_URL: z.url(),
    OIDC_AUDIENCE: z.string().min(1).default('channel-gateway'),
});

export type Settings = {
    port: number;
    host: string;
    agentUrl: string;
    agentTimeoutMs: number;
    connectors: string[];
    issuer: string;
    jwksUrl: string;
    audience: string;
};

export const readSettings = (env: NodeJS.ProcessEnv): Settings => {
    const value = envSchema.parse(env);
    return {
        port: value.PORT,
        host: value.HOST,
        agentUrl: value.AGENT_URL,
        agentTimeoutMs: value.AGENT_TIMEOUT_MS,
        connectors: value.AGENT_AVAILABLE_CONNECTORS,
        issuer: value.OIDC_ISSUER_URL,
        jwksUrl: value.OIDC_JWKS_URL,
        audience: value.OIDC_AUDIENCE,
    };
};
