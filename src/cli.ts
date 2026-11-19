#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { renderBanner } from './banner.ts';
import { DEFAULT_REPO, fetchJson, rawUrl } from './github.ts';
import { exists } from './io.ts';
import { mergeServers } from './mcp/merge.ts';
import { detectTargets, isTargetId, type Scope, TARGET_IDS, target } from './mcp/targets.ts';
import { localRegistry, MARKETPLACE_PATH, type Registry, remoteRegistry } from './registry.ts';
import { McpConfigSchema, type Topic } from './schema.ts';
import { type SkillInstaller, vercelSkills } from './skills.ts';
import { githubSource, localSource, type TopicSource } from './source.ts';
import { sync } from './sync.ts';
import { topicFiles } from './templates.ts';
import { loadTopicSummary } from './topic-info.ts';
import { type Issue, validateMarketplace, validateTopic } from './validate.ts';

const HELP = `skillset — topic-scoped Agent Skills + MCP servers (one topic per git branch)

Usage
  skillset list [--json]                    List topics
  skillset add <topic...> [options]         Install skills (all agents) + MCP servers
  skillset info <topic|dir...>              Show what a topic contains and how to use it
  skillset sync [dir]                       Vendor imported skills from skillset.json
  skillset validate [dir]                   Validate a topic checkout
  skillset validate-marketplace [file]      Validate main's marketplace.json
  skillset init <topic> [-d desc]           Scaffold a topic in the current dir

Options (add)
  -a, --agent <id>     Agent for skills (repeatable; default: prompt). e.g. claude-code, cursor, codex
  -s, --skill <name>   Only these skills (repeatable)
  -m, --mcp <target>   MCP target (repeatable): ${TARGET_IDS.join(', ')}, none (default: detected)
  -g, --global         User scope instead of project
      --no-skills      MCP only        --force   Overwrite existing MCP servers
      --dry-run        Print MCP changes only
  -y, --yes            No prompts

Global
  -r, --repo <owner/repo>  Source repo (default ${DEFAULT_REPO}, env SKILLSET_REPO)
      --local              Read marketplace from ./${MARKETPLACE_PATH}`;

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  allowNegative: true,
  options: {
    agent: { type: 'string', short: 'a', multiple: true, default: [] },
    skill: { type: 'string', short: 's', multiple: true, default: [] },
    mcp: { type: 'string', short: 'm', multiple: true, default: [] },
    global: { type: 'boolean', short: 'g', default: false },
    skills: { type: 'boolean', default: true },
    force: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    yes: { type: 'boolean', short: 'y', default: false },
    json: { type: 'boolean', default: false },
    repo: { type: 'string', short: 'r', default: DEFAULT_REPO },
    local: { type: 'boolean', default: false },
    description: { type: 'string', short: 'd' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const [cmd, ...args] = positionals;
const registry: Registry = o.local ? localRegistry() : remoteRegistry(o.repo);
const installer: SkillInstaller = vercelSkills();
const log = (s = '') => console.log(s);

const report = (issues: readonly Issue[]): number => {
  for (const i of issues)
    console.error(`${i.severity === 'error' ? '✖' : '⚠'} ${i.where}: ${i.message}`);
  const errors = issues.filter((i) => i.severity === 'error').length;
  log(errors ? `\n${errors} error(s)` : '✔ valid');
  return errors ? 1 : 0;
};

const installMcp = async (topic: Topic) => {
  const cfg = await fetchJson(rawUrl(topic.repo, topic.ref, '.mcp.json'), McpConfigSchema);
  if (!cfg || !Object.keys(cfg.mcpServers).length) return log(`  ${topic.name}: no MCP servers`);
  const requested = o.mcp.length ? o.mcp : await detectTargets(process.cwd());
  if (requested.includes('none')) return;
  const scope: Scope = o.global ? 'global' : 'project';
  for (const id of requested) {
    if (!isTargetId(id)) throw new Error(`Unknown MCP target "${id}" (${TARGET_IDS.join(', ')})`);
    const r = await mergeServers(target(id), cfg, {
      scope,
      cwd: process.cwd(),
      force: o.force,
      dryRun: o['dry-run'],
    });
    log(
      `  ${id} → ${r.file}: +${r.added.join(', ') || '∅'}${r.skipped.length ? `  (kept existing: ${r.skipped.join(', ')})` : ''}`,
    );
  }
};

const printSummary = async (name: string, src: TopicSource) =>
  log(`\n${renderBanner(await loadTopicSummary(name, src))}\n`);

const commands: Record<string, () => Promise<number>> = {
  async list() {
    const topics = await registry.list();
    if (o.json) log(JSON.stringify(topics, null, 2));
    else for (const t of topics) log(`${t.name.padEnd(16)} ${t.description}`);
    return 0;
  },
  async add() {
    if (!args.length) throw new Error('add: missing <topic>');
    for (const topic of await Promise.all(args.map((a) => registry.get(a)))) {
      log(`▸ ${topic.name}`);
      if (o.skills)
        await installer.install(topic, {
          agents: o.agent,
          skills: o.skill,
          global: o.global,
          yes: o.yes,
        });
      await installMcp(topic);
      await printSummary(topic.name, githubSource(topic)).catch((e: unknown) =>
        console.error(`  (summary unavailable: ${e instanceof Error ? e.message : String(e)})`),
      );
    }
    return 0;
  },
  async sync() {
    const r = await sync(resolve(args[0] ?? '.'));
    log(`updated: ${r.updated.join(', ') || '∅'}  removed: ${r.removed.join(', ') || '∅'}`);
    return 0;
  },
  async info() {
    if (!args.length) throw new Error('info: missing <topic> or <dir>');
    for (const a of args) {
      const local = a.startsWith('.') || a.startsWith('/');
      await printSummary(a, local ? localSource(resolve(a)) : githubSource(await registry.get(a)));
    }
    return 0;
  },
  validate: async () => report(await validateTopic(resolve(args[0] ?? '.'))),
  'validate-marketplace': async () =>
    report(await validateMarketplace(args[0] ?? MARKETPLACE_PATH)),
  async init() {
    const [name] = args;
    if (!name) throw new Error('init: missing <topic>');
    for (const [path, body] of Object.entries(
      topicFiles(name, o.description ?? `${name} skills and MCP servers`),
    )) {
      const file = join(process.cwd(), path);
      if (await exists(file)) continue;
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, body);
      log(`+ ${path}`);
    }
    return 0;
  },
};

const run = cmd && !o.help ? commands[cmd] : undefined;
if (!run) {
  log(HELP);
  process.exitCode = cmd && !o.help ? 1 : 0;
} else {
  process.exitCode = await run().catch((e: unknown) => {
    console.error(`✖ ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  });
}
