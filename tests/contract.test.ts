import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const hash = async (path: string) => {
    const content = (await readFile(path, 'utf8')).replace(/\r\n/g, '\n');
    return createHash('sha256').update(content).digest('hex');
};

describe('contract snapshots', () => {
    it('uses the exact released files from bundle 2.2.0', async () => {
        await expect(hash('contracts/channel-gateway-api.yaml')).resolves.toBe(
            'da60b04bf4b6601da85870d8ac61568bf60fa8630f546a13d873d437a78f8a94',
        );
        await expect(hash('contracts/agent-runtime-api.yaml')).resolves.toBe(
            '0be42b0caf0aaca5b7f0daaa881656f9d6f42ca8106e9a7a02c1333ddbe30766',
        );
    });
});
