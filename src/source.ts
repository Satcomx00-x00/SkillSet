import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { rawUrl } from './github.ts';
import type { Topic } from './schema.ts';

/** Read-only view of a topic's files, remote (GitHub) or local (a checkout). */
export interface TopicSource {
  text(path: string): Promise<string | undefined>;
  /** Sub-directory names of `dir`, or undefined when listing isn't possible. */
  dirs(dir: string): Promise<string[] | undefined>;
}

const timeout = () => AbortSignal.timeout(15_000);

export const githubSource = ({ repo, ref }: Pick<Topic, 'repo' | 'ref'>): TopicSource => ({
  async text(path) {
    const res = await fetch(rawUrl(repo, ref, path), { signal: timeout() });
    return res.ok ? res.text() : undefined;
  },
  async dirs(dir) {
    const url = `https://api.github.com/repos/${repo}/contents/${dir}?ref=${encodeURIComponent(ref)}`;
    const res = await fetch(url, {
      signal: timeout(),
      headers: { accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return undefined;
    const items = (await res.json()) as readonly { name: string; type: string }[];
    return items.filter((i) => i.type === 'dir').map((i) => i.name);
  },
});

export const localSource = (root: string): TopicSource => ({
  text: (path) => readFile(join(root, path), 'utf8').catch(() => undefined),
  dirs: async (dir) =>
    (await readdir(join(root, dir), { withFileTypes: true }).catch(() => []))
      .filter((e) => e.isDirectory())
      .map((e) => e.name),
});
