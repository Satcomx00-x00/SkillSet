import { parseWith } from './io.ts';
import {
  LockSchema,
  McpConfigSchema,
  type McpServer,
  PluginManifestSchema,
  RemoteServer,
  SkillFrontmatterSchema,
  StdioServer,
  TopicConfigSchema,
} from './schema.ts';
import { SETUP_PREFIX, SETUP_SKILL } from './setup-skill.ts';
import { frontmatter } from './skill-files.ts';
import type { TopicSource } from './source.ts';
import { CONFIG_FILE, LOCK_FILE } from './sync.ts';

export interface Line {
  readonly label: string;
  readonly text: string;
}

export interface TopicSummary {
  readonly name: string;
  readonly description: string;
  readonly skills: readonly Line[];
  readonly mcp: readonly Line[];
  readonly commands: readonly Line[];
  readonly cli: readonly Line[];
  readonly notes: readonly string[];
}

const json = async <T>(
  src: TopicSource,
  path: string,
  parse: (d: unknown) => T,
): Promise<T | undefined> => {
  const raw = await src.text(path);
  return raw === undefined ? undefined : parse(JSON.parse(raw));
};

const describeServer = (s: McpServer): string => {
  const stdio = StdioServer.safeParse(s);
  if (stdio.success) return [stdio.data.command, ...(stdio.data.args ?? [])].join(' ');
  const remote = RemoteServer.parse(s);
  return `${remote.type} ${remote.url}`;
};

interface SkillMeta {
  readonly name: string;
  readonly description: string;
  readonly userOnly: boolean;
}

const readSkill = async (src: TopicSource, name: string): Promise<SkillMeta> => {
  const md = await src.text(`skills/${name}/SKILL.md`);
  if (!md) return { name, description: '', userOnly: false };
  const fm = parseWith(SkillFrontmatterSchema, frontmatter(md), name);
  return { name, description: fm.description, userOnly: fm['disable-model-invocation'] === true };
};

/** Gathers everything worth telling the user after installing a topic. */
export const loadTopicSummary = async (
  fallbackName: string,
  src: TopicSource,
): Promise<TopicSummary> => {
  const [manifest, config, lock, mcp] = await Promise.all([
    json(src, '.claude-plugin/plugin.json', (d) =>
      parseWith(PluginManifestSchema, d, 'plugin.json'),
    ),
    json(src, CONFIG_FILE, (d) => parseWith(TopicConfigSchema, d, CONFIG_FILE)),
    json(src, LOCK_FILE, (d) => parseWith(LockSchema, d, LOCK_FILE)),
    json(src, '.mcp.json', (d) => parseWith(McpConfigSchema, d, '.mcp.json')),
  ]);
  const names = (await src.dirs('skills')) ?? Object.keys(lock?.skills ?? {});
  const skills = await Promise.all(names.sort().map((n) => readSkill(src, n)));
  const vendored = lock?.skills ?? {};
  const info = config?.info ?? { commands: [], cli: [], notes: [] };

  const autoCommands = skills
    .filter((s) => s.userOnly || s.name === SETUP_SKILL || s.name.startsWith(SETUP_PREFIX))
    .map((s) => ({ label: `/${s.name}`, text: s.description }));

  return {
    name: manifest?.name ?? fallbackName,
    description: manifest?.description ?? '',
    skills: skills.map((s) => ({
      label: s.name,
      text: vendored[s.name] ? `${s.description} [${vendored[s.name]?.repo}]` : s.description,
    })),
    mcp: Object.entries(mcp?.mcpServers ?? {}).map(([n, s]) => ({
      label: n,
      text: describeServer(s),
    })),
    commands: [...autoCommands, ...info.commands.map((c) => ({ label: c.run, text: c.does }))],
    cli: info.cli.map((c) => ({ label: `$ ${c.run}`, text: c.does })),
    notes: info.notes,
  };
};
