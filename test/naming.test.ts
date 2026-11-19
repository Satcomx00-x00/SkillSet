import { expect, test } from 'bun:test';
import { qualify, rewriteRefs, sourceOf } from '../src/naming.ts';
import { isSetupSkill } from '../src/setup-skill.ts';

test('qualify builds skillset-<source>-<skill> without repeating the source', () => {
  expect(qualify('tdd', 'mattpocock')).toBe('skillset-mattpocock-tdd');
  expect(qualify('ponytail-review', 'ponytail')).toBe('skillset-ponytail-review');
  expect(qualify('ponytail', 'ponytail')).toBe('skillset-ponytail');
  expect(qualify('conventional-commits')).toBe('skillset-conventional-commits');
});

test('sourceOf uses the kebab-cased repo owner', () => {
  expect(sourceOf('mattpocock/skills')).toBe('mattpocock');
  expect(sourceOf('DietrichGebert/ponytail')).toBe('dietrichgebert');
});

test('rewriteRefs renames slash commands only', () => {
  const renames = new Map([
    ['tdd', 'skillset-mattpocock-tdd'],
    ['setup-matt-pocock-skills', 'skillset-mattpocock-setup-matt-pocock-skills'],
  ]);
  expect(
    rewriteRefs('Run `/setup-matt-pocock-skills`, then /tdd. Use the `tdd` CLI.', renames),
  ).toBe(
    'Run `/skillset-mattpocock-setup-matt-pocock-skills`, then /skillset-mattpocock-tdd. Use the `tdd` CLI.',
  );
  expect(rewriteRefs('see skills/tdd/SKILL.md and /tdd-x', renames)).toBe(
    'see skills/tdd/SKILL.md and /tdd-x',
  );
});

test('isSetupSkill matches plain and qualified setup skills, not the orchestrator', () => {
  expect(isSetupSkill('setup-x')).toBe(true);
  expect(isSetupSkill('skillset-mattpocock-setup-matt-pocock-skills')).toBe(true);
  expect(isSetupSkill('skillset-setup')).toBe(false);
  expect(isSetupSkill('skillset-mattpocock-tdd')).toBe(false);
});
