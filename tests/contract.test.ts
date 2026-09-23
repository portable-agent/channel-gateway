import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const hash = async (path: string) => {
    const content = (await readFile(path, 'utf8')).replace(/\r\n/g, '\n');
    return createHash('sha256').update(content).digest('hex');
};

describe('contract snapshots', () => {
    it('uses the exact files from contract bundle 2.4.0', async () => {
        await expect(hash('contracts/channel-gateway-api.yaml')).resolves.toBe(
            '9a6081ed2fea18776387da445ebb75a072be16bc7c6d26ca909c88fd391eed35',
        );
        await expect(hash('contracts/agent-runtime-api.yaml')).resolves.toBe(
            'a05f09df0fdf7933557d899eddfa65a8514f5561de3101e88745dadbb9b165a5',
        );
        await expect(hash('contracts/conversation-api.yaml')).resolves.toBe(
            '5f3e85790f108fc55adb2d6e247a7813943351ea0bc87383ed7c47ff3f44ae8c',
        );
        await expect(hash('schemas/action-confirmation.schema.json')).resolves.toBe(
            'd0352c8685c7a0a7d9a887e80c7db4209defb4da9c8596d7f4bd7981eba6b4b8',
        );
    });
});
