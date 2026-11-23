import { expect, test } from 'bun:test';
import { join } from 'node:path';
import { offlineCatalog, onlineCatalog } from '../src/catalog.ts';
import type { Registry } from '../src/registry.ts';

const root = join(import.meta.dir, 'fixtures/bundle');
const offline = offlineCatalog(root);

test('offline catalog lists bundled topics', async () => {
  expect((await offline.registry.list()).map((t) => t.name)).toEqual(['demo']);
});

test('offline catalog reads topic files and installs from the bundled dir', async () => {
  const demo = await offline.registry.get('demo');
  expect(offline.offline).toBe(true);
  expect(offline.location(demo)).toBe(join(root, 'demo'));
  expect(JSON.parse((await offline.source(demo).text('.mcp.json')) ?? '{}')).toHaveProperty(
    'mcpServers.gh',
  );
  expect(await offline.source(demo).dirs('skills')).toEqual(['hello']);
});

test('offline catalog without a bundle explains how to fix it', () => {
  expect(offlineCatalog('/nonexistent').registry.list()).rejects.toThrow('no bundled topics');
});

test('online catalog installs from the GitHub tree URL', () => {
  const c = onlineCatalog({} as Registry);
  const topic = { name: 'demo', description: 'd', repo: 'o/r', ref: 'demo', tags: [] };
  expect(c.offline).toBe(false);
  expect(c.location(topic)).toBe('https://github.com/o/r/tree/demo');
});
