import { homedir } from 'node:os';
import { join } from 'node:path';
import { exists } from '../io.ts';
import type { McpServer } from '../schema.ts';

export type Scope = 'project' | 'global';

/** An agent's MCP config file. Add a new agent by adding one entry to `TARGETS` (open/closed). */
export interface McpTarget {
  readonly id: string;
  /** Config path for a scope, or undefined when the agent has no file for it. */
  file(scope: Scope, cwd: string): string | undefined;
  /** Top-level key holding the server map. */
  readonly key: 'mcpServers' | 'servers';
  /** Marker whose presence in `cwd` means the project uses this agent. */
  readonly marker: string;
  readonly adapt?: (s: McpServer) => McpServer;
}

const home = homedir();
const both =
  (project: string, global: string) =>
  (scope: Scope, cwd: string): string =>
    scope === 'project' ? join(cwd, project) : join(home, global);

export const TARGETS = [
  { id: 'claude', key: 'mcpServers', marker: '.claude', file: both('.mcp.json', '.claude.json') },
  {
    id: 'cursor',
    key: 'mcpServers',
    marker: '.cursor',
    file: both('.cursor/mcp.json', '.cursor/mcp.json'),
  },
  {
    id: 'gemini',
    key: 'mcpServers',
    marker: '.gemini',
    file: both('.gemini/settings.json', '.gemini/settings.json'),
  },
  {
    id: 'vscode',
    key: 'servers',
    marker: '.vscode',
    file: (scope, cwd) => (scope === 'project' ? join(cwd, '.vscode/mcp.json') : undefined),
    adapt: (s) => ('command' in s ? { type: 'stdio', ...s } : s),
  },
] as const satisfies readonly McpTarget[];

export type TargetId = (typeof TARGETS)[number]['id'];
export const TARGET_IDS: readonly TargetId[] = TARGETS.map((t) => t.id);

export const isTargetId = (s: string): s is TargetId =>
  (TARGET_IDS as readonly string[]).includes(s);

export const target = (id: TargetId): McpTarget => TARGETS.find((t) => t.id === id) as McpTarget;

/** Targets whose marker dir exists in `cwd`; falls back to Claude Code. */
export const detectTargets = async (cwd: string): Promise<TargetId[]> => {
  const found = await Promise.all(
    TARGETS.map(async (t) => ((await exists(join(cwd, t.marker))) ? t.id : undefined)),
  );
  const ids = found.filter((id): id is TargetId => id !== undefined);
  return ids.length ? ids : ['claude'];
};
