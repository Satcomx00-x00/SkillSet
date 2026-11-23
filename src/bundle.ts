import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Topics embedded at build time (`scripts/bundle.ts`) for `--offline`: `<root>/marketplace.json`
 * plus one `<root>/<topic>/` snapshot per branch. Resolves to `<package>/bundle` from `src/` and `dist/`.
 */
export const BUNDLE_DIR =
  process.env.SKILLSET_BUNDLE_DIR ?? fileURLToPath(new URL('../bundle/', import.meta.url));

export const BUNDLE_MARKETPLACE = 'marketplace.json';

export const bundledTopicDir = (name: string, root: string = BUNDLE_DIR): string =>
  join(root, name);
