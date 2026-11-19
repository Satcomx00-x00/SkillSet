import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { parse } from 'yaml';

const FM = /^---\r?\n([\s\S]*?)\r?\n---/;

export const frontmatter = (md: string): unknown => {
  const m = FM.exec(md);
  if (!m?.[1]) throw new Error('missing YAML frontmatter');
  return parse(m[1]);
};

/** Rewrites the frontmatter `name:` field, leaving the rest untouched. */
export const renameSkill = (md: string, name: string): string =>
  md.replace(FM, (block) => block.replace(/^name:.*$/m, `name: ${name}`));

const walk = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)).split(sep).join('/'))
    .sort();
};

/** Deterministic content hash of a directory (paths + bytes), SRI-style. */
export const dirIntegrity = async (dir: string): Promise<string> => {
  const h = createHash('sha256');
  for (const f of await walk(dir))
    h.update(f)
      .update('\0')
      .update(await readFile(join(dir, f)))
      .update('\0');
  return `sha256-${h.digest('base64')}`;
};

export const listSkillDirs = async (skillsDir: string): Promise<string[]> =>
  (await readdir(skillsDir, { withFileTypes: true }).catch(() => []))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
