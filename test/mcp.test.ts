import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mergeServers } from '../src/mcp/merge.ts';
import { detectTargets, target } from '../src/mcp/targets.ts';
import type { McpConfig } from '../src/schema.ts';

const cfg: McpConfig = {
  mcpServers: {
    context7: { command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
    github: { type: 'http', url: 'https://api.githubcopilot.com/mcp/' },
  },
};
const tmp = () => mkdtemp(join(tmpdir(), 'skillset-test-'));
const opts = (cwd: string) => ({ scope: 'project', cwd, force: false, dryRun: false }) as const;

describe('mergeServers', () => {
  test('creates claude .mcp.json', async () => {
    const cwd = await tmp();
    const r = await mergeServers(target('claude'), cfg, opts(cwd));
    expect(r.added).toEqual(['context7', 'github']);
    expect(JSON.parse(await readFile(join(cwd, '.mcp.json'), 'utf8'))).toEqual(cfg);
  });

  test('keeps existing servers and unrelated keys unless forced', async () => {
    const cwd = await tmp();
    await writeFile(
      join(cwd, '.mcp.json'),
      JSON.stringify({ other: 1, mcpServers: { context7: { command: 'mine' } } }),
    );
    const r = await mergeServers(target('claude'), cfg, opts(cwd));
    expect(r).toMatchObject({ added: ['github'], skipped: ['context7'] });
    const doc = JSON.parse(await readFile(join(cwd, '.mcp.json'), 'utf8'));
    expect(doc.other).toBe(1);
    expect(doc.mcpServers.context7.command).toBe('mine');
  });

  test('vscode uses `servers` and explicit stdio type', async () => {
    const cwd = await tmp();
    await mergeServers(target('vscode'), cfg, opts(cwd));
    const doc = JSON.parse(await readFile(join(cwd, '.vscode/mcp.json'), 'utf8'));
    expect(doc.servers.context7.type).toBe('stdio');
    expect(doc.mcpServers).toBeUndefined();
  });

  test('dry run writes nothing', async () => {
    const cwd = await tmp();
    await mergeServers(target('cursor'), cfg, { ...opts(cwd), dryRun: true });
    expect(await Bun.file(join(cwd, '.cursor/mcp.json')).exists()).toBe(false);
  });

  test('vscode has no global scope', async () => {
    expect(
      mergeServers(target('vscode'), cfg, { ...opts(await tmp()), scope: 'global' }),
    ).rejects.toThrow();
  });
});

test('detectTargets falls back to claude and finds markers', async () => {
  const cwd = await tmp();
  expect(await detectTargets(cwd)).toEqual(['claude']);
  await Bun.write(join(cwd, '.cursor/.keep'), '');
  expect(await detectTargets(cwd)).toEqual(['cursor']);
});
