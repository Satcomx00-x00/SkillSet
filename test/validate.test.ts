import { describe, expect, test } from 'bun:test';
import { cp, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dirIntegrity } from '../src/skill-files.ts';
import { validateMarketplace, validateTopic } from '../src/validate.ts';

const fixture = async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skillset-topic-'));
  await cp(join(import.meta.dir, 'fixtures/topic'), dir, { recursive: true });
  return dir;
};
const errors = async (dir: string) =>
  (await validateTopic(dir)).filter((i) => i.severity === 'error');

describe('validateTopic', () => {
  test('valid fixture passes', async () => {
    expect(await errors(await fixture())).toEqual([]);
  });

  test('skill name must match its directory', async () => {
    const dir = await fixture();
    await writeFile(join(dir, 'skills/hello/SKILL.md'), '---\nname: other\ndescription: d\n---\n');
    expect((await errors(dir))[0]?.message).toContain('must match directory');
  });

  test('flags literal secrets in .mcp.json', async () => {
    const dir = await fixture();
    await writeFile(
      join(dir, '.mcp.json'),
      JSON.stringify({ mcpServers: { gh: { command: 'x', env: { GITHUB_TOKEN: 'ghp_abc' } } } }),
    );
    expect((await validateTopic(dir)).some((i) => i.message.includes('literal secret'))).toBe(true);
  });

  test('detects local edits to vendored skills', async () => {
    const dir = await fixture();
    const integrity = await dirIntegrity(join(dir, 'skills/hello'));
    const lock = {
      version: 1,
      skills: {
        hello: {
          repo: 'o/r',
          ref: 'main',
          commit: 'a'.repeat(40),
          path: 'skills/hello',
          license: 'MIT License',
          integrity,
        },
      },
    };
    await writeFile(join(dir, 'skillset.json'), '{"imports":[]}');
    await writeFile(join(dir, 'skills.lock.json'), JSON.stringify(lock));
    expect(await errors(dir)).toEqual([]);
    await writeFile(join(dir, 'skills/hello/extra.md'), 'edit');
    expect((await errors(dir))[0]?.message).toContain('edited locally');
  });
});

test('validateMarketplace on repo file', async () => {
  expect(await validateMarketplace('.claude-plugin/marketplace.json')).toEqual([]);
});
