import { jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';

export interface TokenVerifier {
    verify(token: string): Promise<void>;
}

const uuidText = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const identitySchema = z.object({
    sub: uuidText,
    tenant_id: uuidText,
});

export class OidcTokenVerifier implements TokenVerifier {
    public constructor(
        private readonly issuer: string,
        private readonly audience: string,
        private readonly key: JWTVerifyGetKey,
    ) {}

    public async verify(token: string): Promise<void> {
        const result = await jwtVerify(token, this.key, {
            algorithms: ['RS256'],
            issuer: this.issuer,
            audience: this.audience,
            requiredClaims: ['sub', 'iat', 'exp', 'tenant_id'],
        });
        identitySchema.parse(result.payload);
    }
}
