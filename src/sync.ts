import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Exec, execOk } from './exec.ts';
import { exists, readJson, writeJson } from './io.ts';
import {
  type Lock,
  type LockEntry,
  LockSchema,
  type SkillImport,
  TopicConfigSchema,
} from './schema.ts';
import { GENERATED_MARKER, SETUP_PREFIX, SETUP_SKILL, setupSkill } from './setup-skill.ts';
import { dirIntegrity, listSkillDirs, renameSkill } from './skill-files.ts';

export const CONFIG_FILE = 'skillset.json';
export const LOCK_FILE = 'skills.lock.json';

export const readLock = async (dir: string): Promise<Lock> => {
  const f = join(dir, LOCK_FILE);
  return (await exists(f)) ? readJson(f, LockSchema) : { version: 1, skills: {} };
};

const norm = (s: SkillImport['skills'][number]) => (typeof s === 'string' ? { name: s, as: s } : s);

const licenseOf = async (root: string): Promise<{ file: string; id: string } | undefined> => {
  const file = (await readdir(root)).find((f) => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f));
  if (!file) return undefined;
  const firstLine =
    (await readFile(join(root, file), 'utf8')).split('\n').find((l) => l.trim()) ?? '';
  return { file: join(root, file), id: firstLine.trim() };
};

const git = (run: typeof execOk, root: string, ...args: string[]) =>
  run('git', ['-C', root, ...args], { capture: true });

/**
 * Sparse, shallow clone of just the needed skill dirs (plus sibling `setup-*` skills unless disabled).
 * Returns the checkout root, commit, and resolved skill list.
 */
const fetchImport = async (imp: SkillImport, run: typeof execOk) => {
  const root = await mkdtemp(join(tmpdir(), 'skillset-'));
  const branch = imp.ref === 'HEAD' ? [] : ['--branch', imp.ref];
  const url = `https://github.com/${imp.repo}.git`;
  await run(
    'git',
    ['clone', '-q', '--depth', '1', '--filter=blob:none', '--sparse', ...branch, url, root],
    {
      capture: true,
    },
  );
  const listed = imp.skills.map(norm);
  const siblings = imp.setup
    ? (await git(run, root, 'ls-tree', '-d', '--name-only', 'HEAD', `${imp.path}/`))
        .split('\n')
        .map((p) => p.split('/').at(-1) ?? '')
        .filter((n) => n.startsWith(SETUP_PREFIX) && !listed.some((s) => s.name === n))
    : [];
  const skills = [...listed, ...siblings.map((name) => ({ name, as: name }))];
  await git(run, root, 'sparse-checkout', 'set', ...skills.map((s) => `${imp.path}/${s.name}`));
  return { root, skills, commit: await git(run, root, 'rev-parse', 'HEAD') };
};

/** Writes (or removes) the generated `/setup` skill depending on whether any `setup-*` skill exists. */
export const syncSetupSkill = async (skillsDir: string): Promise<void> => {
  const dest = join(skillsDir, SETUP_SKILL);
  const file = join(dest, 'SKILL.md');
  const ours = !(await exists(file)) || (await readFile(file, 'utf8')).includes(GENERATED_MARKER);
  if (!ours) return;
  const hasSetup = (await listSkillDirs(skillsDir)).some((n) => n.startsWith(SETUP_PREFIX));
  if (!hasSetup) return void (await rm(dest, { recursive: true, force: true }));
  await mkdir(dest, { recursive: true });
  await writeFile(file, setupSkill);
};

export interface SyncReport {
  readonly updated: readonly string[];
  readonly removed: readonly string[];
}

/** Vendors every import of `<dir>/skillset.json` into `<dir>/skills/`, pinning commits in the lock. */
export const sync = async (dir: string, exec?: Exec): Promise<SyncReport> => {
  const run: typeof execOk = exec ? async (...a) => (await exec(...a)).stdout.trim() : execOk;
  const config = await readJson(join(dir, CONFIG_FILE), TopicConfigSchema);
  const old = await readLock(dir);
  if (!config.imports.length && !Object.keys(old.skills).length)
    return { updated: [], removed: [] };
  const skills: Record<string, LockEntry> = {};
  const skillsDir = join(dir, 'skills');

  for (const imp of config.imports) {
    const fetched = await fetchImport(imp, run);
    const { root, commit } = fetched;
    try {
      const license = await licenseOf(root);
      for (const { name, as } of fetched.skills) {
        if (skills[as]) throw new Error(`Duplicate imported skill "${as}"`);
        const src = join(root, imp.path, name);
        const dest = join(skillsDir, as);
        if (!(await exists(join(src, 'SKILL.md'))))
          throw new Error(`${imp.repo}: ${imp.path}/${name}/SKILL.md not found`);
        if (!old.skills[as] && (await exists(dest)))
          throw new Error(`skills/${as} is a custom skill; import it with "as" to rename`);

        await rm(dest, { recursive: true, force: true });
        await cp(src, dest, { recursive: true });
        if (as !== name) {
          const md = join(dest, 'SKILL.md');
          await writeFile(md, renameSkill(await readFile(md, 'utf8'), as));
        }
        if (license && !(await exists(join(dest, 'LICENSE'))))
          await cp(license.file, join(dest, 'LICENSE'));

        skills[as] = {
          repo: imp.repo,
          ref: imp.ref,
          commit,
          path: `${imp.path}/${name}`,
          license: license?.id ?? null,
          integrity: await dirIntegrity(dest),
        };
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }

  const removed = Object.keys(old.skills).filter((n) => !skills[n]);
  await Promise.all(removed.map((n) => rm(join(skillsDir, n), { recursive: true, force: true })));
  const sorted = Object.fromEntries(Object.entries(skills).sort(([a], [b]) => a.localeCompare(b)));
  await writeJson(join(dir, LOCK_FILE), { version: 1, skills: sorted } satisfies Lock);
  await syncSetupSkill(skillsDir);

  const updated = Object.keys(skills).filter(
    (n) => old.skills[n]?.integrity !== skills[n]?.integrity,
  );
  return { updated, removed };
};
