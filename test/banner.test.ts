import { describe, expect, test } from 'bun:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderBanner, wrap } from '../src/banner.ts';
import { localSource } from '../src/source.ts';
import { syncSetupSkill } from '../src/sync.ts';
import { loadTopicSummary, type TopicSummary } from '../src/topic-info.ts';

const summary: TopicSummary = {
  name: 'demo',
  description:
    'A demo topic with a fairly long description that has to wrap onto a second line in the box.',
  skills: [{ label: 'hello', text: 'Says hello.' }],
  mcp: [],
  commands: [{ label: '/setup', text: 'Run setup.' }],
  cli: [
    { label: '$ npm install -g a-very-long-package-name-that-overflows', text: 'Installs it.' },
  ],
  notes: ['Remember this.'],
};

describe('renderBanner', () => {
  const out = renderBanner(summary, 60);
  const lines = out.split('\n');

  test('every line has the exact width and is pure ASCII', () => {
    expect(lines.every((l) => l.length === 60)).toBe(true);
    expect(/^[\x20-\x7e\n]*$/.test(out)).toBe(true);
  });

  test('shows filled sections, omits empty ones', () => {
    expect(out).toContain('Skills (1)');
    expect(out).toContain('/setup');
    expect(out).toContain('Run once in your terminal');
    expect(out).not.toContain('MCP servers');
  });

  test('long labels move their text to the next line', () => {
    const i = lines.findIndex((l) => l.includes('a-very-long-package'));
    expect(lines[i + 1]).toContain('Installs it.');
  });
});

test('wrap keeps words intact', () => {
  expect(wrap('aa bb cc dd', 5)).toEqual(['aa bb', 'cc dd']);
});

test('loadTopicSummary reads a local topic and derives /skillset-setup', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'skillset-info-'));
  await Bun.write(
    join(dir, '.claude-plugin/plugin.json'),
    '{"name":"t","description":"T topic","version":"0.1.0"}',
  );
  await Bun.write(
    join(dir, 'skills/setup-x/SKILL.md'),
    '---\nname: setup-x\ndescription: Configure x.\n---\n',
  );
  await Bun.write(
    join(dir, '.mcp.json'),
    '{"mcpServers":{"ctx":{"command":"npx","args":["-y","ctx"]}}}',
  );
  await writeFile(
    join(dir, 'skillset.json'),
    JSON.stringify({ info: { cli: [{ run: 'brew install x', does: 'Get x' }] } }),
  );
  await syncSetupSkill(join(dir, 'skills'));

  const s = await loadTopicSummary('fallback', localSource(dir));
  expect(s.name).toBe('t');
  expect(s.skills.map((l) => l.label)).toEqual(['setup-x', 'skillset-setup']);
  expect(s.commands.map((l) => l.label)).toEqual(['/setup-x', '/skillset-setup']);
  expect(s.mcp).toEqual([{ label: 'ctx', text: 'npx -y ctx' }]);
  expect(s.cli).toEqual([{ label: '$ brew install x', text: 'Get x' }]);
});
