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
    '-y',
    'skills@latest',
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

test('installer surfaces non-zero exit', async () => {
  const i = vercelSkills(async () => ({ code: 2, stdout: '' }));
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
