// Build step: snapshot every topic branch into ./bundle so `skillset --offline` never touches GitHub.
// Run with Node (type stripping) or Bun. Env: SKILLSET_BUNDLE_DIR (output dir).
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { BUNDLE_DIR, BUNDLE_MARKETPLACE, bundledTopicDir } from '../src/bundle.ts';
import { readJson } from '../src/io.ts';
import { MARKETPLACE_PATH } from '../src/registry.ts';
import { MarketplaceSchema, type Topic, toTopics } from '../src/schema.ts';

const git = (...args: string[]): string =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const tryGit = (...args: string[]): string | undefined => {
  try {
    return git(...args);
  } catch {
    return undefined;
  }
};

const bundleRef = ({ repo, ref }: Pick<Topic, 'repo' | 'ref'>) =>
  `refs/skillset-bundle/${repo}/${ref}`;

/** One shallow fetch per source repo; falls back to local branches when the network is unavailable. */
const fetchTopics = (topics: readonly Topic[]): void => {
  for (const repo of new Set(topics.map((t) => t.repo))) {
    const specs = topics
      .filter((t) => t.repo === repo)
      .map((t) => `+refs/heads/${t.ref}:${bundleRef(t)}`);
    if (
      tryGit('fetch', '--depth=1', '--no-tags', `https://github.com/${repo}.git`, ...specs) ===
      undefined
    )
      console.warn(`⚠ fetch ${repo} failed; using local branches`);
  }
};

const resolveCommit = (t: Topic): string => {
  const candidates = [bundleRef(t), `refs/remotes/origin/${t.ref}`, `refs/heads/${t.ref}`];
  for (const c of candidates) {
    const sha = tryGit('rev-parse', '--verify', '--quiet', `${c}^{commit}`);
    if (sha) return sha;
  }
  throw new Error(
    `topic "${t.name}": branch ${t.repo}@${t.ref} not found (tried ${candidates.join(', ')})`,
  );
};

/** `git archive` (tracked files only, no .git) unpacked into `dir`. */
const extract = async (commit: string, dir: string): Promise<void> => {
  const tar = join(dir, '.snapshot.tar');
  git('archive', '--format=tar', '-o', tar, commit);
  execFileSync('tar', ['-xf', tar, '-C', dir]);
  await rm(tar);
};

const marketplace = await readJson(MARKETPLACE_PATH, MarketplaceSchema);
const topics = toTopics(marketplace);

fetchTopics(topics);
await rm(BUNDLE_DIR, { recursive: true, force: true });
await mkdir(BUNDLE_DIR, { recursive: true });
for (const t of topics) {
  const dir = bundledTopicDir(t.name);
  await mkdir(dir, { recursive: true });
  const commit = resolveCommit(t);
  await extract(commit, dir);
  console.log(`✔ ${t.name.padEnd(16)} ${commit.slice(0, 7)}`);
}
await copyFile(MARKETPLACE_PATH, join(BUNDLE_DIR, BUNDLE_MARKETPLACE));
console.log(`bundled ${topics.length} topics → ${BUNDLE_DIR}`);
