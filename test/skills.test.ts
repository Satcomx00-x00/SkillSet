import { expect, test } from 'bun:test';
import { renameSkill } from '../src/skill-files.ts';
import { skillsAddArgs, vercelSkills } from '../src/skills.ts';

const topic = { name: 'coding', description: 'd', repo: 'o/r', ref: 'coding', tags: [] };

test('skillsAddArgs targets the topic branch tree URL', () => {
  expect(
    skillsAddArgs(topic, {
      agents: ['claude-code', 'cursor'],
      skills: ['tdd'],
      global: true,
      yes: true,
    }),
  ).toEqual([
    'add',
    'https://github.com/o/r/tree/coding',
    '--agent',
    'claude-code',
    '--agent',
    'cursor',
    '--skill',
    'tdd',
    '--global',
    '--yes',
  ]);
});

test('installer runs the bundled skills CLI with node, no shell', async () => {
  const calls: unknown[] = [];
  const i = vercelSkills(
    async (cmd, args, opts) => {
      calls.push([cmd, args, opts]);
      return { code: 0, stdout: '' };
    },
    () => '/skills/cli.mjs',
  );
  await i.install(topic, { agents: [], skills: [], global: false, yes: true });
  expect(calls).toEqual([
    [
      process.execPath,
      ['/skills/cli.mjs', 'add', 'https://github.com/o/r/tree/coding', '--yes'],
      { shell: false },
    ],
  ]);
});

test('the skills CLI dependency resolves', async () => {
  const calls: string[][] = [];
  await vercelSkills(async (_cmd, args) => {
    calls.push([...args]);
    return { code: 0, stdout: '' };
  }).install(topic, { agents: [], skills: [], global: false, yes: false });
  expect(calls[0]?.[0]).toEndWith('cli.mjs');
});

test('installer surfaces non-zero exit', async () => {
  const i = vercelSkills(
    async () => ({ code: 2, stdout: '' }),
    () => 'cli.mjs',
  );
  expect(i.install(topic, { agents: [], skills: [], global: false, yes: true })).rejects.toThrow(
    'exit 2',
  );
});

test('renameSkill only touches frontmatter name', () => {
  const md = '---\nname: tdd\ndescription: x\n---\nname: body stays\n';
  expect(renameSkill(md, 'mp-tdd')).toBe(
    '---\nname: mp-tdd\ndescription: x\n---\nname: body stays\n',
  );
});
