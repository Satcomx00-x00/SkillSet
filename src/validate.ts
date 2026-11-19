import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exists, parseWith, readJson } from './io.ts';
import {
  MarketplaceSchema,
  McpConfigSchema,
  PluginManifestSchema,
  SkillFrontmatterSchema,
  TopicConfigSchema,
} from './schema.ts';
import { dirIntegrity, frontmatter, listSkillDirs } from './skill-files.ts';
import { CONFIG_FILE, readLock } from './sync.ts';

export type Severity = 'error' | 'warn';
export interface Issue {
  readonly severity: Severity;
  readonly where: string;
  readonly message: string;
}

const err = (where: string, message: string): Issue => ({ severity: 'error', where, message });
const warn = (where: string, message: string): Issue => ({ severity: 'warn', where, message });
const attempt = async (where: string, f: () => Promise<unknown>): Promise<Issue[]> =>
  f().then(
    () => [],
    (e: unknown) => [err(where, e instanceof Error ? e.message : String(e))],
  );

const SECRETISH = /token|secret|passw|api[-_]?key|authorization|bearer|gh[pousr]_|sk-/i;

/** Literal secrets in MCP config: anything not a `${VAR}` reference in env/headers. */
const secretLeaks = (raw: unknown): Issue[] => {
  const servers =
    (raw as { mcpServers?: Record<string, { env?: object; headers?: object }> }).mcpServers ?? {};
  return Object.entries(servers).flatMap(([name, s]) =>
    Object.entries({ ...s.env, ...s.headers })
      .filter(
        ([k, v]) => typeof v === 'string' && SECRETISH.test(`${k} ${v}`) && !/\$\{\w+\}/.test(v),
      )
      .map(([k]) =>
        warn(`.mcp.json:${name}.${k}`, 'looks like a literal secret; reference an env var instead'),
      ),
  );
};

const validateSkill = async (dir: string, name: string): Promise<Issue[]> => {
  const where = `skills/${name}/SKILL.md`;
  const file = join(dir, where);
  if (!(await exists(file))) return [err(where, 'missing')];
  try {
    const fm = parseWith(SkillFrontmatterSchema, frontmatter(await readFile(file, 'utf8')), where);
    return fm.name === name ? [] : [err(where, `name "${fm.name}" must match directory "${name}"`)];
  } catch (e) {
    return [err(where, (e as Error).message)];
  }
};

/** Validates a topic branch checkout: manifest, skills, MCP config, and vendored-skill integrity. */
export const validateTopic = async (dir: string): Promise<Issue[]> => {
  const skills = await listSkillDirs(join(dir, 'skills'));
  const lock = await readLock(dir).catch(() => undefined);
  const mcpFile = join(dir, '.mcp.json');

  const groups = await Promise.all([
    attempt('.claude-plugin/plugin.json', () =>
      readJson(join(dir, '.claude-plugin/plugin.json'), PluginManifestSchema),
    ),
    skills.length ? Promise.resolve([]) : Promise.resolve([err('skills/', 'no skills found')]),
    ...skills.map((s) => validateSkill(dir, s)),
    (async () => {
      if (!(await exists(mcpFile))) return [];
      const raw: unknown = JSON.parse(await readFile(mcpFile, 'utf8'));
      return [
        ...(await attempt('.mcp.json', async () => parseWith(McpConfigSchema, raw, '.mcp.json'))),
        ...secretLeaks(raw),
      ];
    })(),
    (async () => {
      if (!(await exists(join(dir, CONFIG_FILE)))) return [];
      const cfg = await attempt(CONFIG_FILE, () =>
        readJson(join(dir, CONFIG_FILE), TopicConfigSchema),
      );
      if (!lock) return [...cfg, err('skills.lock.json', 'invalid lock file')];
      const drift = await Promise.all(
        Object.entries(lock.skills).map(async ([n, e]) =>
          !skills.includes(n)
            ? err(`skills/${n}`, 'locked but missing; run `skillset sync`')
            : (await dirIntegrity(join(dir, 'skills', n))) !== e.integrity
              ? err(
                  `skills/${n}`,
                  `vendored from ${e.repo} but edited locally; fork it as a custom skill or re-run sync`,
                )
              : undefined,
        ),
      );
      return [...cfg, ...drift.filter((i) => i !== undefined)];
    })(),
  ]);
  return groups.flat();
};

/** Validates main's marketplace: schema, unique names, branch == plugin name convention. */
export const validateMarketplace = async (file: string): Promise<Issue[]> => {
  try {
    const m = await readJson(file, MarketplaceSchema);
    const names = m.plugins.map((p) => p.name);
    return [
      ...names
        .filter((n, i) => names.indexOf(n) !== i)
        .map((n) => err(file, `duplicate topic "${n}"`)),
      ...m.plugins
        .filter((p) => p.source.ref !== p.name)
        .map((p) => warn(file, `topic "${p.name}" points at branch "${p.source.ref}"`)),
    ];
  } catch (e) {
    return [err(file, (e as Error).message)];
  }
};
