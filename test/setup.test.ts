import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GENERATED_MARKER } from '../src/setup-skill.ts';
import { frontmatter } from '../src/skill-files.ts';
import { syncSetupSkill } from '../src/sync.ts';

const skillsDir = async (...names: string[]) => {
  const dir = await mkdtemp(join(tmpdir(), 'skillset-setup-'));
  await Promise.all(names.map((n) => mkdir(join(dir, n), { recursive: true })));
  return dir;
};
const setupMd = (dir: string) => join(dir, 'skillset-setup/SKILL.md');

describe('syncSetupSkill', () => {
  test('generates /skillset-setup when a qualified setup skill exists', async () => {
    const dir = await skillsDir(
      'skillset-mattpocock-tdd',
      'skillset-mattpocock-setup-matt-pocock-skills',
    );
    await syncSetupSkill(dir);
    const md = await readFile(setupMd(dir), 'utf8');
    expect(frontmatter(md)).toMatchObject({
      name: 'skillset-setup',
      'disable-model-invocation': true,
    });
  });

  test('replaces the legacy generated setup skill', async () => {
    const dir = await skillsDir('setup', 'setup-x');
    await writeFile(join(dir, 'setup/SKILL.md'), `---\nname: setup\n---\n${GENERATED_MARKER}\n`);
    await syncSetupSkill(dir);
    expect(await Bun.file(join(dir, 'setup/SKILL.md')).exists()).toBe(false);
    expect(await Bun.file(setupMd(dir)).exists()).toBe(true);
  });

  test('removes generated /setup once no setup-* skill remains', async () => {
    const dir = await skillsDir('setup-x');
    await syncSetupSkill(dir);
    await rm(join(dir, 'setup-x'), { recursive: true });
    await syncSetupSkill(dir);
    expect(await Bun.file(setupMd(dir)).exists()).toBe(false);
  });

  test('never overwrites a hand-written setup skill', async () => {
    const dir = await skillsDir('skillset-setup', 'setup-x');
    await writeFile(setupMd(dir), '---\nname: skillset-setup\ndescription: mine\n---\n');
    await syncSetupSkill(dir);
    expect(await readFile(setupMd(dir), 'utf8')).not.toContain(GENERATED_MARKER);
  });

  test('does nothing without setup-* skills', async () => {
    const dir = await skillsDir('tdd');
    await syncSetupSkill(dir);
    expect(await Bun.file(setupMd(dir)).exists()).toBe(false);
  });
});
