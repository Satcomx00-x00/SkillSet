import { readJsonObject, writeJson } from '../io.ts';
import type { McpConfig } from '../schema.ts';
import type { McpTarget, Scope } from './targets.ts';

export interface MergeResult {
  readonly file: string;
  readonly added: readonly string[];
  readonly skipped: readonly string[];
}

export interface MergeOptions {
  readonly scope: Scope;
  readonly cwd: string;
  readonly force: boolean;
  readonly dryRun: boolean;
}

/** Merges servers into a target's config, preserving unrelated keys and existing servers unless `force`. */
export const mergeServers = async (
  t: McpTarget,
  { mcpServers }: McpConfig,
  { scope, cwd, force, dryRun }: MergeOptions,
): Promise<MergeResult> => {
  const file = t.file(scope, cwd);
  if (!file) throw new Error(`${t.id} has no ${scope} MCP config; use --scope project`);

  const doc = await readJsonObject(file);
  const current = (doc[t.key] ?? {}) as Record<string, unknown>;
  const entries = Object.entries(mcpServers);
  const [skipped, added] = [
    entries.filter(([n]) => n in current && !force).map(([n]) => n),
    entries.filter(([n]) => !(n in current) || force).map(([n]) => n),
  ];
  const next = {
    ...current,
    ...Object.fromEntries(
      entries.filter(([n]) => added.includes(n)).map(([n, s]) => [n, t.adapt?.(s) ?? s]),
    ),
  };

  if (!dryRun && added.length) await writeJson(file, { ...doc, [t.key]: next });
  return { file, added, skipped };
};
