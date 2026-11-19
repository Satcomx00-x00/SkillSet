import type { z } from 'zod';
import { parseWith } from './io.ts';
import type { Topic } from './schema.ts';

export const DEFAULT_REPO = process.env.SKILLSET_REPO ?? 'Satcomx00-x00/SkillSet';

export const rawUrl = (repo: string, ref: string, path: string): string =>
  `https://raw.githubusercontent.com/${repo}/${ref}/${path}`;

export const treeUrl = ({ repo, ref }: Pick<Topic, 'repo' | 'ref'>): string =>
  `https://github.com/${repo}/tree/${ref}`;

export const fetchJson = async <S extends z.ZodType>(
  url: string,
  schema: S,
): Promise<z.output<S> | undefined> => {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  return parseWith(schema, await res.json(), url);
};
