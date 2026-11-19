import { expect, test } from 'bun:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LOCK_FILE, sync } from '../src/sync.ts';

test('topic without imports is a no-op (no lock file, no network)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skillset-sync-'));
  await writeFile(join(dir, 'skillset.json'), '{"imports":[]}');
  const exec = async () => {
    throw new Error('must not run git');
  };
  expect(await sync(dir, exec)).toEqual({ updated: [], removed: [] });
  expect(await Bun.file(join(dir, LOCK_FILE)).exists()).toBe(false);
});
