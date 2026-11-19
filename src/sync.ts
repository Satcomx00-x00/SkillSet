import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
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
import { dirIntegrity, renameSkill } from './skill-files.ts';

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

/** Sparse, shallow clone of just the needed skill dirs; returns the checkout root and commit. */
const fetchImport = async (imp: SkillImport, run: typeof execOk) => {
  const root = await mkdtemp(join(tmpdir(), 'skillset-'));
  const branch = imp.ref === 'HEAD' ? [] : ['--branch', imp.ref];
  await run(
    'git',
    [
      'clone',
      '-q',
      '--depth',
      '1',
      '--filter=blob:none',
      '--sparse',
      ...branch,
      `https://github.com/${imp.repo}.git`,
      root,
    ],
    { capture: true },
  );
  await run(
    'git',
    ['-C', root, 'sparse-checkout', 'set', ...imp.skills.map((s) => `${imp.path}/${norm(s).name}`)],
    { capture: true },
  );
  return { root, commit: await run('git', ['-C', root, 'rev-parse', 'HEAD'], { capture: true }) };
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
    const { root, commit } = await fetchImport(imp, run);
    try {
      const license = await licenseOf(root);
      for (const { name, as } of imp.skills.map(norm)) {
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

  const updated = Object.keys(skills).filter(
    (n) => old.skills[n]?.integrity !== skills[n]?.integrity,
  );
  return { updated, removed };
};
