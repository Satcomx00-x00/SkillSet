import { join } from 'node:path';
import { BUNDLE_MARKETPLACE } from './bundle.ts';
import { fetchJson, rawUrl } from './github.ts';
import { exists, readJson } from './io.ts';
import { type Marketplace, MarketplaceSchema, type Topic, toTopics } from './schema.ts';

export const MARKETPLACE_PATH = '.claude-plugin/marketplace.json';

export interface Registry {
  list(): Promise<readonly Topic[]>;
  get(name: string): Promise<Topic>;
}

type Loader = () => Promise<Marketplace>;

const fromLoader = (load: Loader): Registry => {
  let cache: Promise<Topic[]> | undefined;
  const list = () => (cache ??= load().then(toTopics));
  return {
    list,
    async get(name) {
      const topics = await list();
      const hit = topics.find((t) => t.name === name);
      if (!hit)
        throw new Error(
          `Unknown topic "${name}". Available: ${topics.map((t) => t.name).join(', ')}`,
        );
      return hit;
    },
  };
};

export const remoteRegistry = (repo: string, ref = 'main'): Registry =>
  fromLoader(async () => {
    const url = rawUrl(repo, ref, MARKETPLACE_PATH);
    const m = await fetchJson(url, MarketplaceSchema);
    if (!m) throw new Error(`No marketplace at ${url}`);
    return m;
  });

export const localRegistry = (file = MARKETPLACE_PATH): Registry =>
  fromLoader(() => readJson(file, MarketplaceSchema));

/** The marketplace snapshot embedded at build time (see `scripts/bundle.ts`). */
export const bundledRegistry = (root: string): Registry =>
  fromLoader(async () => {
    const file = join(root, BUNDLE_MARKETPLACE);
    if (!(await exists(file)))
      throw new Error(
        `--offline: this build has no bundled topics (${file}). Rebuild with \`npm run build\`.`,
      );
    return readJson(file, MarketplaceSchema);
  });
