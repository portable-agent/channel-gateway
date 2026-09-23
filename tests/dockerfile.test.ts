import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('Docker build context', () => {
    it('does not ignore sources copied by the build stage', async () => {
        const dockerfile = await readFile('Dockerfile', 'utf8');
        const ignored = (await readFile('.dockerignore', 'utf8')).split(/\r?\n/);

        for (const name of ['contracts', 'schemas', 'src', 'tests']) {
            expect(dockerfile).toContain(`COPY ${name} ./` + name);
            expect(ignored).not.toContain(name);
        }
    });
});
