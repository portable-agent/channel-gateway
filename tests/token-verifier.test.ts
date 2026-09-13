import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { OidcTokenVerifier } from '../src/config/token-verifier.js';

describe('OidcTokenVerifier', () => {
    const issuer = 'https://identity.test/realms/portable-agent';
    let verifier: OidcTokenVerifier;
    let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];

    beforeAll(async () => {
        const pair = await generateKeyPair('RS256');
        privateKey = pair.privateKey;
        const key = await exportJWK(pair.publicKey);
        verifier = new OidcTokenVerifier(
            issuer,
            'channel-gateway',
            createLocalJWKSet({ keys: [{ ...key, kid: 'test', alg: 'RS256', use: 'sig' }] }),
        );
    });

    const createToken = async (
        audience: string,
        tenantId = '550e8400-e29b-41d4-a716-446655440001',
        subject = '550e8400-e29b-41d4-a716-446655440000',
    ) =>
        new SignJWT({ tenant_id: tenantId })
            .setProtectedHeader({ alg: 'RS256', kid: 'test' })
            .setIssuer(issuer)
            .setAudience(audience)
            .setSubject(subject)
            .setIssuedAt()
            .setExpirationTime('5m')
            .sign(privateKey);

    it('accepts a signed token for this service', async () => {
        await expect(verifier.verify(await createToken('channel-gateway'))).resolves.toBeUndefined();
    });

    it('accepts UUID values used by other platform services', async () => {
        const token = await createToken(
            'channel-gateway',
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
        );

        await expect(verifier.verify(token)).resolves.toBeUndefined();
    });

    it('rejects another audience', async () => {
        await expect(verifier.verify(await createToken('agent-runtime'))).rejects.toThrow();
    });

    it('rejects an invalid tenant id', async () => {
        await expect(verifier.verify(await createToken('channel-gateway', 'unsafe'))).rejects.toThrow();
    });
});
